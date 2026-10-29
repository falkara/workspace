---
'@falkara/presentation': minor
---

`Typography.scale` takes any factors at or above `Typography.minimumStepFactor`, 833/832, at which steps at the minimum font size still differ by the layout unit of browsers, with a maximum factor below, at or above the minimum factor, as Utopia does. A scale ends where the next step would shrink, grow by more than 8/5, fall below the minimum font size or rise above `Typography.maximumFontSize`, 320/3 px: the largest size at which a full-width character, one em wide as CSS Values 4 assumes it in `Typography.ideographAdvanceFactor`, still fits the minimum viewport width when a reader sets the font size to 300 %, as WCAG 2.2 Reflow requires. A step larger than that is no longer part of the scale.
