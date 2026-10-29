---
'@falkara/presentation': minor
---

Every `Fraction` is in lowest terms: decoding reduces it, its type is branded, and every operation keeps it so by cancelling before it multiplies, which keeps the arithmetic fast and the call stack shallow for whole numbers of any size. `Fraction.toNumber` rounds a fraction of any size to the nearest number, ties to even, as IEEE 754 does. The type scales take their options as written, before decoding.
