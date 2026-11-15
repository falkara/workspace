import Citation

/-!
# References

The module defines every work that the theory cites, each as a declaration that the attribute `cite` and the comments of the modules name.

## Implementation Notes

Every work is named after its author, the year of the work, and the words of its title that tell the work apart, as a citation key of a bibliography is, such as `cie2019colorMatchingFunctions`.
-/

namespace References

/-- The data table of the color-matching functions of the CIE 1931 standard colorimetric observer. -/
def cie2019colorMatchingFunctions : Citation.Work where
  author := "CIE"
  title := "Colour-matching functions of CIE 1931 standard colorimetric observer"
  year := 2019
  publisher := some "International Commission on Illumination (CIE), Vienna, AT"
  doi := some "10.25039/CIE.DS.xvudnb9b"
  license := some "CC BY-SA 4.0"
  files := [
    { name := "CIE_xyz_1931_2deg.csv"
      url := "https://files.cie.co.at/Publications-datasets/CIE_xyz_1931_2deg.csv"
      sha256 := "fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1" },
    { name := "CIE_xyz_1931_2deg.csv_metadata.json"
      url := "https://files.cie.co.at/Publications-datasets/CIE_xyz_1931_2deg.csv_metadata.json"
      sha256 := "03abcaecf4e63d77045ef57c4514b52c8bb1a46dd18e1f93a50044a0f4f481c8" }]

/-- The data table of the relative spectral distribution of CIE standard illuminant D65. -/
def cie2019standardIlluminantD65 : Citation.Work where
  author := "CIE"
  title := "CIE standard illuminant D65"
  year := 2019
  publisher := some "International Commission on Illumination (CIE), Vienna, AT"
  doi := some "10.25039/CIE.DS.hjfjmt59"
  license := some "CC BY-SA 4.0"
  files := [
    { name := "CIE_std_illum_D65.csv"
      url := "https://files.cie.co.at/Publications-datasets/CIE_std_illum_D65.csv"
      sha256 := "e76f210bffff3d552ef7113025da5f325d5dfec200dd4b878b1a2f3a507032cb" },
    { name := "CIE_std_illum_D65.csv_metadata_v2.json"
      url := "https://files.cie.co.at/Publications-datasets/CIE_std_illum_D65.csv_metadata_v2.json"
      sha256 := "71994379b81c65db111f652e747a00b599b5456c2a8242e9a0d6f379f560a14e" }]

/-- The second volume of the foundations of measurement, which states the Grassmann structures of color matching. -/
def suppes1989foundationsOfMeasurement : Citation.Work where
  author := "P. Suppes, D. H. Krantz, R. D. Luce, and A. Tversky"
  title := "Foundations of Measurement, Volume II: Geometrical, Threshold, and Probabilistic Representations"
  year := 1989
  publisher := some "Academic Press, San Diego"

end References
