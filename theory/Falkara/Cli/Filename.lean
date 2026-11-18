/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

meta import Falkara.Citation -- shake: keep
meta import Falkara.ExportTypeScript -- shake: keep
public import Falkara.References -- shake: keep

/-!
# Filename

The module defines a filename [ieee2024portableOperatingSystemInterface] that names a file or a
directory in the same way on every system as a portable filename of at most 255 bytes that starts
with no hyphen-minus, ends with no period, and names no device that Windows reserves
[microsoft2024namingFiles]. A relative path made of such filenames never leaves the directory it
starts at, as such a filename is neither dot nor dot-dot.

## Main Definitions

- `maximumFilenameLength`: the greatest number of bytes in a filename that every system conforming
  to the X/Open System Interfaces accepts.
- `reservedNames`: the names that Windows reserves for devices, alone or followed by an extension.
- `isPortableFilenameCharacter`: tells whether a character is in the portable filename character
  set, a letter from `A` to `Z` or from `a` to `z`, a digit from `0` to `9`, `.`, `_`, or `-`.
- `isPortableFilename`: tells whether a name is a portable filename, 1 to 255 characters of the
  portable filename character set.
- `hasLeadingHyphenMinus`: tells whether a name starts with a hyphen-minus, which a program takes
  as an option when the name is passed as an argument on the command line.
- `hasTrailingPeriod`: tells whether a name ends with a period, which Windows drops from the name
  of a file or a directory.
- `isReservedName`: tells whether a name is one that Windows reserves for a device, alone or
  followed by an extension, in either case.
- `isFilename`: tells whether a name is a filename that names a file or a directory in the same way
  on every system, a portable filename that starts with no hyphen-minus, ends with no period, and
  is no name that Windows reserves.
- `Filename`: a filename that names a file or a directory in the same way on every system.

## Main Statements

- `isFilename_iff`: a name $n$ is a filename exactly when it is a portable filename that starts
  with no hyphen-minus, ends with no period, and is no name that Windows reserves,
  $\mathrm{isFilename}(n) \iff \mathrm{isPortableFilename}(n) \land
  \neg\,\mathrm{hasLeadingHyphenMinus}(n) \land \neg\,\mathrm{hasTrailingPeriod}(n) \land
  \neg\,\mathrm{isReservedName}(n)$.
- `Filename.isPortableFilename_val`: a filename $f$ is a portable filename,
  $\mathrm{isPortableFilename}(f)$.
- `Filename.hasLeadingHyphenMinus_val`: a filename $f$ never starts with a hyphen-minus,
  $\neg\,\mathrm{hasLeadingHyphenMinus}(f)$.
- `Filename.hasTrailingPeriod_val`: a filename $f$ never ends with a period,
  $\neg\,\mathrm{hasTrailingPeriod}(f)$.
- `Filename.isReservedName_val`: a filename $f$ is never a name that Windows reserves,
  $\neg\,\mathrm{isReservedName}(f)$.
- `Filename.val_ne_dot`: a filename $f$ is never dot, $f \neq \mathtt{.}$.
- `Filename.val_ne_dotDot`: a filename $f$ is never dot-dot, $f \neq \mathtt{..}$.

## Implementation Notes

A filename is a subtype of a string by a condition that gives a boolean, as the kernel of Lean
computes the condition and the generator writes the condition as the filter of the schema of the
filename. The condition joins four conditions, each of which states the item of a single work, so a
theorem of a filename rests on the condition it needs alone.

The conditions read a name as a list of characters, as the kernel of Lean reduces a list and gets
stuck on the functions of a string that walk its bytes, such as `String.all`.

A portable filename counts its length in characters, which equals its length in bytes, as every
portable filename character takes one byte in UTF-8.

A filename starts with no hyphen-minus, which the definition of a portable filename recommends in a
note alone, as a filename that the library writes is passed as an argument to programs on the
command line, which take it as an option, such as `-rf`.

A filename excludes dot and dot-dot by the period they end with, so the theorems that a filename is
neither follow from the condition as the kernel of Lean computes it.

A reserved name takes a name of a device followed by an extension, such as `NUL.txt`, as the name
of the device, and compares the name in uppercase, as Windows takes the name of a device in either
case.

Two filenames that differ in case alone name one file on Windows, which a single filename cannot
tell, so the plan of the files holds that condition.
-/

@[expose] public section

namespace Falkara.Cli

/-! ### Data -/

/-- The greatest number of bytes in a filename that every system conforming to the X/Open System
Interfaces accepts. -/
def maximumFilenameLength : ℕ := 255

attribute [cite "{_XOPEN_NAME_MAX}" ieee2024portableOperatingSystemInterface] maximumFilenameLength

/-- The names that Windows reserves for devices, alone or followed by an extension. -/
def reservedNames : List String :=
  ["CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"]

attribute [cite "naming-conventions" microsoft2024namingFiles] reservedNames

/-! ### Conditions -/

/-- Tells whether a character is in the portable filename character set, a letter from `A` to `Z`
or from `a` to `z`, a digit from `0` to `9`, `.`, `_`, or `-`. -/
def isPortableFilenameCharacter (character : Char) : Bool :=
  character.isAlphanum || character == '.' || character == '_' || character == '-'

attribute [cite "3.265" ieee2024portableOperatingSystemInterface] isPortableFilenameCharacter

/-- Tells whether a name is a portable filename, 1 to 255 characters of the portable filename
character set. -/
def isPortableFilename (name : String) : Bool :=
  let characters := name.toList
  1 ≤ characters.length && characters.length ≤ maximumFilenameLength &&
    characters.all isPortableFilenameCharacter

attribute [cite "3.264" ieee2024portableOperatingSystemInterface] isPortableFilename

/-- Tells whether a name starts with a hyphen-minus, which a program takes as an option when the
name is passed as an argument on the command line. -/
def hasLeadingHyphenMinus (name : String) : Bool :=
  name.toList.head? == some '-'

attribute [cite "3.264" ieee2024portableOperatingSystemInterface] hasLeadingHyphenMinus

/-- Tells whether a name ends with a period, which Windows drops from the name of a file or a
directory. -/
def hasTrailingPeriod (name : String) : Bool :=
  name.toList.getLast? == some '.'

attribute [cite "naming-conventions" microsoft2024namingFiles] hasTrailingPeriod

/-- Tells whether a name is one that Windows reserves for a device, alone or followed by an
extension, in either case. -/
def isReservedName (name : String) : Bool :=
  reservedNames.contains (String.ofList ((name.toList.takeWhile (· != '.')).map Char.toUpper))

attribute [cite "naming-conventions" microsoft2024namingFiles] isReservedName

/-- Tells whether a name is a filename that names a file or a directory in the same way on every
system, a portable filename that starts with no hyphen-minus, ends with no period, and is no name
that Windows reserves. -/
def isFilename (name : String) : Bool :=
  isPortableFilename name && !hasLeadingHyphenMinus name && !hasTrailingPeriod name &&
    !isReservedName name

attribute [cite "3.146" ieee2024portableOperatingSystemInterface] isFilename

/-! ### Type -/

/-- A filename that names a file or a directory in the same way on every system. -/
abbrev Filename := { name : String // isFilename name = true }

attribute [cite "3.146" ieee2024portableOperatingSystemInterface] Filename

/-! ### Theorems -/

/-- A name $n$ is a filename exactly when it is a portable filename that starts with no
hyphen-minus, ends with no period, and is no name that Windows reserves,
$\mathrm{isFilename}(n) \iff \mathrm{isPortableFilename}(n) \land
\neg\,\mathrm{hasLeadingHyphenMinus}(n) \land \neg\,\mathrm{hasTrailingPeriod}(n) \land
\neg\,\mathrm{isReservedName}(n)$. -/
theorem isFilename_iff (name : String) :
    isFilename name = true ↔
      isPortableFilename name = true ∧ hasLeadingHyphenMinus name = false ∧
        hasTrailingPeriod name = false ∧ isReservedName name = false := by
  simp only [isFilename, Bool.and_eq_true, Bool.not_eq_true', and_assoc]

attribute [cite "3.146" ieee2024portableOperatingSystemInterface] isFilename_iff

namespace Filename

/-- A filename $f$ is a portable filename, $\mathrm{isPortableFilename}(f)$. -/
theorem isPortableFilename_val (filename : Filename) : isPortableFilename filename.val = true :=
  ((isFilename_iff filename.val).mp filename.property).1

attribute [cite "3.264" ieee2024portableOperatingSystemInterface] isPortableFilename_val

/-- A filename $f$ never starts with a hyphen-minus, $\neg\,\mathrm{hasLeadingHyphenMinus}(f)$. -/
theorem hasLeadingHyphenMinus_val (filename : Filename) :
    hasLeadingHyphenMinus filename.val = false :=
  ((isFilename_iff filename.val).mp filename.property).2.1

attribute [cite "3.264" ieee2024portableOperatingSystemInterface] hasLeadingHyphenMinus_val

/-- A filename $f$ never ends with a period, $\neg\,\mathrm{hasTrailingPeriod}(f)$. -/
theorem hasTrailingPeriod_val (filename : Filename) : hasTrailingPeriod filename.val = false :=
  ((isFilename_iff filename.val).mp filename.property).2.2.1

attribute [cite "naming-conventions" microsoft2024namingFiles] hasTrailingPeriod_val

/-- A filename $f$ is never a name that Windows reserves, $\neg\,\mathrm{isReservedName}(f)$. -/
theorem isReservedName_val (filename : Filename) : isReservedName filename.val = false :=
  ((isFilename_iff filename.val).mp filename.property).2.2.2

attribute [cite "naming-conventions" microsoft2024namingFiles] isReservedName_val

/-- A filename $f$ is never dot, $f \neq \mathtt{.}$. -/
theorem val_ne_dot (filename : Filename) : filename.val ≠ "." := by
  intro equal
  have condition := filename.property
  rw [equal] at condition
  exact absurd condition (by decide +kernel)

attribute [cite "3.110" ieee2024portableOperatingSystemInterface] val_ne_dot

/-- A filename $f$ is never dot-dot, $f \neq \mathtt{..}$. -/
theorem val_ne_dotDot (filename : Filename) : filename.val ≠ ".." := by
  intro equal
  have condition := filename.property
  rw [equal] at condition
  exact absurd condition (by decide +kernel)

attribute [cite "3.111" ieee2024portableOperatingSystemInterface] val_ne_dotDot

end Filename

/-! ### Export -/

attribute [export_typescript]
  isPortableFilename hasLeadingHyphenMinus hasTrailingPeriod isReservedName isFilename Filename

end Falkara.Cli
