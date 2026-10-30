---
'@falkara/presentation': minor
---

`Length.layoutUnit` is split in two: `Length.finestLayoutUnit`, the 1/64 px of WebKit and Chromium, keeps the rounding of `Fluid` below the layout unit of every browser, and `Length.coarsestLayoutUnit`, the 1/60 px app unit of Gecko, sets `Typography.minimumStepFactor`, now 781/780. Its guarantee is restated as layout: a length of at least 1 em, such as the line height, falls on a different point of the layout grid in consecutive steps in every Baseline core browser. It promises nothing about how glyphs render, as browsers keep the font size itself unrounded.
