import type { Effect } from 'effect';
// Brings the module into the program, so that it can be augmented before any style imports StyleX.
import '@stylexjs/stylex/lib/types/StyleXTypes';

import type { environment } from '../Environment';

// The values StyleX hands to the styles as `stylex.env`, typed as `environment` gives them to the Vite config.
declare module '@stylexjs/stylex/lib/types/StyleXTypes' {
  interface Register {
    env: Effect.Success<typeof environment>;
  }
}
