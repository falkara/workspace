import { Console } from 'effect';

import manifest from '#package.json' with { type: 'json' };

/** A place to find Falkara. */
export interface Channel {
  readonly label: string;
  readonly url: string;
}

/** The places to find Falkara, in the order `npm create falkara` lists them. */
export const channels: ReadonlyArray<Channel> = [
  { label: 'Website', url: 'https://falkara.com' },
  { label: 'Source', url: 'https://github.com/falkara/workspace' },
  { label: 'Packages', url: 'https://npmjs.com/org/falkara' },
];

/** The program `npm create falkara` runs, printing create-falkara at the version published, what the command is for, and where to find Falkara, each label padded to the longest one. */
export const program = Console.log(
  [
    `create-falkara ${manifest.version}`,
    'The starting point for new projects on Falkara products.',
    '',
    ...channels.map(
      ({ label, url }) =>
        `  ${label.padEnd(Math.max(...channels.map((channel) => channel.label.length)))}  ${url}`,
    ),
    '',
  ].join('\n'),
);
