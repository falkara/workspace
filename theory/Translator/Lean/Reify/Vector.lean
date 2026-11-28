/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Lean.Meta.Basic
public import Translator.Lean.Tree.Term

import Translator.Lean.Evaluate
import Translator.Lean.Reify
import Translator.Lean.Reify.Term

/-!
# Vector

The module defines the reading of a vector of a primitive: the tree of the term that its closed
declaration gives, and the value that the kernel of Lean computes for it, the values of its first
three elements where it is a stream or a sequence.

## Implementation Notes

A stream never ends, so a vector compares a prefix of it, of three elements, as a vector repeats
a value from its third element on, and a sequence that ends before takes its every element.
-/

public section

namespace Translator.Lean

/-- Gives the tree of the term that the declaration of a vector gives and the value that the kernel
of Lean computes for it, or refuses with the reason where the declaration has no value or the
kernel computes none. -/
def reifyVector (vector : Falkara.Translation.Vector) :
    Lean.MetaM (TermTree × Core.Expected) := do
  let rules ← rulesOf
  let environment ← Lean.getEnv
  let information ← Lean.getConstInfo vector.declaration
  let some value := information.value?
    | Lean.throwError (Refusal.render (.noValue vector.declaration information.type))
  let tree ← reifyTerm rules .anonymous (fuelOf value) (some information.type) value
  let expression := Lean.mkConst vector.declaration
  let expected ← match information.type with
    | .app (.const former _) _ =>
      if Falkara.Translation.formerOf? rules former == some .stream ||
          Falkara.Translation.formerOf? rules former == some .sequence then
        pure (Evaluate.prefixOf environment .anonymous vector.declaration unfoldingDepth
          information.type expression 3 |>.map Core.Expected.prefix)
      else pure (Evaluate.valueOf environment .anonymous vector.declaration unfoldingDepth
        information.type expression |>.map Core.Expected.value)
    | type => pure (Evaluate.valueOf environment .anonymous vector.declaration unfoldingDepth
        type expression |>.map Core.Expected.value)
  match expected with
  | .ok expected => return (tree, expected)
  | .error refusal => Lean.throwError refusal.render

end Translator.Lean
