/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Lean.Elaborate.Term

/-!
# Theorem

The module defines the translation of the tree of a theorem into a specification of the core: the
variables as the tree draws them, and the sides of every hypothesis, every `have`, and the
conclusion as terms, which take the streams that the test draws, or the refusal of the first term
without a translation.

## Implementation Notes

Every term takes fuel for a step of every level of its expression and a fixed number beyond, as the
depth of a tree is at most the depth of the expression that it reads, which Lean approximates up to
a bound.
-/

public section

namespace Translator.Lean

/-- Gives the specification of the core that the tree of a theorem takes, given what a translation
of a term knows but the streams, or refuses with the reason. -/
def TheoremTree.toSpecification (context : Elaborate.TermContext) (tree : TheoremTree) :
    Except Refusal Core.Specification := do
  let streams := tree.variables.filterMap fun
    | .stream name .. => some name
    | _ => none
  let translate := fun (term : TermTree) ↦
    term.toTerm { context with streams } (term.source.approxDepth.toNat + 256)
  let hypotheses ← tree.hypotheses.mapM fun (equal, left, right) ↦ do
    return { equal, left := ← translate left, right := ← translate right }
  let haves ← tree.haves.mapM fun (name, value) ↦ do return (name, ← translate value)
  let left ← translate tree.left
  let right ← translate tree.right
  -- The documentation comes after every term, so a theorem without a test refuses for the reason
  -- of its terms before the lack of a comment.
  return {
    name := tree.name
    documentation := ← tree.documentation
    variables := tree.variables
    hypotheses
    haves
    left
    right
    comparison := tree.comparison }

end Translator.Lean
