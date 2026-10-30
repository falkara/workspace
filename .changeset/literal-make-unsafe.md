---
'@falkara/presentation': patch
---

`Fraction.makeUnsafe` refuses a literal that is not positive, such as `-1n` or `0n`, as the code is written.
