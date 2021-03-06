---
title: deferred.ts
nav_order: 2
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [Deferred (interface)](#deferred-interface)
- [makeDeferred (function)](#makedeferred-function)
- [makeDeferredC (function)](#makedeferredc-function)

---

# Deferred (interface)

**Signature**

```ts
export interface Deferred<E, A> {
  readonly wait: IO<E, A>
  interrupt: IO<never, void>
  succeed(a: A): IO<never, void>
  fail(e: E): IO<never, void>
  from(source: IO<E, A>): IO<never, void>
}
```

# makeDeferred (function)

Creates an IO that will allocate a Deferred.

**Signature**

```ts
export function makeDeferred<E, A>(): IO<never, Deferred<E, A>> { ... }
```

# makeDeferredC (function)

**Signature**

```ts
export const makeDeferredC = <E = never>() => <A>() => ...
```
