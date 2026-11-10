---
'@falkara/presentation': minor
---

`Colorimetry` defines a color apart from the media it is written in. A `Definition` gives, for any medium, a color proven to lie in its gamut, an `InGamut` of that medium, or a failure with the reason, and computes nothing until it is used. `purest({ hue, headroom })` defines the purest color of a hue in every medium, with `whiteLevel`, 1, as the default headroom; `define` takes a rule of the project's own, an effect with no requirements that ends in `inGamut`; and `byMedium` gives a definition exceptions for some media, keyed by the names of `media`, matched by color space on either white, with an unknown name refused by the compiler. `inMedium` evaluates a definition in one medium, and `inMedia` and `writeMedia` in every medium of `media`, or of a record a project passes, such as the media on the exact white, keeping its names; a failure names every medium it arose in, as a `FailedInMedium`. `inGamut` decides exactly whether a color lies in the gamut of a medium and names the channel that leaves it, as an `OutOfGamut`.

What consumers of 0.9.0 change:

- `purestColor({ hue, medium, headroom })` becomes `inMedium(purest({ hue, headroom }), medium)`, and `PurestColorOptions` becomes `PurestOptions`, without the medium. A brand written for every medium becomes `writeMedia(purest({ hue }))`.
- `write` takes only a color proven to lie in the gamut of the same medium, on the same white, as `inMedium` or `inGamut` gives it, so that nothing reaches CSS outside a gamut.
- `isInGamut(medium, color)` becomes `Exit.isSuccess(inGamut(medium, color))`, which also gives the reason a color lies outside.
