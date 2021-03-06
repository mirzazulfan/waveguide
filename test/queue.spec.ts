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

import * as fc from "fast-check";
import { Do } from "fp-ts-contrib/lib/Do";
import { array } from "fp-ts/lib/Array";
import {setoidString} from "fp-ts/lib/Setoid";
import { io } from "../src/io";
import { boundedQueue, unboundedQueue } from "../src/queue";
import { assertEq } from "./tools.spec";

const assertStringEq = assertEq(setoidString);

describe("ConcurrentQueue", function() {
  this.timeout(60000);
  it("elements are always consumed completely in the order they are produced", () =>
    fc.assert(
      fc.asyncProperty(
        fc.array(fc.tuple(fc.string(), fc.nat(20), fc.nat(20))),
        fc.nat(100),
        fc.nat(100),
        (ops, delayWrite, delayRead) =>
          Do(io)
            .bind("q", unboundedQueue<string>())
            .bindL("writeFiber",
              ({q}) => array.traverse(io)(ops, ([v, d]) =>
                                          q.offer(v).delay(d))
                  .delay(delayWrite)
                  .fork())
            .bindL("readFiber",
              ({q}) => array.traverse(io)(ops,
                                          ([v, _, d]) => q.take.chain(assertStringEq(v)).delay(d))
                .delay(delayRead)
                .fork())
            .doL(({writeFiber}) => writeFiber.wait)
            .doL(({readFiber}) => readFiber.join)
            .return(() => undefined)
            .unsafeRunToPromise()
      )
    )
  );
  it("elements are always consumed completely in the order they are produced -- blocking", () =>
    fc.assert(
      fc.asyncProperty(
        fc.array(fc.tuple(fc.string(), fc.nat(20), fc.nat(20))),
        fc.nat(5),
        fc.nat(100),
        fc.nat(100),
        (ops, queueSize, delayWrite, delayRead) =>
          Do(io)
            .bind("q", boundedQueue<string>(queueSize))
            .bindL("writeFiber",
              ({q}) => array.traverse(io)(ops, ([v, d]) =>
                                          q.offer(v).delay(d))
                  .delay(delayWrite)
                  .fork())
            .bindL("readFiber",
              ({q}) => array.traverse(io)(ops,
                                          ([v, _, d]) => q.take.chain(assertStringEq(v)).delay(d))
                .delay(delayRead)
                .fork())
            .doL(({writeFiber}) => writeFiber.wait)
            .doL(({readFiber}) => readFiber.join)
            .return(() => undefined)
            .unsafeRunToPromise()
      )
    )
  );
});
