---
'@falkara/presentation': minor
---

The `Fraction` module is removed, and every exact value is a `Rational` of Effect, which keeps it in lowest terms. `Typography.scale`, `Space.scale`, `Fluid.clamp` and the schemas `Typography.ScaleOptions`, `Typography.Step` and `Space.ScaleOptions` take `Rational` values, such as `Rational.makeUnsafe(6n, 5n)` or `Rational.fromBigInt(20n)`, instead of objects of a `numerator` and a `denominator`. Each schema checks the bounds its values need, so that `Fluid.clamp` refuses a minimum size that is not positive with the reason its growth is bounded as a factor of it.
