---
'@falkara/presentation': minor
---

`Fraction.sum`, `Fraction.subtract`, `Fraction.subtractUnsafe`, `Fraction.multiply`, `Fraction.divide` and `Fraction.pow` take their second operand alone as well, as the arithmetic of Effect does, so that `pipe(a, Fraction.multiply(b))` reads as `Fraction.multiply(a, b)`.
