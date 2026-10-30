---
'@falkara/presentation': patch
---

`Fluid.clamp` writes a value whose sizes are written alike as their rem length alone, such as `1rem`, instead of `clamp(1rem, 1rem + 0vw, 1rem)`, which never changes either.
