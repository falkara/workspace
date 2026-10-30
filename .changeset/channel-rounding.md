---
'@falkara/presentation': minor
---

`Color.shade` returns the closest shade that reaches the contrast both exactly and once it and the background are written in hex, each sRGB channel rounded to the 8 bits most displays show and tools measure, however a channel on the edge between two steps rounds, so that a shade at the edge of the contrast no longer falls just below it in a hex-based checker. `Color.verify` and `Color.reaches` take `channelBits`, from 1 to 16, to judge colors as a display or a tool holding channels in that many bits shows and measures them, `verify` then returning the contrast of the rounded colors. `Color.encodedTransferThreshold` holds the encoded value up to which CSS Color 4 reads an sRGB channel as linear.
