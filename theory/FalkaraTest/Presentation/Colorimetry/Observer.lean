module

meta import Falkara.Citation
public import Falkara.Presentation.Colorimetry.Observer
public import Falkara.Presentation.Colorimetry.Wavelength

/-!
# Observer

The module defines the checks of the observer against the data table
[cie2019colorMatchingFunctions]. The checks compare the sum of the wavelengths $\lambda$, the sum of
the values of each color-matching function $\bar{x}$, $\bar{y}$, and $\bar{z}$, and the values at
one sample wavelength with the validation values of the data table, and the wavelengths with the
range and the step that the data table gives. A last check finds that the wavelengths, paired in
order with the rows, are each paired with the row at that wavelength, as the tristimulus values
pair them.

## Main Statements

- `observer_sumOfColumns`: the sum of the wavelengths and the sum of the values of each
  color-matching function equal the validation values of the data table,
  $\sum \lambda = 280\,245$, $\sum \bar{x}(\lambda) = 106.865\,469\,489\,595$,
  $\sum \bar{y}(\lambda) = 106.856\,917\,101\,171\,9$, and
  $\sum \bar{z}(\lambda) = 106.892\,251\,278\,636$.
- `observer_sampleRow`: the values at the sample wavelength equal the validation values of the
  data table,
  $(\bar{x}, \bar{y}, \bar{z})(479\,\mathrm{nm}) = (0.104\,297\,9, 0.133\,452\,8, 0.856\,619\,3)$.
- `observer_wavelengths`: the wavelengths of the observer run from 360 nm to 830 nm in steps of
  1 nm, $\lambda_i = (360 + i)\,\mathrm{nm}$ for $i = 0, \ldots, 470$.
- `wavelengths_zip_observer`: the wavelengths from 360 nm to 830 nm, paired in order with the rows
  of the data table, are each paired with the row at that wavelength.

## Implementation Notes

The checks are proved by `decide +kernel`, as `decide` reaches the maximum recursion depth of the
elaborator on 471 rows and `native_decide` proves every statement by an axiom of its own, which
asserts the result the compiler computes and lies beyond `propext`, `Classical.choice`, and
`Quot.sound`.
-/

public section

namespace Falkara.Presentation.Colorimetry

/-- The sum of the wavelengths and the sum of the values of each color-matching function equal the
validation values of the data table, $\sum \lambda = 280\,245$,
$\sum \bar{x}(\lambda) = 106.865\,469\,489\,595$,
$\sum \bar{y}(\lambda) = 106.856\,917\,101\,171\,9$, and
$\sum \bar{z}(\lambda) = 106.892\,251\,278\,636$. -/
theorem observer_sumOfColumns :
    observer.foldl (fun sum stimulus ↦ sum + stimulus.wavelength) 0 = 280245 ∧
      observer.foldl (fun sum stimulus ↦ sum + stimulus.xBar) 0 = 106.865469489595 ∧
      observer.foldl (fun sum stimulus ↦ sum + stimulus.yBar) 0 = 106.8569171011719 ∧
      observer.foldl (fun sum stimulus ↦ sum + stimulus.zBar) 0 = 106.892251278636 := by
  decide +kernel

attribute [cite "sumOfColumns" cie2019colorMatchingFunctions] observer_sumOfColumns

/-- The values at the sample wavelength equal the validation values of the data table,
$(\bar{x}, \bar{y}, \bar{z})(479\,\mathrm{nm}) = (0.104\,297\,9, 0.133\,452\,8, 0.856\,619\,3)$. -/
theorem observer_sampleRow :
    observer[119]? = some ⟨479, 0.104297900000, 0.1334528000000, 0.856619300000⟩ := by
  decide +kernel

attribute [cite "sampleRow" cie2019colorMatchingFunctions] observer_sampleRow

/-- The wavelengths of the observer run from 360 nm to 830 nm in steps of 1 nm,
$\lambda_i = (360 + i)\,\mathrm{nm}$ for $i = 0, \ldots, 470$. -/
theorem observer_wavelengths :
    observer.map (·.wavelength) = (List.range 471).map (360 + ·) := by
  decide +kernel

attribute [cite "lambda" cie2019colorMatchingFunctions] observer_wavelengths

/-- The wavelengths from 360 nm to 830 nm, paired in order with the rows of the data table, are
each paired with the row at that wavelength. -/
theorem wavelengths_zip_observer :
    wavelengths.length = observer.length ∧
      (wavelengths.zip observer).all fun pair ↦ pair.2.wavelength = pair.1.val := by
  decide +kernel

attribute [cite "lambda" cie2019colorMatchingFunctions] wavelengths_zip_observer

end Falkara.Presentation.Colorimetry
