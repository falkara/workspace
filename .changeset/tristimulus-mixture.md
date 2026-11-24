---
'@falkara/presentation': minor
---

`Tristimulus` adds and scales tristimulus values as the theory of the library defines them and proves of them that the tristimulus values of a mixture of stimuli are the sums of theirs, as Grassmann's laws state. `Tristimulus.add(first, second)` gives the additive mixture, the sums of the amounts, and `Tristimulus.scale(tristimulus, factor)` gives the products of the factor and the amounts. Both take the data-last form of Effect as well, as `pipe(color, Tristimulus.add(light))`. `Direction` is gone with `Colorimetry.add` and `Colorimetry.scale`, which took it: the `direction` of a `Hue` is a `Tristimulus`, below 0 for a complementary wavelength, as the theory holds a change of a color as tristimulus values, so a hue is moved along with `Tristimulus.add(color, Tristimulus.scale(hue.direction, amount))`, and the type of a change no longer keeps it from being written as a color.
