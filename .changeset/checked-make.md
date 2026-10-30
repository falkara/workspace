---
'@falkara/presentation': minor
---

`Fraction.make` checks its numerator and denominator and returns an `Exit`, failing with the reason when either is not positive, so that no fraction breaks the promise of its type. `Fraction.makeUnsafe` builds a fraction of values known to be positive without checking them, as the constants of the library do. A type scale takes its options as plain objects, such as `{ numerator: 6n, denominator: 5n }`, and checks them itself.
