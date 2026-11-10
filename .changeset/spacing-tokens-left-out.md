---
'@falkara/presentation': patch
---

`Space.spacingUnitCounts` says which tokens of the USWDS spacing scale it takes, the small and medium ones, and which it leaves out and why: the tokens of 1 and 2 px, which USWDS gives as fixed lengths rather than counts of the unit, the negative tokens, zero, and the large named tokens from card to widescreen, with which USWDS sizes widths and heights rather than spacing. `Space.scale` says it takes the counts of `spacingUnitCounts` rather than every count of the spacing unit.
