---
'@falkara/presentation': minor
---

`Color.Pair` and `Color.Brand` take the step of the type scale without its position, which the contrast never reads, so that a pair written by hand needs no invented position. The step keeps its sizes and their checks, as its size at the minimum viewport width must be its smallest for the contrast it needs, and a step from `Typography.scale` still serves as it is.
