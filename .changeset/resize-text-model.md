---
'@falkara/presentation': patch
---

The messages of `Typography.scale`, `Typography.Step`, `Space.scale` and `Fluid.clamp` that bound how fast text grows say that text can be enlarged to 200 %, as WCAG 2.2 Resize Text requires, within the 300 % page zoom of Safari, the lowest maximum among the Baseline core browsers, instead of attributing the page zoom of Safari to WCAG 2.2, which requires the 200 % alone.
