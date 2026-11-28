module

meta import Translator.Lean.Reify.Vector
import Falkara.Translation.Rules
import Falkara.Translation.Vectors

/-!
# Vector

The module defines the checks of the reading of the vectors of the primitives: the kernel of Lean
computes the value of a rational number and the first elements of a stream of pairs and of a
sequence, which ends before three elements.

## Implementation Notes

The checks compare the values with their expected values by `#guard_msgs` on `#eval`, as `#guard`
emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

open Translator Translator.Lean

/--
info: [Translator.Core.Expected.value (Translator.Core.Value.rational (-6) 1),
 Translator.Core.Expected.prefix
   [Translator.Core.Value.pair (Translator.Core.Value.rational 1 1) (Translator.Core.Value.rational 3 1),
    Translator.Core.Value.pair (Translator.Core.Value.rational 2 1) (Translator.Core.Value.rational 3 1),
    Translator.Core.Value.pair (Translator.Core.Value.rational 2 1) (Translator.Core.Value.rational 3 1)],
 Translator.Core.Expected.prefix [Translator.Core.Value.rational 2 1, Translator.Core.Value.rational 4 1]]
-/
#guard_msgs in
#eval show Lean.MetaM (List Core.Expected) from do
  [``Falkara.Translation.Vectors.rationalMultiply, ``Falkara.Translation.Vectors.streamZip,
      ``Falkara.Translation.Vectors.sequenceMap].mapM fun declaration ↦ do
    return (← reifyVector { primitive := .rationalMultiply, declaration }).2
