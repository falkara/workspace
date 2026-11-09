---
'@falkara/presentation': patch
---

`Color.shade` first estimates the edge of sRGB, where it reduces the chroma of a shade, on the linear channels, each a cubic in the chroma, and converts a color exactly only near the estimate, so that a shade takes about 0.7 ms rather than 1.1 ms. The shades are the same.
