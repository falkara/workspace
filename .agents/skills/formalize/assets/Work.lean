/-- <The comment states in one sentence what the work is, such as "The data table of the color-matching functions of the CIE 1931 standard colorimetric observer."> -/
def <The name is the namespace of the author, in upper camel case with an acronym as a group and the first author where the work has several, followed by the words of the title that tell the work apart, in lower camel case as a value of Lean is, with no year, such as CIE.colorMatchingFunctions or Jacobs.introductionToCoalgebra> : Citation.Work where
  author := "<The author as the work names it, such as CIE>"
  title := "<The title as the work writes it, in its own spelling, such as Colour-matching functions of CIE 1931 standard colorimetric observer>"
  year := <The year in which the work was published, such as 2019>
  publisher := some "<The publisher with its place, as the work names them, such as International Commission on Illumination (CIE), Vienna, AT>"
  doi := some "<The DOI of the work, such as 10.25039/CIE.DS.xvudnb9b>"
  itemAddress := some "<The address that the label of an item follows to give the page of the item, where every item has a page of its own, such as https://cie.co.at/eilvterm/>"
  license := some "<The license of the work, as the work names it, such as CC BY-SA 4.0>"
  files := [
    { name := "<The name of a file of the data set that the theory formalizes, such as CIE_xyz_1931_2deg.csv>"
      url := "<The address the file is published at, such as https://files.cie.co.at/Publications-datasets/CIE_xyz_1931_2deg.csv>"
      sha256 := "<The SHA-256 of the file, in hexadecimal digits, such as fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1>" }]
