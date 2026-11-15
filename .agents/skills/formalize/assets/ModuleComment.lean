/-!
# <The title names what the module defines, as the name of the module names it, and a module of the tests takes the title of the module its checks concern, such as Observer for both `Observer.lean` and the tests of the module.>

<The summary opens with "The module defines", names what the module defines and what the thing is made of, and states in further sentences what holds of the thing, such as "The module defines the observer as the CIE 1931 standard colorimetric observer by its color-matching functions $\bar{x}$, $\bar{y}$, and $\bar{z}$ at wavelengths from 360 nm to 830 nm in steps of 1 nm.", or for a module of the tests "The module defines the checks of the observer against the data table [cie2019colorMatchingFunctions]. The checks compare the sum of the wavelengths $\lambda$ and the values at one sample wavelength with the validation values of the data table.">

## Notation

- <Every item names a symbol that the comments of the module use and the summary leaves unnamed, with the term the symbol stands for, such as "$\delta^*$ for the iterated transition function.">

## Implementation Notes

<Every note states a choice the definitions of the module carry out, a representation, a choice among equivalent definitions, a deviation from a work the module cites, or the way a proof is computed, and the reason for the choice, such as "The checks are proved by `decide +kernel`, as `decide` reaches the maximum recursion depth of the elaborator on 471 rows and `native_decide` proves every statement by an axiom of its own, which asserts the result the compiler computes and lies beyond `propext`, `Classical.choice`, and `Quot.sound`.">
-/
