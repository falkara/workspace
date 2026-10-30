---
'@falkara/presentation': patch
---

`Typography.scale` works each step out from the one before it, multiplied or divided by the factors once, rather than raising the factors to the power of every position again, so that a scale at the minimum step factor, 1327 steps, takes about 35 ms rather than 225 ms. The steps are the same.
