// Copyright 2019 Ryan Zeigler
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Either, left, right } from "fp-ts/lib/Either";
import { Function2 } from "fp-ts/lib/function";
import { Deferred, makeDeferred } from "./deferred";
import { abort, IO, succeed, unit } from "./io";
import { makeRef, Ref } from "./ref";
import { nonNegative } from "./sanity";
import { Dequeue, empty, of } from "./support/dequeue";
import { Ticket, ticketExit, ticketUse } from "./ticket";

export interface ConcurrentQueue<A> {
  readonly take: IO<never, A>;
  offer(a: A): IO<never, void>;
}

type State<A> = Either<Dequeue<Deferred<void, A>>, Dequeue<A>>;
const initial = <A>(): State<A> => right(empty());

class ConcurrentQueueImpl<A> implements ConcurrentQueue<A> {
  public readonly take: IO<never, A>;
  constructor(public readonly state: Ref<State<A>>,
              public readonly factory: IO<never, Deferred<never, A>>,
              public readonly overflowStrategy: Function2<Dequeue<A>, A, Dequeue<A>>) {
      this.take = factory.chain((latch) =>
        this.state.modify((current) =>
          current.fold(
            (waiting) => [
              new Ticket(latch.wait, this.cleanupLatch(latch)),
              left(waiting.offer(latch)) as State<A>
            ] as const,
            (ready) => ready.take()
              .map(([next, q]) => [new Ticket(succeed(next), unit), right(q) as State<A>] as const)
              .getOrElseL(() => [
                new Ticket(latch.wait, this.cleanupLatch(latch)),
                left(of(latch)) as State<A>
              ] as const)
          )
        ).bracketExit(ticketExit, ticketUse)
      );
  }
  public offer(a: A): IO<never, void> {
    return this.state.modify((current) =>
      current.fold(
        (waiting) => waiting.take()
          .map(([next, q]) => [next.succeed(a), left(q) as State<A>] as const)
          .getOrElseL(() => [unit, right(this.overflowStrategy(empty(), a)) as State<A>] as const),
        (available) => [unit, right(this.overflowStrategy(available, a)) as State<A>] as const
      )
    ).flatten().uninterruptible();
  }

  private cleanupLatch(latch: Deferred<never, A>): IO<never, void> {
    return this.state.update((current) =>
      current.fold(
        (waiting) => left(waiting.filter((item) => item !== latch)),
        (available) => right(available)
      )
    ).unit();
  }
}

const unboundedOffer = <A>(queue: Dequeue<A>, a: A): Dequeue<A> => queue.offer(a);

const slidingOffer = (n: number) => <A>(queue: Dequeue<A>, a: A): Dequeue<A> =>
  queue.size() >= n ? queue.take().map((t) => t[1]).getOrElse(queue).offer(a) : queue.offer(a);

const droppingOffer = (n: number) => <A>(queue: Dequeue<A>, a: A): Dequeue<A> =>
  queue.size() >= n ? queue : queue.offer(a);

export function unboundedQueue<A>(): IO<never, ConcurrentQueue<A>> {
  return makeRef(initial<A>())
    .map((ref) => new ConcurrentQueueImpl(ref, makeDeferred<never, A>(), unboundedOffer));
}

const nonNegativeCapacity = nonNegative(new Error("Die: negative capacity"));

export function slidingQueue<A>(capacity: number): IO<never, ConcurrentQueue<A>> {
  return nonNegativeCapacity(capacity)
    .applySecond(
      makeRef(initial<A>())
        .map((ref) => new ConcurrentQueueImpl(ref, makeDeferred<never, A>(), slidingOffer(capacity)))
    );
}

export function droppingQueue<A>(capacity: number): IO<never, ConcurrentQueue<A>> {
  return nonNegativeCapacity(capacity)
    .applySecond(
      makeRef(initial<A>())
        .map((ref) => new ConcurrentQueueImpl(ref, makeDeferred<never, A>(), droppingOffer(capacity)))
    );
}
