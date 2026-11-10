---
'@falkara/presentation': minor
---

Every length a message gives is rounded to the decimal places of a CSS length, as `Fluid.clamp` writes it, so that `Typography.Step` gives a minimum size of 56/3 px as 18.66667 px rather than 18.666666666666668 px and `Typography.ScaleOptions` gives the maximum font size as 71.11111 px rather than 640/9 px. `Fluid.decimalPlaces` moves to `Typography.decimalPlaces`, beside the font sizes it rests on, so that `Typography` and `Color` round their messages without depending on `Fluid`.
