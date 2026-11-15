/-- <The comment states in one sentence what the work is, such as "The data table of the color-matching functions of the CIE 1931 standard colorimetric observer."> -/
def <The name joins the author, the year of the work, and the words of its title that tell the work apart, as a citation key of a bibliography does, such as cie2019colorMatchingFunctions or cie2020internationalLightingVocabulary> : Citation.Work where
  author := "<The author as the work names it, such as CIE>"
  title := "<The title as the work writes it, in its own spelling, such as Colour-matching functions of CIE 1931 standard colorimetric observer>"
  year := <The year in which the work was published, such as 2019>
  publisher := some "<The publisher with its place, as the work names them, such as International Commission on Illumination (CIE), Vienna, AT>"
  doi := some "<The DOI of the work, such as 10.25039/CIE.DS.xvudnb9b>"
  license := some "<The license of the work, as the work names it, such as CC BY-SA 4.0>"
  files := [
    { name := "<The name of a file of the data set that the theory formalizes, such as CIE_xyz_1931_2deg.csv>"
      url := "<The address the file is published at, such as https://files.cie.co.at/Publications-datasets/CIE_xyz_1931_2deg.csv>"
      sha256 := "<The SHA-256 of the file, in hexadecimal digits, such as fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1>" }]
