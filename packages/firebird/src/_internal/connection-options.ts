import { getSynchronizedTypeKeys, type PickByType } from '@sequelize/utils';
import type { FirebirdConnectionOptions } from '../connection-manager.js';

/** Options that are typed as "any" */
type AnyOptions = 'retryConnectionInterval' | 'blobAsText';

/** Options de connexion de type string */
type StringConnectionOptions = PickByType<Omit<FirebirdConnectionOptions, AnyOptions>, string>;

const STRING_CONNECTION_OPTION_MAP = {
  database: undefined,
  host: undefined,
  user: undefined,
  password: undefined,
  role: undefined, // Option spécifique à Firebird
  charset: undefined,
} as const satisfies Record<keyof StringConnectionOptions, undefined>;

export const STRING_CONNECTION_OPTION_NAMES = getSynchronizedTypeKeys<StringConnectionOptions>(
  STRING_CONNECTION_OPTION_MAP,
);

/** Options de connexion de type boolean */
type BooleanConnectionOptions = PickByType<Omit<FirebirdConnectionOptions, AnyOptions>, boolean>;

const BOOLEAN_CONNECTION_OPTION_MAP = {
  readOnly: undefined,
  lowerCaseKeys: undefined,
  blobAsText: undefined,
} as const satisfies Record<keyof BooleanConnectionOptions, undefined>;

export const BOOLEAN_CONNECTION_OPTION_NAMES = getSynchronizedTypeKeys<BooleanConnectionOptions>(
  BOOLEAN_CONNECTION_OPTION_MAP,
);

/** Options de connexion de type number */
type NumberConnectionOptions = PickByType<Omit<FirebirdConnectionOptions, AnyOptions>, number>;

const NUMBER_CONNECTION_OPTION_MAP = {
  port: undefined,
  retryConnectionInterval: undefined,
} as const satisfies Record<keyof NumberConnectionOptions, undefined>;

export const NUMBER_CONNECTION_OPTION_NAMES = getSynchronizedTypeKeys<NumberConnectionOptions>(
  NUMBER_CONNECTION_OPTION_MAP,
);

export const CONNECTION_OPTION_NAMES = getSynchronizedTypeKeys<FirebirdConnectionOptions>({
  ...STRING_CONNECTION_OPTION_MAP,
  ...BOOLEAN_CONNECTION_OPTION_MAP,
  ...NUMBER_CONNECTION_OPTION_MAP,
});
