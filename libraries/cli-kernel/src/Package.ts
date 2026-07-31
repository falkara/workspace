/**
 * The name a package installs its executable under.
 *
 * Taken from the manifest's `bin` rather than from the package name, because
 * that is the field a package manager actually puts on the path: a scoped
 * package installs whatever its `bin` is keyed by, and the two agree only where
 * a convention makes them.
 *
 * @param bin The `bin` field of a package manifest, keyed by installed name.
 */
export const binary = <Name extends string>(bin: Readonly<Record<Name, string>>): Name =>
  // The key set is the signature's, so the cast asserts nothing it has not
  // already proven. A manifest declaring two executables would satisfy it just
  // as well, and the first is as good an answer as any.
  Object.keys(bin)[0] as Name;
