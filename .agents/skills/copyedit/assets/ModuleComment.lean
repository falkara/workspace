/-!
# <The title names what the module defines, as the name of the module names it, and a module of the tests takes the title of the module its checks concern, such as Observer for both `Observer.lean` and the tests of the module.>

<The summary opens with "The module defines" and names in one or two sentences what the module defines, leaving to the comments of the declarations what each of them is, such as "The module defines the observer as the CIE 1931 standard colorimetric observer by its color-matching functions $\bar{x}$, $\bar{y}$, and $\bar{z}$.", or for a module of the tests "The module defines the checks of the observer against the data table of the color-matching functions.">

## Main Definitions

- <Every item names a definition, a structure, or a type of the module in backticks, followed by a colon and the few words that tell it apart from the other items, leaving the rest to the comment of the declaration, such as "`observer`: the CIE 1931 standard colorimetric observer.">

## Main Statements

- <Every item names a theorem of the module in backticks, followed by a colon and the few words that tell it apart from the other items, leaving the rest to the comment of the theorem, such as "`length_illuminant`: the number of rows of the illuminant.">

## Notation

- <Every item names a symbol that the comments of the module use and the summary leaves unnamed, with the term the symbol stands for, such as "$\delta^*$ for the iterated transition function.">

## Implementation Notes

<Every note states a choice the definitions of the module carry out that neither the code nor its citations tell, a representation, a choice among equivalent definitions, a deviation from a work the module cites, or the way a proof is computed, and the reason for the choice where the reason is not evident, never why a declaration or its export bears its name, nor what the generator writes as TypeScript, such as "The checks are proved by `decide +kernel`, as `decide` reaches the maximum recursion depth of the elaborator on 471 rows and `native_decide` proves every statement by an axiom of its own, which asserts the result the compiler computes and lies beyond `propext`, `Classical.choice`, and `Quot.sound`.">
-/
