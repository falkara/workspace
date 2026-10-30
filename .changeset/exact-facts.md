---
'@falkara/presentation': minor
---

Every fact that the library derives fractions from is itself a fraction, such as `Viewport.minimumViewportWidth`, `Typography.defaultFontSize` or `Length.layoutUnit`, and every value that follows from them is derived by fraction arithmetic alone, so that a fact that is not a whole number, such as a viewport width factor of 15/4, gives exact values instead of failing as the module loads. Read a fact as a number with `Fraction.toNumber`.
