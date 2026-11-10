---
'@falkara/presentation': minor
---

`Fluid.clamp` takes the sizes as one object, `{ minimumSize, maximumSize }`, rather than as two arguments, so that a step of `Typography.scale` or `Space.scale` passes as it is, as in `Effect.forEach(steps, Fluid.clamp)`. The schema of the sizes is exported as `Fluid.Sizes`, with its type.
