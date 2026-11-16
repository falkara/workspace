---
'@falkara/presentation': minor
---

`Colorimetry` adds and scales tristimulus values as the theory of the library defines them and proves of them that the tristimulus values of a mixture of stimuli are the sums of theirs, as Grassmann's laws state. `tristimulusAdd(first, second)` gives the additive mixture, the sums of the amounts, and `tristimulusScale(tristimulus, factor)` gives the products of the factor and the amounts. `Direction` is gone with `add` and `scale`, which took it: the `direction` of a `Hue` is a `Tristimulus`, below 0 for a complementary wavelength, as the theory holds a change of a color as tristimulus values, so a hue is moved along with `tristimulusAdd(color, tristimulusScale(hue.direction, amount))`, and the type of a change no longer keeps it from being written as a color.
