module

public meta import Falkara.Translation
public meta import Translator.Lean.Elaborate.Term

/-!
# Term

The module defines the checks of the translation of term trees into the core: a pair as a record
where its type names its fields, a component of a tuple by its index, the first element of a stream
that the test draws as the first element of its data, the map of a stream by a component of a pair
as a function of `value`, and a function of the theory on its explicit arguments, while a zip by a
function other than the pair constructor, the first element of a stream that the test does not
draw, a primitive that the target does not implement, and a constant of which nothing tells refuse
with the reason.

## Implementation Notes

The checks compare the translations with their expected values by `#guard_msgs` on `#eval`, as
`#guard` emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

public section

open Translator Translator.Lean

/-- The rules that the checks translate by, as the list of the rules of the translator gives
them. -/
meta def termRules : List Falkara.Translation.Rule :=
  [{ constant := `Prod.mk, arity := 4, domain := none, action := .structural .pair },
    { constant := `Prod.fst, arity := 3, domain := none, action := .structural .first },
    { constant := `Stream'.head, arity := 2, domain := none, action := .structural .head },
    { constant := `Stream'.map, arity := 4, domain := none, action := .primitive .streamMap },
    { constant := `Stream'.zip, arity := 6, domain := none, action := .primitive .streamZip },
    { constant := `Stream'.Seq.destruct, arity := 2, domain := none,
      action := .primitive .sequenceDestruct }]

/-- The context that the checks translate in, with one stream that the test draws. -/
meta def termContext : Elaborate.TermContext := {
  rules := termRules
  streams := ["keys"]
  unavailable := fun
    | .sequenceDestruct => some "a sequence has no first element in a test"
    | _ => none }

/-- Gives the tree of an argument, explicit or not, at a placeholder source. -/
meta def argumentOf (explicit : Bool) (tree : TermTree) : TermArgument :=
  .mk tree explicit

/-- Gives the tree of a local at a source of its name. -/
meta def localOf (name : String) : TermTree :=
  .bound name (.const (.mkSimple name) [])

/--
info: Except.ok [Translator.Core.Term.pair
   (some ("tone", "next"))
   (Translator.Core.Term.bound "x")
   (Translator.Core.Term.bound "y"),
 Translator.Core.Term.element (Translator.Core.Term.bound "pair") 0,
 Translator.Core.Term.element (Translator.Core.Term.sample "keys") 0,
 Translator.Core.Term.primitive
   (Falkara.Translation.Primitive.streamMap)
   [Translator.Core.Term.lambda "value" (Translator.Core.Term.element (Translator.Core.Term.bound "value") 0),
    Translator.Core.Term.bound "keys"],
 Translator.Core.Term.global
   { declaration := `play, module := `Organ, words := ["play"], takesModuleName := false }
   [Translator.Core.Term.bound "organ"]]
-/
#guard_msgs in
#eval [TermTree.apply `Prod.mk .plain
      [argumentOf false (localOf "A"), argumentOf false (localOf "B"),
        argumentOf true (localOf "x"), argumentOf true (localOf "y")]
      (some [(`fst, "tone"), (`snd, "next")]) (.const `pair []),
    .apply `Prod.fst .plain
      [argumentOf false (localOf "A"), argumentOf false (localOf "B"),
        argumentOf true (localOf "pair")]
      none (.const `first []),
    .apply `Stream'.head .plain [argumentOf false (localOf "A"), argumentOf true (localOf "keys")]
      none (.const `head []),
    .apply `Stream'.map .plain
      [argumentOf false (localOf "A"), argumentOf false (localOf "B"),
        argumentOf true (.apply `Prod.fst .plain
          [argumentOf false (localOf "A"), argumentOf false (localOf "B")] none (.const `fst [])),
        argumentOf true (localOf "keys")]
      none (.const `map []),
    .apply `play (.function { declaration := `play, module := `Organ, words := ["play"] })
      [argumentOf false (localOf "A"), argumentOf true (localOf "organ")] none (.const `play [])
  ].mapM (TermTree.toTerm termContext 16) |>.mapError fun _ ↦ "refused"

/--
error: `zip` has no expression in a test of TypeScript, as a test zips two streams into pairs alone and `choose` is no `Prod.mk`.
---
error: `head` has no expression in a test of TypeScript, as the first element of a stream that the test does not draw takes an effect.
---
error: `destruct` has no expression in a test of TypeScript, as a sequence has no first element in a test.
---
error: `unknown` has no expression in a test of TypeScript.
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  let trees := [TermTree.apply `Stream'.zip .plain
      [argumentOf false (localOf "A"), argumentOf false (localOf "B"),
        argumentOf false (localOf "C"), argumentOf true (localOf "choose"),
        argumentOf true (localOf "keys"), argumentOf true (localOf "keys")]
      none (.const `zip []),
    .apply `Stream'.head .plain [argumentOf false (localOf "A"), argumentOf true (localOf "rests")]
      none (.const `head []),
    .apply `Stream'.Seq.destruct .plain
      [argumentOf false (localOf "A"), argumentOf true (localOf "rests")] none
      (.const `destruct []),
    .apply `unknown .plain [argumentOf true (localOf "x")] none (.const `unknown [])]
  trees.forM fun tree ↦
    match tree.toTerm termContext 16 with
    | .ok _ => pure ()
    | .error refusal => Lean.logError refusal.render
