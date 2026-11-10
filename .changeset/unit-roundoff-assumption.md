---
'@falkara/presentation': patch
---

`Color` computes each cube in the conversion of Oklab as two products, which IEEE 754 rounds alike in every engine, rather than as a power, whose accuracy ECMAScript leaves to the engines, and bounds its error by those two roundings, expanded so that no subtraction cancels. Firefox and Safari already compute a cube so, and Chrome now gives the same results. `unitRoundoff` no longer claims that the engines of the Baseline core browsers compute the cosine, the sine and powers within one unit in the last place; where the bounds rest on that accuracy, they say it is assumed, as ECMAScript leaves it to LLVM libc in Chrome and to the C library of the system elsewhere.
