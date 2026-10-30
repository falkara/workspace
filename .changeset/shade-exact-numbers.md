---
'@falkara/presentation': patch
---

`Color.shade` writes each number of the shade as JavaScript writes it, the shortest form that reads back as the same number, with an exponent for a small one, which CSS reads as well, instead of sixteen decimal places, which wrote a lightness of 0.08691023952433169 as 0.0869102395243317, another number than the shade it found.
