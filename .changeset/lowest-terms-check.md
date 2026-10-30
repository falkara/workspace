---
'@falkara/presentation': patch
---

`Fraction.Fraction` checks that a fraction is in lowest terms, so that `Schema.is(Fraction.Fraction)` refuses a ratio such as `{ numerator: 2n, denominator: 4n }` that was not decoded. Decoding still brings every ratio to lowest terms first.
