/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Generator.Import

import Generator.Comment
import Generator.Path
import Generator.Type

/-!
# Theorem

The module defines the test of TypeScript that a theorem of the theory takes, where the theory
gives it a counterpart in TypeScript, so that the module of the package that implements the
functions of the theory is bounded by the theorems as well as by the types. A theorem that holds
for every value of its variables takes a property test of `@effect/vitest`, which draws the
variables from their schemas, and a theorem with no variable takes a test of its values. A
hypothesis of the form $a = b$ or $a \neq b$ skips the values that break it, and the conclusion
$l = r$ takes `expect(actual).toEqual(expected)` with `actual` the value of $l$ and `expected` that
of $r$.

The expressions of a theorem take the functions, the constructors, and the fields of the module of
the package, imported under the name of its module of the theory, such as
`Tristimulus.add(first, second)`, and rational literals, $+$, $-$, $\cdot$, and options
from Effect. Every other expression has no form in TypeScript, and the generator refuses it.

A theorem that holds for every type takes a test at one type of three values, `0`, `1`, and `2`, in
place of every type variable and of the state space of every system that is a variable. A system,
a variable whose type is a bundled structure in the identity monad, is drawn as the table of its
structure, under the name of the variable followed by `Table`, and the test opens with a statement
that gives the system from the table by the constructor of its kind, such as
`const first = MealyMachine.make({ structure: … });`. A function from a type variable is drawn as
the table of its three values and read where the theorem names it, as
`(output: 0 | 1 | 2) => f[output]`. A stream that is a variable is drawn as a prefix of it, an
array, which has a first element where the theorem takes the first element of the stream, and is
read as `Stream.fromIterable(inputs)`. A leading `have` of the conclusion takes a statement
`const … = …;` of its own. A conclusion that equates two streams or two sequences compares a prefix
of each, as long as the stream that the test draws, or of 6 elements where it draws none, and
requires of a stream, which never ends, that its prefix has every one of these elements. The
expressions take as well the pairs, their components, the structure of a system, a morphism of the
category of types applied to a value, and the streams of Effect for `Stream'.map`, `Stream'.zip`
with `Prod.mk`, `Stream'.cons`, `Stream'.tail`, and `Stream'.head` of a stream that the test
draws.

## Implementation Notes

A test calls the module of the package rather than the generated module, so that the test bounds
the implementation, which is the only code a theorem of the theory has not proved.

The type of three values is a convention of the generator rather than a choice of a theorem, as a
theorem holds for every type and the functions of the package are generic, so that one type
stands for all, and three is the least number of values at which a function merges some values
and keeps others apart. The values index the tables as they stand.

A system and a function are drawn as data rather than as functions, so that a failing test shrinks
them and prints them as tables.

A prefix of the outputs tells of the streams as a whole, as equal streams have equal prefixes and
every function of the theory on streams is causal: its first $n$ outputs depend on the first $n$
inputs alone. Two systems of 3 states each that agree on 5 steps agree on every step, so a prefix
of 6 elements tells them apart where the test draws no stream.

A component of a pair is read by the type of the pair as `normalizedOf` gives it rather than by
the type that Lean infers, as a product that the functor of a system gives is a record in
TypeScript and any other product a tuple, and the two are one type in Lean.

The rest of a stream that the test draws is one element shorter than its prefix, so a theorem
compares it only where another element stands before it, as `Stream'.cons` puts one.

The first element and the rest of a sequence, `Stream'.Seq.destruct`, have no form in a test yet,
as a stream of Effect gives them by an effect alone.

A quotient has no form in a test, as `Rational.divide` of Effect gives an option where the division
of Lean gives 0.

A test takes a line of its own for every comment and every statement, and oxfmt formats the rest of
the generated file after the generator writes it.
-/

public section

namespace Generator

open Falkara

/-- Gives the name under which a test imports the module of the package that holds a declaration,
the last word of the name of its module of the theory. -/
def moduleAliasOf (name : Lean.Name) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  let some index := environment.getModuleIdxFor? name
    | Lean.throwError m!"`{name}` lies in no module of the theory that a test can import."
  match environment.header.moduleNames[index.toNat]? with
  | some (.str _ last) => return last
  | _ => Lean.throwError m!"`{name}` lies in no module of the theory that a test can import."

/-- Gives the type of an expression of a theorem as TypeScript reads it, as `normalizedOf` gives the
type of a declaration, so that a product that the functor of a system gives keeps the declaration
of the functor, which names its fields, where the type that Lean infers unfolds it: a variable that
a `have` binds takes the type of its value rather than the type the `have` ascribes, a morphism
applied to an argument the result of the morphism, and a component of a pair the type of the
component. -/
partial def shapeOf (expression : Lean.Expr) : Lean.MetaM Lean.Expr := do
  if let .fvar binder := expression then
    if let some value ← binder.getValue? then return ← shapeOf value
  match expression.getAppFn, expression.getAppArgs.toList with
  -- The generator imports no Mathlib, so the names of Mathlib are written as names alone.
  | .const `DFunLike.coe _, [_, _, _, _, .app _ morphism, argument] =>
    match (← shapeOf morphism).consumeMData with
    | .forallE _ _ result _ => return result.instantiate1 argument
    | shape => Lean.throwError m!"`{morphism}` is no morphism that a test can apply, as its type \
        reads as `{shape}`."
  | .const ``Prod.fst _, [_, _, pair] =>
    match (← shapeOf pair).consumeMData with
    | .app (.app (.const ``Prod _) first) _ => return first
    | shape => Lean.throwError m!"`{pair}` is no pair that a test can take apart, as its type \
        reads as `{shape}`."
  | .const ``Prod.snd _, [_, _, pair] =>
    match (← shapeOf pair).consumeMData with
    | .app (.app (.const ``Prod _) _) second => return second
    | shape => Lean.throwError m!"`{pair}` is no pair that a test can take apart, as its type \
        reads as `{shape}`."
  | _, _ => normalizedOf (← Lean.instantiateMVars (← Lean.Meta.inferType expression)).headBeta

/-- Gives the expression of TypeScript that an expression of a theorem takes, with the declarations
of the theory whose modules of the package it names, or fails with the reason where the expression
has none. A variable takes its name, or the expression that reads its value from the data that the
test draws for it where the two differ, such as `Stream.fromIterable(inputs)` for a stream. -/
partial def expressionOf (packageNamespace : Lean.Name) (drawn : List (Lean.Expr × String))
    (expression : Lean.Expr) : TypeScriptM (String × List Lean.Name) := do
  let environment ← Lean.getEnv
  if let .fvar binder := expression then
    return ((drawn.lookup expression).getD (← binder.getUserName).toString, [])
  -- Only the operands that take a form of their own are written, so a type or an instance among
  -- the arguments is never written.
  let call := fun (function : String) (operands : List Lean.Expr) (named : List Lean.Name) ↦ do
    let written ← operands.mapM (expressionOf packageNamespace drawn)
    return (s!"{function}({", ".intercalate (written.map Prod.fst)})",
      named ++ written.flatMap Prod.snd)
  let callEffect := fun (module function : String) (operands : List Lean.Expr) ↦ do
    call (← effectNameOf module function .value) operands []
  -- A component of a pair is a field of a record where the functor of a system gives the pair and
  -- its declaration names the field, such as `.output`, and an element of a tuple otherwise.
  let componentOf := fun (field : Lean.Name) (index : Nat) (shape : Lean.Expr) ↦
    match shape with
    | .mdata data _ =>
      match data.find `typescriptRecord with
      | some (.ofName declaration) =>
        s!".{(ExportTypeScript.nameOf? environment declaration field).getD field.toString}"
      | _ => s!"[{index}]"
    | _ => s!"[{index}]"
  match expression.getAppFn, expression.getAppArgs.toList with
  | .const ``Prod.mk _, [_, _, first, second] =>
    let (firstScript, firstNamed) ← expressionOf packageNamespace drawn first
    let (secondScript, secondNamed) ← expressionOf packageNamespace drawn second
    return (s!"[{firstScript}, {secondScript}]", firstNamed ++ secondNamed)
  | .const ``Prod.fst _, [_, _, pair] =>
    let (script, named) ← expressionOf packageNamespace drawn pair
    return (s!"{script}{componentOf `fst 0 (← shapeOf pair)}", named)
  | .const ``Prod.snd _, [_, _, pair] =>
    let (script, named) ← expressionOf packageNamespace drawn pair
    return (s!"{script}{componentOf `snd 1 (← shapeOf pair)}", named)
  -- The generator imports no Mathlib, so the names of Mathlib are written as names alone.
  | .const `DFunLike.coe _, [_, _, _, _, .app coercion morphism, argument] =>
    unless coercion.isAppOf `CategoryTheory.ConcreteCategory.hom do
      Lean.throwError m!"`{expression}` has no expression in a test of TypeScript."
    let (morphismScript, morphismNamed) ← expressionOf packageNamespace drawn morphism
    let (argumentScript, argumentNamed) ← expressionOf packageNamespace drawn argument
    return (s!"{morphismScript}({argumentScript})", morphismNamed ++ argumentNamed)
  | .const `Stream'.map _, [_, _, function, stream]
  | .const `Stream'.Seq.map _, [_, _, function, stream] =>
    let (streamScript, streamNamed) ← expressionOf packageNamespace drawn stream
    let (functionScript, functionNamed) ←
      match function.getAppFn, function.getAppArgs.toList, ← shapeOf stream with
      | .const ``Prod.fst _, [_, _], .app _ element =>
        pure (s!"(value) => value{componentOf `fst 0 element}", [])
      | .const ``Prod.snd _, [_, _], .app _ element =>
        pure (s!"(value) => value{componentOf `snd 1 element}", [])
      | _, _, _ => expressionOf packageNamespace drawn function
    return (s!"{← effectNameOf "Stream" "map" .value}({streamScript}, {functionScript})",
      streamNamed ++ functionNamed)
  | .const `Stream'.zip _, [_, _, _, function, first, second] =>
    unless function.isAppOfArity ``Prod.mk 2 do
      Lean.throwError m!"`{expression}` has no expression in a test of TypeScript, as a test zips \
        two streams into pairs alone and `{function}` is no `Prod.mk`."
    callEffect "Stream" "zip" [first, second]
  | .const `Stream'.cons _, [_, head, tail] =>
    let (headScript, headNamed) ← expressionOf packageNamespace drawn head
    let (tailScript, tailNamed) ← expressionOf packageNamespace drawn tail
    return (s!"{← effectNameOf "Stream" "prepend" .value}({tailScript}, [{headScript}])",
      headNamed ++ tailNamed)
  | .const `Stream'.tail _, [_, stream] =>
    let (script, named) ← expressionOf packageNamespace drawn stream
    return (s!"{← effectNameOf "Stream" "drop" .value}({script}, 1)", named)
  | .const `Stream'.head _, [_, stream] =>
    -- The first element of a stream that the test draws is the first element of its prefix.
    match stream, drawn.lookup stream with
    | .fvar binder, some _ => return (s!"{← binder.getUserName}[0]", [])
    | _, _ => Lean.throwError m!"`{expression}` has no expression in a test of TypeScript, as the \
        first element of a stream that the test does not draw takes an effect."
  | .const `Stream'.Seq.destruct _, _ =>
    Lean.throwError m!"`{expression}` has no expression in a test of TypeScript, as a stream of \
      Effect gives its first element and the rest only by an effect, which the generator does not \
      write yet."
  | .const ``OfNat.ofNat _, [.const ``Rat _, .lit (.natVal value), _] =>
    return (s!"{← effectNameOf "Rational" "fromBigInt" .value}({value}n)", [])
  | .const ``Neg.neg _, [.const ``Rat _, _, value] => callEffect "Rational" "negate" [value]
  | .const ``HAdd.hAdd _, [.const ``Rat _, _, _, _, augend, addend] =>
    callEffect "Rational" "sum" [augend, addend]
  | .const ``HSub.hSub _, [.const ``Rat _, _, _, _, minuend, subtrahend] =>
    callEffect "Rational" "subtract" [minuend, subtrahend]
  | .const ``HMul.hMul _, [.const ``Rat _, _, _, _, multiplicand, multiplier] =>
    callEffect "Rational" "multiply" [multiplicand, multiplier]
  | .const ``Option.some _, [_, value] => callEffect "Option" "some" [value]
  | .const ``Option.none _, [_] => callEffect "Option" "none" []
  | .const name _, arguments =>
    if let some projection := environment.getProjectionFnInfo? name then
      -- A field of a structure of Mathlib is written where a declaration of the theory labels the
      -- structure, such as `Coalgebra` for `CategoryTheory.Endofunctor.Coalgebra`.
      if (ExportTypeScript.exportsOf environment).any fun declared ↦
          ExportTypeScript.labels environment declared.declaration name.getPrefix then
        if let (.str _ field, some value) := (name, arguments[projection.numParams]?) then
          let (script, named) ← expressionOf packageNamespace drawn value
          return (s!"{script}.{← fieldNameOf name.getPrefix (.mkSimple field)}", named)
    if let some (.ctorInfo constructor) := environment.find? name then
      if ExportTypeScript.isExported environment constructor.induct then
        let written ←
          (arguments.drop constructor.numParams).mapM (expressionOf packageNamespace drawn)
        let fields ← (Lean.getStructureFields environment constructor.induct).toList.mapM
          (fieldNameOf constructor.induct)
        let values := (fields.zip (written.map Prod.fst)).map fun (field, value) ↦
          s!"{field}: {value}"
        return (s!"{← moduleAliasOf constructor.induct}.\
            {← constructorNameOf packageNamespace constructor.induct}\
            (\{ {", ".intercalate values} })",
          constructor.induct :: written.flatMap Prod.snd)
    if ExportTypeScript.isExported environment name &&
        !(environment.find? name matches some (.thmInfo _)) && arguments.length > 0 then
      if (← kindOf name) matches .function then
        -- A function takes its explicit arguments alone, as TypeScript infers every type.
        let information ← Lean.Meta.getFunInfoNArgs expression.getAppFn arguments.length
        let explicit := (arguments.zip information.paramInfo.toList).filterMap
          fun (argument, parameter) ↦ if parameter.isExplicit then some argument else none
        return ← call s!"{← moduleAliasOf name}.{← valueNameOf packageNamespace name}" explicit
          [name]
    Lean.throwError m!"`{expression}` has no expression in a test of TypeScript."
  | _, _ => Lean.throwError m!"`{expression}` has no expression in a test of TypeScript."

/-- The data that a property test draws for a variable of a theorem. -/
structure Drawn where
  /-- The schema of Effect from which the test draws the data. -/
  schema : String
  /-- The expression of TypeScript that reads the value of the variable from an expression of the
  data, where the data are the table of a function rather than the value itself. -/
  reader : Option (String → String)
  /-- The declarations of the theory whose modules of the package the schema names. -/
  named : List Lean.Name

/-- Gives the data that a property test draws for a variable of a type, as `normalizedOf` reads the
type, or fails with the reason where the type has none: the three values `0`, `1`, and `2` for a
type variable and for the state space of a system that is a variable, a table with a value for
each of the three for a function from a type variable, which the function reads its result from,
a record or a tuple for a product, an option, a result of Effect for a coproduct, nothing for the
type with one value, and the schema of a type of data. -/
partial def drawnOf (packageNamespace : Lean.Name) (type : Lean.Expr) : TypeScriptM Drawn := do
  let environment ← Lean.getEnv
  -- A part of an option, a tuple, or a result is data alone, as a schema of Effect draws them.
  let dataOf := fun (part : Lean.Expr) ↦ do
    let drawn ← drawnOf packageNamespace part
    if drawn.reader.isSome then
      Lean.throwError m!"`{type}` has no schema that a test can draw from, as it holds a function \
        where a test draws data alone."
    return drawn
  match type with
  | .mdata data inner =>
    -- An object that is a structure whose fields the declaration of its functor names takes a
    -- record, as `typeOf` writes its type.
    if let (some (.ofName declaration), .const structureName _) :=
        (data.find `typescriptRecord, inner.getAppFn) then
      let fields ← (← fieldTypesOf structureName inner.getAppArgs).mapM fun (field, fieldType) ↦ do
        return ((ExportTypeScript.nameOf? environment declaration field).getD field.toString,
          ← drawnOf packageNamespace fieldType)
      let schemas := fields.map fun (field, drawn) ↦ s!"{field}: {drawn.schema}"
      return {
        schema := s!"{← effectNameOf "Schema" "Struct" .value}(\{ {", ".intercalate schemas} })"
        reader := if fields.all (·.2.reader.isNone) then none else some fun table ↦
          let values := fields.map fun (field, drawn) ↦
            s!"{field}: {(drawn.reader.getD id) s!"{table}.{field}"}"
          s!"(\{ {", ".intercalate values} })"
        named := fields.flatMap (·.2.named) }
    -- The value of a morphism takes the name of its type where its type is a type parameter, as
    -- `typeOf` names it.
    if let (some _, .forallE _ (.fvar parameter) body info) :=
        (Lean.annotation? `morphism type, inner) then
      let parameterName := (← parameter.getUserName).toString
      if parameterName.all Char.isAlphanum then
        return ← drawnOf packageNamespace
          (.forallE (.mkSimple parameterName.decapitalize) (.fvar parameter) body info)
    drawnOf packageNamespace inner
  | .forallE name (.fvar parameter) body _ =>
    unless (← Lean.Meta.whnfR (← parameter.getType)).isSort && !body.hasLooseBVars do
      Lean.throwError m!"`{type}` has no schema that a test can draw from, as a test draws a \
        function from a type variable alone."
    let result ← drawnOf packageNamespace body
    let schemas := List.replicate 3 result.schema
    return {
      schema := s!"{← effectNameOf "Schema" "Tuple" .value}([{", ".intercalate schemas}])"
      reader := some fun table ↦ s!"({name.eraseMacroScopes}: 0 | 1 | 2) => \
        {(result.reader.getD id) s!"{table}[{name.eraseMacroScopes}]"}"
      named := result.named }
  | .forallE .. =>
    Lean.throwError m!"`{type}` has no schema that a test can draw from, as a test draws a \
      function from a type variable alone."
  | .const ``PUnit _ =>
    return { schema := ← effectNameOf "Schema" "Void" .value, reader := none, named := [] }
  | .const ``Rat _ =>
    return { schema := ← effectNameOf "Schema" "Rational" .value, reader := none, named := [] }
  | .app (.const ``Option _) element =>
    let drawn ← dataOf element
    return { drawn with schema := s!"{← effectNameOf "Schema" "Option" .value}({drawn.schema})" }
  | .app (.app (.const ``Prod _) first) second =>
    let (firstDrawn, secondDrawn) := (← dataOf first, ← dataOf second)
    return {
      schema := s!"{← effectNameOf "Schema" "Tuple" .value}\
        ([{firstDrawn.schema}, {secondDrawn.schema}])"
      reader := none
      named := firstDrawn.named ++ secondDrawn.named }
  -- A binary coproduct is a result of Effect, which succeeds with a value of the second summand,
  -- as `typeOf` writes its type.
  | .app (.app (.const ``Sum _) first) second =>
    let (firstDrawn, secondDrawn) := (← dataOf first, ← dataOf second)
    return {
      schema := s!"{← effectNameOf "Schema" "Result" .value}\
        ({secondDrawn.schema}, {firstDrawn.schema})"
      reader := none
      named := firstDrawn.named ++ secondDrawn.named }
  | .const name _ =>
    unless ExportTypeScript.isExported environment name &&
        (← kindOf name) matches .dataStructure do
      Lean.throwError m!"`{name}` has no schema that a test can draw from."
    return {
      schema := s!"{← moduleAliasOf name}.{← typeNameOf packageNamespace name}"
      reader := none
      named := [name] }
  | _ =>
    if (← parameterObjectOf type).isSome then
      Lean.throwError m!"`{type}` has no schema that a test can draw from, as a test draws a \
        system in the identity monad alone."
    -- The state space of a system that is a variable, such as `machine.V`, is a type variable.
    let stateSpace := match type.getAppFn, type with
      | .const name _, .app _ (.fvar _) => (environment.getProjectionFnInfo? name).isSome
      | _, _ => false
    unless (type.isFVar || stateSpace) &&
        (← Lean.Meta.whnfR (← Lean.Meta.inferType type)).isSort do
      Lean.throwError m!"`{type}` has no schema that a test can draw from."
    return {
      schema := s!"{← effectNameOf "Schema" "Literals" .value}([0, 1, 2])"
      reader := none
      named := [] }

/-- Runs a computation on the conclusion of a theorem under its leading `have`s, with the statement
`const … = …;` that every one of them takes in a test and the declarations of the theory whose
modules of the package the statements name. -/
partial def underHaves {α : Type} (packageNamespace : Lean.Name)
    (drawn : List (Lean.Expr × String)) (conclusion : Lean.Expr)
    (computation : List String → List Lean.Name → Lean.Expr → TypeScriptM α) :
    TypeScriptM α := do
  let .letE name type value body _ := conclusion | computation [] [] conclusion
  let (script, named) ← expressionOf packageNamespace drawn value
  Lean.Meta.withLetDecl name type value fun binder ↦
    underHaves packageNamespace drawn (body.instantiate1 binder) fun statements others ↦
      computation (s!"const {name} = {script};\n" :: statements) (named ++ others)

/-- Gives the test of TypeScript that a theorem of the theory takes, where the theory gives it a
counterpart in TypeScript, with the declarations of the theory whose modules of the package it
names, or fails with the reason where the theorem has none. The test draws every variable of the
theorem but its type variables and their instances, a system as the table of its structure and a
stream as a prefix of it, skips the values that break a hypothesis, and compares the two sides of
the conclusion, two streams by a prefix of each. -/
def testOf (packageNamespace name : Lean.Name) : TypeScriptM (String × List Lean.Name) := do
  let environment ← Lean.getEnv
  Lean.Meta.forallTelescope (← Lean.getConstInfo name).type fun variables conclusion ↦ do
    let statements := conclusion :: (← variables.toList.mapM fun binder ↦
      Lean.Meta.inferType binder)
    let mut arbitraries : List (String × String) := []
    let mut systems : List String := []
    let mut drawn : List (Lean.Expr × String) := []
    let mut streams : List String := []
    let mut conditions : List String := []
    let mut named : List Lean.Name := []
    for binder in variables do
      let type ← Lean.Meta.inferType binder
      -- A type variable takes the three values that the test draws at, and an instance of a class
      -- on it constrains it, so neither is a variable of the test.
      if isParameterType type || (← Lean.Meta.isClass? type).isSome then
        continue
      else if ← Lean.Meta.isProp type then
        match type.getAppFn, type.getAppArgs.toList with
        | .const ``Ne _, [_, left, right] =>
          let (leftScript, leftNamed) ← expressionOf packageNamespace drawn left
          let (rightScript, rightNamed) ← expressionOf packageNamespace drawn right
          conditions := conditions ++
            [s!"{← effectNameOf "Equal" "equals" .value}({leftScript}, {rightScript})"]
          named := named ++ leftNamed ++ rightNamed
        | .const ``Eq _, [_, left, right] =>
          let (leftScript, leftNamed) ← expressionOf packageNamespace drawn left
          let (rightScript, rightNamed) ← expressionOf packageNamespace drawn right
          conditions := conditions ++
            [s!"!{← effectNameOf "Equal" "equals" .value}({leftScript}, {rightScript})"]
          named := named ++ leftNamed ++ rightNamed
        | _, _ =>
          Lean.throwError m!"`{type}` is no hypothesis that a test can skip the values of."
      else
        let binderName ← binderNameOf binder
        if ["actual", "expected"].contains binderName then
          Lean.throwError m!"`{name}` names a variable `{binderName}`, which the test takes for a \
            side of the conclusion."
        let reduced ← Lean.Meta.whnfR type
        if let .app (.const `Stream' _) element := type then
          -- A stream is drawn as a prefix of it, which has a first element where the theorem
          -- takes the first element of the stream.
          let elementDrawn ← drawnOf packageNamespace element
          if elementDrawn.reader.isSome then
            Lean.throwError m!"`{type}` has no schema that a test can draw from, as it holds a \
              function where a test draws data alone."
          let headed := statements.any fun statement ↦ (statement.find? fun
            | .app (.app (.const `Stream'.head _) _) stream => stream == binder
            | _ => false).isSome
          arbitraries := arbitraries ++ [(binderName,
            s!"{← effectNameOf "Schema" (if headed then "NonEmptyArray" else "Array") .value}\
              ({elementDrawn.schema})")]
          drawn := drawn ++
            [(binder, s!"{← effectNameOf "Stream" "fromIterable" .value}({binderName})")]
          streams := streams ++ [binderName]
          named := named ++ elementDrawn.named
        else if let some structureName ← bundledOf reduced then
          let .const declaration _ := type.getAppFn
            | Lean.throwError m!"`{type}` has no schema that a test can draw from."
          unless ExportTypeScript.isExported environment declaration &&
              (← kindOf declaration) matches .bundled do
            Lean.throwError m!"`{declaration}` has no schema that a test can draw from."
          -- A system is drawn as the table of its structure, which its constructor reads.
          let (field, table) ← bundledFieldsOf reduced fun _ fields ↦ do
            match fields with
            | [(field, shape)] =>
              return (← fieldNameOf structureName field, ← drawnOf packageNamespace shape)
            | _ => Lean.throwError m!"`{declaration}` has no schema that a test can draw from, \
                as a test draws a system of one field that is no type alone."
          arbitraries := arbitraries ++ [(s!"{binderName}Table", table.schema)]
          systems := systems ++ [s!"const {binderName} = {← moduleAliasOf declaration}.\
            {← constructorNameOf packageNamespace declaration}\
            (\{ {field}: {(table.reader.getD id) s!"{binderName}Table"} });\n"]
          named := named ++ declaration :: table.named
        else
          let value ← drawnOf packageNamespace type
          arbitraries := arbitraries ++ [(binderName, value.schema)]
          if let some reader := value.reader then drawn := drawn ++ [(binder, reader binderName)]
          named := named ++ value.named
    let (body, bodyNamed) ← underHaves packageNamespace drawn conclusion
      fun haves haveNamed equation ↦ do
        let .app (.app (.app (.const ``Eq _) type) left) right := equation
          | Lean.throwError m!"`{equation}` is no equation that a test can check."
        -- Two streams are compared by a prefix of each, as long as the stream that the test draws,
        -- or of 6 elements where it draws none, which tell apart two systems of 3 states each.
        let length ← match type with
          | .app (.const `Stream' _) element | .app (.const `Stream'.Seq _) element => do
            if (element.find? fun part ↦
                part.isConstOf `Stream' || part.isConstOf `Stream'.Seq).isSome then
              Lean.throwError m!"`{equation}` is no equation that a test can check, as a test \
                compares a prefix of a stream and no stream of streams."
            match streams with
            | [] => pure (some "6")
            | [stream] => pure (some s!"{stream}.length")
            | _ => Lean.throwError m!"`{equation}` is no equation that a test can check, as a \
                test compares a prefix as long as the one stream it draws and `{name}` takes \
                several."
          | _ => pure none
        let (leftScript, leftNamed) ← expressionOf packageNamespace drawn left
        let (rightScript, rightNamed) ← expressionOf packageNamespace drawn right
        let sides ← match length with
          | none => pure s!"const actual = {leftScript};\nconst expected = {rightScript};\n"
          | some length => do
            let collect := s!"{← effectNameOf "Effect" "runSync" .value}\
              ({← effectNameOf "Stream" "runCollect" .value}\
              ({← effectNameOf "Stream" "take" .value}("
            -- A stream of Mathlib never ends, so its prefix has every one of its elements.
            let whole := if type.isAppOf `Stream' then s!"expect(actual).toHaveLength({length});\n"
              else ""
            pure s!"const actual = {collect}{leftScript}, {length})));\n\
              const expected = {collect}{rightScript}, {length})));\n{whole}"
        return (String.join haves ++ sides ++ "expect(actual).toEqual(expected);\n",
          haveNamed ++ leftNamed ++ rightNamed)
    let body := String.join systems ++
      String.join (conditions.map fun condition ↦ s!"if ({condition}) \{\nreturn;\n}\n") ++ body
    let testName := (name.replacePrefix packageNamespace .anonymous).toString
    let test := if arbitraries.isEmpty then s!"it('{testName}', () => \{\n{body}});\n" else
      let schemas := arbitraries.map fun (binderName, schema) ↦ s!"{binderName}: {schema}"
      s!"it.prop('{testName}', \{ {", ".intercalate schemas} }, \
        (\{ {", ".intercalate (arbitraries.map Prod.fst)} }) => \{\n{body}});\n"
    return (s!"{← commentOf name}{test}", named ++ bodyNamed)

/-- Gives the file of tests of TypeScript that holds the tests of the theorems of a module of the
theory of a package, which imports the modules of the package that the tests name. -/
def testFileOf (theory module : Lean.Name) (packageNamespace : Lean.Name)
    (theorems : List Lean.Name) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  let (tests, records) ← (theorems.mapM (testOf packageNamespace)).run []
  let body := "\n".intercalate (tests.map Prod.fst)
  let named := (tests.flatMap Prod.snd).filterMap fun name ↦
    (environment.getModuleIdxFor? name).map (·.toNat)
  let modules := (named.eraseDups.mergeSort (· ≤ ·)).filterMap fun index ↦
    environment.header.moduleNames[index]?
  -- A test names every module of Effect as a value, so the file imports each of them as a value.
  let effectModules := (effectImportsOf records).map Prod.fst
  let effectImport := if effectModules.isEmpty then "" else
    s!"import \{ {", ".intercalate effectModules} } from 'effect';\n"
  let packageImports := String.join (← modules.mapM fun named ↦ do
    let path := pathOf theory named
    let .str _ last := named
      | Lean.throwError m!"`{named}` has no name that a test can import it under."
    return s!"import * as {last} from '#src/{path}';\n")
  let modulePath := pathOf theory module
  return s!"// Written by the generator of the theory from `{module}`, so every change by hand is \
      lost when the generator runs.\n" ++
    s!"import \{ describe, expect, it } from '@effect/vitest';\n\
      {effectImport}\n{packageImports}\n" ++
    s!"describe('{modulePath}', () => \{\n{body}});\n"

end Generator
