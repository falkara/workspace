module

meta import Lean.Elab.Term
meta import Lean.Parser.Term
meta import Translator.Main
meta import Translator.Target.Lean.Print
import Falkara.Translation.Rules
import all Falkara.References
import all Falkara.Simulation.Coalgebra
import all Falkara.Simulation.Functor
import all Falkara.Simulation.Coalgebra.DeterministicAutomaton
import all Falkara.Simulation.Coalgebra.MealyMachine
import all Falkara.Simulation.Coalgebra.ResumptionCoalgebra
import all Falkara.Simulation.Coalgebra.SequenceCoalgebra
import all Falkara.Simulation.Coalgebra.StreamCoalgebra
import all Falkara.Simulation.Functor.BinaryCoproductFunctor
import all Falkara.Simulation.Functor.BinaryProductFunctor
import all Falkara.Simulation.Functor.EffectFunctor
import all Falkara.Simulation.Functor.ExponentFunctor

/-!
# Round Trip

The module defines the round trip of the translator over every declaration of Falkara Simulation
that the theory gives a counterpart in TypeScript: the core of a declaration printed back into Lean
and closed against the declaration it was read from by `rfl`, where the core has a term of Lean.
The object of every functor, type constructor, and curried functor at a type closes by `rfl` but
that of the functor of the exponents, whose morphism of the category of types the core takes for a
function, while Mathlib wraps the function in a structure of one field, `TypeCat.Hom`, and a
bundled structure, a class of functors, and a function have no term of Lean that the core gives,
each for its reason.

## Implementation Notes

The check closes a printed object against the object that the reading takes it from, the object of
the functor at a local type, by the definitional equality that `rfl` decides, which unfolds the
declarations of the theory and of Mathlib.

A bundled structure and a class of functors are declarations of fields rather than terms, and the
signature of a function takes a type parameter for every field whose value is a type of a bundled
structure that it takes, a form that no type of Lean has, so neither has a term to close.

The checks compare the results with their expected values by `#guard_msgs` on `#eval`, as `#guard`
emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

open Translator Translator.Lean

/--
info: [("Falkara.Simulation.Coalgebra", "a bundled structure is a declaration of fields"),
  ("Falkara.Simulation.Functor", "a class of functors is a declaration of fields"),
  ("Falkara.Simulation.Functor.id", "rfl"), ("Falkara.Simulation.Functor.comp", "rfl"),
  ("Falkara.Simulation.Functor.const", "rfl"), ("Falkara.Simulation.binaryProductFunctor", "rfl"),
  ("Falkara.Simulation.exponentFunctor", "`((exponent : Exponent) → target)` differs"),
  ("Falkara.Simulation.MealyMachine", "a bundled structure is a declaration of fields"),
  ("Falkara.Simulation.MealyMachine.behavior", "a function unbundles its systems"),
  ("Falkara.Simulation.MealyMachine.steps", "a function unbundles its systems"),
  ("Falkara.Simulation.MealyMachine.mapOutput", "a function unbundles its systems"),
  ("Falkara.Simulation.MealyMachine.mapInput", "a function unbundles its systems"),
  ("Falkara.Simulation.MealyMachine.series", "a function unbundles its systems"),
  ("Falkara.Simulation.MealyMachine.parallel", "a function unbundles its systems"),
  ("Falkara.Simulation.DeterministicAutomaton", "a bundled structure is a declaration of fields"),
  ("Falkara.Simulation.DeterministicAutomaton.behavior", "a function unbundles its systems"),
  ("Falkara.Simulation.DeterministicAutomaton.mapOutput", "a function unbundles its systems"),
  ("Falkara.Simulation.DeterministicAutomaton.mapInput", "a function unbundles its systems"),
  ("Falkara.Simulation.DeterministicAutomaton.toMealyMachine", "a function unbundles its systems"),
  ("Falkara.Simulation.SequenceCoalgebra", "a bundled structure is a declaration of fields"),
  ("Falkara.Simulation.SequenceCoalgebra.behavior", "a function unbundles its systems"),
  ("Falkara.Simulation.SequenceCoalgebra.steps", "a function unbundles its systems"),
  ("Falkara.Simulation.SequenceCoalgebra.mapOutput", "a function unbundles its systems"),
  ("Falkara.Simulation.binaryCoproductFunctor", "rfl"),
  ("Falkara.Simulation.ResumptionCoalgebra", "a bundled structure is a declaration of fields"),
  ("Falkara.Simulation.ResumptionCoalgebra.toSequenceCoalgebra", "a function unbundles its systems"),
  ("Falkara.Simulation.ResumptionCoalgebra.behavior", "a function unbundles its systems"),
  ("Falkara.Simulation.ResumptionCoalgebra.steps", "a function unbundles its systems"),
  ("Falkara.Simulation.StreamCoalgebra", "a bundled structure is a declaration of fields"),
  ("Falkara.Simulation.StreamCoalgebra.behavior", "a function unbundles its systems"),
  ("Falkara.Simulation.StreamCoalgebra.steps", "a function unbundles its systems"),
  ("Falkara.Simulation.StreamCoalgebra.mapOutput", "a function unbundles its systems"),
  ("Falkara.Simulation.StreamCoalgebra.toMealyMachine", "a function unbundles its systems"),
  ("Falkara.Simulation.EffectFunctor", "rfl")]
-/
#guard_msgs in
#eval show Lean.Elab.TermElabM (List (String × String)) from do
  let rules ← rulesOf
  let environment ← Lean.getEnv
  let modules := environment.header.moduleNames.toList.filter (`Falkara.Simulation).isPrefixOf
  let names := modules.flatMap fun module ↦ (Source.moduleOf environment module).declarations
  names.mapM fun name ↦ do
    -- The printed object closes against the object of the reading by `rfl`.
    let close := fun (parameters : List Lean.Expr) (object : Core.TypeTerm)
        (original : Lean.Expr) ↦ do
      let functors ← parameters.filterMapM fun parameter ↦ do
        if isFunctorType rules (← Lean.Meta.inferType parameter) then
          return some (← binderNameOf parameter)
        return none
      match LeanTarget.TypeTerm.toLean { rules, functors, target := "target" } object with
      | .error reason => return reason
      | .ok text =>
        let .ok parsed := Lean.Parser.runParserCategory (← Lean.getEnv) `term text
          | return s!"the text `{text}` does not parse"
        let printed ← Lean.instantiateMVars (← Lean.Elab.Term.elabTerm parsed none)
        return if ← Lean.Meta.isDefEq printed original then "rfl" else s!"`{text}` differs"
    let declarations ← declarationsOf `Falkara.Simulation name
    let object := declarations.findSome? fun
      | .lambda _ _ _ object | .curried _ _ _ _ object _ => some object
      | _ => none
    let result ← match ← kindOf name, object with
      | .functor, some object =>
        parametersOf rules (← Lean.getConstInfo name) fun parameters rest value ↦ do
          let some value := value | return "the functor has no value"
          lambdaObjectOf rules value rest fun _ original ↦ close parameters.toList object original
      | .typeConstructor, some object =>
        parametersOf rules (← Lean.getConstInfo name) fun parameters rest value ↦ do
          let (some value, .forallE _ domain _ _) := (value, rest)
            | return "the type constructor has no value"
          Lean.Meta.withLocalDeclD `target domain fun target ↦
            close parameters.toList object (Lean.mkApp value target)
      | .curriedFunctor, some object =>
        parametersOf rules (← Lean.getConstInfo name) fun parameters rest value ↦ do
          let (some value, some targetType) := (value, curriedTargetOf? rules rest)
            | return "the curried functor has no value"
          curriedObjectOf rules name value rest fun parameter functor ↦
            lambdaObjectOf rules functor targetType fun _ original ↦
              close (parameters.toList ++ [parameter]) object original
      | .bundled, _ => pure "a bundled structure is a declaration of fields"
      | .functorClass, _ => pure "a class of functors is a declaration of fields"
      | .function, _ => pure "a function unbundles its systems"
      | _, _ => pure "the declaration has no term of the core"
    return (name.toString, result)
