/**
 * What a Falkara CLI can be asked to do about a Workspace project.
 *
 * `Create` carries the parts a binary needs to name the scaffolder after
 * itself: a command's name is baked in when it is built, and only the binary
 * knows what it is installed as. `Naming` and `Template` stay internal.
 */
export * as Create from '#src/Create.ts';
