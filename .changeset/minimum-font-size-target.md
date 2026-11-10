---
'@falkara/presentation': patch
---

`Typography.minimumFontSize` says that it takes the smallest size of the USWDS theme type scale, 13 px, as a CSS font size, while USWDS sets it as a target for a typeface whose capitals are 0.362 em high and writes the font size of each typeface scaled to that cap height, about 13.84 px for Source Sans Pro and 12.68 px for Merriweather.
