/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Target.TypeScript.Syntax

/-!
# Print

The module defines the text of the syntax of TypeScript, unformatted, as oxfmt formats every file
after the translator writes it: every documentation comment, statement, member of an interface,
and documented property on a line of its own with no indentation, a blank line before every
documented statement after the first, the parameters of a list on lines where its node sets them
on lines, and every other part on the line of its node.

## Implementation Notes

An object takes a line for every property where one of its properties is documented, and its
line alone otherwise, as a documentation comment takes lines of its own.
-/

public section

namespace Translator.TypeScript

/-- Gives the text of a documentation comment, on lines of its own: the paragraph between `/**`
and `*/` where it cites no address, and the paragraph, a blank line, and a tag `@see` for every
address on a line each otherwise. -/
def Documentation.print (documentation : Documentation) : String :=
  if documentation.addresses.isEmpty then s!"/** {documentation.text} */\n"
  else s!"/**\n * {documentation.text}\n *\n\
    {String.join (documentation.addresses.map (s!" * @see {·}\n"))} */\n"

/-- Gives the text of a symbol: the name of its member after the namespace of its module, the name
of a condition alone, and the namespace `Module` of the module of a package. -/
def Symbol.print : Symbol → String
  | .effect qualifier member => s!"{qualifier}.{member}"
  | .theory qualifier _ member => s!"{qualifier}.{member}"
  | .check _ member => member
  | .module _ => "Module"
  | .package qualifier _ member => s!"{qualifier}.{member}"

/-- Gives the text of a literal. -/
def Literal.print : Literal → String
  | .string value => s!"'{value}'"
  | .number value => toString value
  | .bigInt value => s!"{value}n"

/-- Gives the text of a type that a keyword names. -/
def Keyword.print : Keyword → String
  | .string => "string"
  | .boolean => "boolean"
  | .void => "void"
  | .never => "never"

/-- Gives the text of a name that a type refers to. -/
def TypeName.print : TypeName → String
  | .identifier name => name
  | .qualified qualifier name => s!"{qualifier}.{name}"
  | .symbol imported => imported.print

/-- Gives the text of a pattern that a parameter binds. -/
def Binding.print : Binding → String
  | .identifier name => name
  | .object names => s!"\{ {", ".intercalate names} }"

mutual

/-- Gives the text of a type. -/
def TypeExpression.print : TypeExpression → String
  | .keyword named => named.print
  | .literal value => value.print
  | .reference name [] => name.print
  | .reference name arguments =>
    s!"{name.print}<{", ".intercalate (arguments.map TypeExpression.print)}>"
  | .this => "this"
  | .indexed whole index => s!"{whole.print}[{index.print}]"
  | .tuple elements => s!"readonly [{", ".intercalate (elements.map TypeExpression.print)}]"
  | .object members => s!"\{ {"; ".intercalate (members.map Member.print)} }"
  | .function [] parameters result =>
    s!"({", ".intercalate (parameters.map Parameter.print)}) => {result.print}"
  | .function typeParameters parameters result =>
    s!"<{", ".intercalate (typeParameters.map TypeParameter.print)}>\
      ({", ".intercalate (parameters.map Parameter.print)}) => {result.print}"
  | .union members => " | ".intercalate (members.map TypeExpression.print)
  | .query name => s!"typeof {name.print}"

/-- Gives the text of a member of an interface or of a type of objects, its documentation comment
included. -/
def Member.print : Member → String
  | .property documentation name type =>
    s!"{(documentation.map (·.print)).getD ""}readonly {name}: {type.print}"
  | .call [] parameters result =>
    s!"({", ".intercalate (parameters.map Parameter.print)}): {result.print}"
  | .call typeParameters parameters result =>
    s!"<{", ".intercalate (typeParameters.map TypeParameter.print)}>\
      ({", ".intercalate (parameters.map Parameter.print)}): {result.print}"

/-- Gives the text of a parameter, with the type it annotates. -/
def Parameter.print : Parameter → String
  | .mk binding none => binding.print
  | .mk binding (some type) => s!"{binding.print}: {type.print}"

/-- Gives the text of a type parameter, with its variance, its constraint, and its default type. -/
def TypeParameter.print : TypeParameter → String
  | .mk variance name constraint default =>
    let modifiers := match variance with
      | .inferred => ""
      | .contravariant => "in "
      | .covariant => "out "
      | .invariant => "in out "
    let extended := match constraint with
      | some constraint => s!" extends {constraint.print}"
      | none => ""
    let fallback := match default with
      | some default => s!" = {default.print}"
      | none => ""
    s!"{modifiers}{name}{extended}{fallback}"

end

mutual

/-- Gives the text of an expression. -/
def Expression.print : Expression → String
  | .identifier name => name
  | .symbol imported => imported.print
  | .literal value => value.print
  | .member whole name => s!"{whole.print}.{name}"
  | .element whole index => s!"{whole.print}[{index.print}]"
  | .call callee arguments =>
    s!"{callee.print}({", ".intercalate (arguments.map Expression.print)})"
  | .instantiation generic typeArguments =>
    s!"{generic.print}<{", ".intercalate (typeArguments.map TypeExpression.print)}>"
  | .arrow typeParameters parameters layout result body =>
    let generics := if typeParameters.isEmpty then "" else
      s!"<{", ".intercalate (typeParameters.map TypeParameter.print)}>"
    let written := match layout with
      | .inline => s!"({", ".intercalate (parameters.map Parameter.print)})"
      | .lines => s!"(\n{String.join (parameters.map (s!"{Parameter.print ·},\n"))})"
    let annotated := match result with
      | some result => s!": {result.print}"
      | none => ""
    s!"{generics}{written}{annotated} => {body.print}"
  | .object properties =>
    if properties.any fun | .mk documentation _ _ => documentation.isSome then
      s!"\{\n{String.join (properties.map fun property ↦ s!"{property.print},\n")}}"
    else s!"\{ {", ".intercalate (properties.map Property.print)} }"
  | .array elements => s!"[{", ".intercalate (elements.map Expression.print)}]"
  | .not operand => s!"!{operand.print}"
  | .parenthesized inner => s!"({inner.print})"

/-- Gives the text of a property of an object, its documentation comment included. -/
def Property.print : Property → String
  | .mk documentation name value =>
    s!"{(documentation.map (·.print)).getD ""}{name}: {value.print}"

/-- Gives the text of the body of an arrow function, a block between braces on lines of its own. -/
def Body.print : Body → String
  | .expression inner => inner.print
  | .block statements => s!"\{\n{Statement.printBlock statements}}"

/-- Gives the text of a statement, on lines of its own, its documentation comment included. -/
def Statement.print : Statement → String
  | .constant documentation exported name type value =>
    let annotated := match type with
      | some type => s!": {type.print}"
      | none => ""
    s!"{(documentation.map (·.print)).getD ""}{if exported then "export " else ""}const \
      {name}{annotated} = {value.print};\n"
  | .typeAlias documentation exported name typeParameters type =>
    let generics := if typeParameters.isEmpty then "" else
      s!"<{", ".intercalate (typeParameters.map TypeParameter.print)}>"
    s!"{(documentation.map (·.print)).getD ""}{if exported then "export " else ""}type \
      {name}{generics} = {type.print};\n"
  | .interface documentation exported name typeParameters extended members =>
    let generics := if typeParameters.isEmpty then "" else
      s!"<{", ".intercalate (typeParameters.map TypeParameter.print)}>"
    let extension := match extended with
      | some extended => s!" extends {extended.print}"
      | none => ""
    s!"{(documentation.map (·.print)).getD ""}{if exported then "export " else ""}interface \
      {name}{generics}{extension} \{\n{String.join (members.map fun member ↦
        s!"{member.print};\n")}}\n"
  | .expression documentation inner =>
    s!"{(documentation.map (·.print)).getD ""}{inner.print};\n"
  | .returnIf condition => s!"if ({condition.print}) \{\nreturn;\n}\n"

/-- Gives the text of the statements of a block or a module, with a blank line before every
documented statement after the first. -/
def Statement.printBlock : List Statement → String
  | [] => ""
  | first :: rest => first.print ++ String.join (rest.map fun statement ↦
    let opening := match statement with
      | .constant (some _) .. | .typeAlias (some _) .. | .interface (some _) ..
      | .expression (some _) _ => "\n"
      | _ => ""
    opening ++ statement.print)

end

/-- Gives the text of a name that an import takes, after `type` where it takes it as a type
alone. -/
def ImportName.print (importName : ImportName) : String :=
  s!"{if importName.typeOnly then "type " else ""}{importName.name}"

/-- Gives the text of an import, on a line of its own. -/
def Import.print : Import → String
  | .named typeOnly names specifier =>
    s!"import {if typeOnly then "type " else ""}\{ {", ".intercalate (names.map (·.print))} } \
      from '{specifier}';\n"
  | .namespaced typeOnly name specifier =>
    s!"import {if typeOnly then "type " else ""}* as {name} from '{specifier}';\n"

/-- Gives the text of a module: the comment that opens it, then every group of imports and the
statements, each apart from the next by a blank line. -/
def Module.print (module : Module) : String :=
  let sections := module.imports.map (fun group ↦ String.join (group.map (·.print))) ++
    [Statement.printBlock module.statements]
  s!"// {module.header}\n{"\n".intercalate (sections.filter (!·.isEmpty))}"

end Translator.TypeScript
