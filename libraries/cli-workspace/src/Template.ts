import type { Files } from '@falkara/cli-core';
import { toSlug } from '#src/Naming.ts';

/**
 * What a new workspace is made of.
 *
 * A plain function from answers to a list of files, with no `Effect` and no
 * filesystem anywhere in it. That is the whole point of the split: deciding
 * what a workspace contains is a question about Falkara, deciding how to get it
 * onto a disk without leaving a mess is a question about filesystems, and
 * `Files` already answers the second one for every generator that will follow
 * this one.
 *
 * Being a value also means the set can be asserted against directly, and that
 * `--dry-run` shows the real list rather than a description of it.
 */
export interface Workspace {
  readonly name: string;
  readonly packageManager: string;
}

// `package.json` is written through `JSON.stringify` rather than as a template string, so a name containing a quote produces an escaped string rather than a broken file.
const packageJson = (workspace: Workspace): string =>
  `${JSON.stringify(
    {
      name: toSlug(workspace.name),
      version: '0.0.0',
      private: true,
      type: 'module',
      scripts: {},
    },
    null,
    2,
  )}\n`;

const readme = (workspace: Workspace): string =>
  [
    `# ${workspace.name}`,
    '',
    'A Falkara Workspace project.',
    '',
    '## Getting started',
    '',
    '```sh',
    `${workspace.packageManager} install`,
    '```',
    '',
  ].join('\n');

const gitignore = ['node_modules', 'dist', '.DS_Store', ''].join('\n');

/**
 * The files a fresh workspace starts life with.
 *
 * Deliberately the smallest set that is still a real workspace. Everything here
 * is `fail` on conflict — the default — so scaffolding into a directory that
 * already holds one of these stops rather than quietly replacing it, and `-f`
 * is how someone says they meant it.
 *
 * @param workspace What the run settled on for the new project.
 */
export const forWorkspace = (workspace: Workspace): ReadonlyArray<Files.File> => [
  { path: 'package.json', contents: packageJson(workspace) },
  { path: 'README.md', contents: readme(workspace) },
  { path: '.gitignore', contents: gitignore },
];
