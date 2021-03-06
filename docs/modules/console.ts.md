---
title: console.ts
nav_order: 1
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [error (function)](#error-function)
- [log (function)](#log-function)
- [warn (function)](#warn-function)

---

# error (function)

Suspend console.error in an IO

**Signature**

```ts
export function error(msg: string): IO<never, void> { ... }
```

# log (function)

Suspend console.log in an IO

**Signature**

```ts
export function log(msg: string): IO<never, void> { ... }
```

# warn (function)

Suspend console.warn in an IO

**Signature**

```ts
export function warn(msg: string): IO<never, void> { ... }
```
