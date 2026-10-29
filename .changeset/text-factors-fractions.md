---
'@falkara/presentation': minor
---

The line height, paragraph spacing and text spacing factors of `Typography` are fractions, as every other ratio the library derives, so that `paragraphSpacingFactor` is exactly 9/4 and a factor such as 3/25 is held exactly rather than rounded to a number. `Fraction.toNumber` writes one into CSS.
