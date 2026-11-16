/-!
# Script

The module defines an expression of TypeScript that the generator writes, a name, a literal, or a field, a call of a function with its arguments, or an object with its fields, and the lines that oxfmt lays the expression out on.

## Implementation Notes

An expression takes the form that oxfmt gives it, so a generated file passes the check of formatting of the repository unchanged. An expression stays on its line where the line holds at most 100 columns, the width that oxfmt breaks at; otherwise a call takes every argument on a line of its own, a call whose only argument is an object takes the fields of the object on lines of their own, and an object takes every field on a line of its own.
-/

namespace Generator

/-- An expression of TypeScript, as the generator lays it out on lines. -/
inductive Script where
  /-- An expression that stays on one line, such as a name, a literal, or a field. -/
  | atom (text : String)
  /-- A call of a function with its arguments. -/
  | call (function : String) (arguments : List Script)
  /-- An object with its fields, each a name and its value. -/
  | object (fields : List (String × Script))

/-- Gives an expression of TypeScript on one line. -/
partial def Script.flat : Script → String
  | .atom text => text
  | .call function arguments => s!"{function}({", ".intercalate (arguments.map Script.flat)})"
  | .object [] => "{}"
  | .object fields => s!"\{ {", ".intercalate (fields.map fun (name, value) => s!"{name}: {value.flat}")} }"

/-- Gives an expression of TypeScript laid out as oxfmt lays it out, given the indentation of its line, the column it starts at, and the number of characters that follow it on its last line. -/
partial def Script.render (script : Script) (indentation start following : Nat) : String :=
  let spaces := fun (count : Nat) => String.ofList (List.replicate count ' ')
  let fields := fun (entries : List (String × Script)) => String.join (entries.map fun (name, value) =>
    s!"{spaces (indentation + 2)}{name}: {value.render (indentation + 2) (indentation + 4 + name.length) 1},\n")
  -- Oxfmt breaks a line longer than 100 columns.
  if start + script.flat.length + following ≤ 100 then script.flat else
  match script with
  | .atom text => text
  | .call function [.object entries] => s!"{function}(\{\n{fields entries}{spaces indentation}})"
  | .call function arguments =>
    s!"{function}(\n{String.join (arguments.map fun argument =>
      s!"{spaces (indentation + 2)}{argument.render (indentation + 2) (indentation + 2) 1},\n")}{spaces indentation})"
  | .object entries => s!"\{\n{fields entries}{spaces indentation}}"

end Generator
