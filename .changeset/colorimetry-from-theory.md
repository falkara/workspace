---
'@falkara/presentation': minor
---

`Tristimulus` and `Chromaticity` come from the theory of the library in Lean, each as a schema of Effect with the type it decodes, so a value from outside the library takes its brand by decoding, as `Schema.decodeUnknownExit(Chromaticity.Chromaticity)`. Their documentation comes from the theory as well, each with a link to the entry of the vocabulary of the CIE that it rests on, and `Chromaticity.ofTristimulus` has the type of its definition in the theory. A `Chromaticity` is now branded like a `Tristimulus`: chromaticity coordinates written by hand, such as the primaries of a medium, take the brand with `Chromaticity.make({ x, y })`. `Chromaticity.z` gives the third chromaticity coordinate, z = 1 − x − y.
