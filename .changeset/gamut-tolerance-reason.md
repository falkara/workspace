---
'@falkara/presentation': patch
---

`Color.gamutTolerance` gives the reason for half a step of an 8-bit channel: rounding a channel to the 8 bits of a hex color takes it back to the edge of its range, so that a color read from hex and written in oklch() with a few decimal places is not refused for leaving sRGB by less than its hex form can tell, nor a color on its edge, such as white, that the conversion puts a few units in the last place beyond it, instead of the claim that no display can show half a step, which a 10-bit display can.
