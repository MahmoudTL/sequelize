import type { Sequelize } from '@sequelize/core';
import { AbstractDialect } from '@sequelize/core';
import type { SupportableNumericOptions } from '@sequelize/core/_non-semver-use-at-your-own-risk_/abstract-dialect/dialect.js';
import { parseCommonConnectionUrlOptions } from '@sequelize/core/_non-semver-use-at-your-own-risk_/utils/connection-options.js';
import {
  createUnspecifiedOrderedBindCollector,
  escapeSqlString,
} from '@sequelize/core/_non-semver-use-at-your-own-risk_/utils/sql.js';
import { getSynchronizedTypeKeys } from '@sequelize/utils';
import * as DataTypes from './_internal/data-types-overrides.js';
import type { FirebirdConnectionOptions } from './connection-manager.js';
import { FirebirdConnectionManager } from './connection-manager.js';
import { FirebirdQueryGenerator } from './query-generator.js';
import { FirebirdQueryInterface } from './query-interface.js';
import { FirebirdQuery } from './query.js';

export interface FirebirdDialectOptions {
  /**
   * Show warnings if there are any when executing a query
   */
  showWarnings?: boolean | undefined;
}

const DIALECT_OPTION_NAMES = getSynchronizedTypeKeys<FirebirdDialectOptions>({
  showWarnings: undefined,
});

const numericOptions: SupportableNumericOptions = {
  zerofill: false, // Firebird ne supporte pas zerofill
  unsigned: false, // Firebird n'a pas d'entiers non signés
};

export class FirebirdDialect extends AbstractDialect<
  FirebirdDialectOptions,
  FirebirdConnectionOptions
> {
  static supports = AbstractDialect.extendSupport({
    'VALUES ()': true,
    'LIMIT ON UPDATE': false,
    lock: true,
    forShare: 'WITH LOCK',
    settingIsolationLevelDuringTransaction: true,
    schemas: true,
    inserts: {
      ignoreDuplicates: null, // Firebird n'a pas IGNORE
      updateOnDuplicate: 'MERGE INTO', // Firebird utilise MERGE pour gérer les doublons
    },
    index: {
      collate: false,
      length: false,
      parser: false,
      type: true,
      using: true,
    },
    constraints: {
      foreignKeyChecksDisableable: true,
      removeOptions: { ifExists: true },
    },
    indexViaAlter: true,
    indexHints: false,
    dataTypes: {
      COLLATE_BINARY: true,
      GEOMETRY: false, // Non supporté dans Firebird
      INTS: numericOptions,
      FLOAT: { ...numericOptions, scaleAndPrecision: true },
      REAL: { ...numericOptions, scaleAndPrecision: true },
      DOUBLE: { ...numericOptions, scaleAndPrecision: true },
      DECIMAL: numericOptions,
      JSON: false, // JSON n'est pas natif dans Firebird
    },
    REGEXP: false, // Non supporté
    jsonOperations: false,
    jsonExtraction: null,
    uuidV1Generation: false, // UUID non natif
    globalTimeZoneConfig: true,
    removeColumn: {
      ifExists: true,
    },
    createSchema: {
      charset: true,
      collate: false,
      ifNotExists: true,
    },
    dropSchema: {
      ifExists: true,
    },
    startTransaction: {
      readOnly: true,
    },
  });

  readonly queryGenerator: FirebirdQueryGenerator;
  readonly connectionManager: FirebirdConnectionManager;
  readonly queryInterface: FirebirdQueryInterface;

  readonly Query = FirebirdQuery;

  constructor(sequelize: Sequelize, options: FirebirdDialectOptions) {
    super({
      dataTypesDocumentationUrl: 'https://firebirdsql.org/file/documentation/reference_manuals/fblangref25-en/html/fblangref25.html',
      identifierDelimiter: '"',
      minimumDatabaseVersion: '3.0', // Version minimale recommandée de Firebird
      name: 'firebird',
      options,
      sequelize,
      dataTypeOverrides: DataTypes,
    });

    this.connectionManager = new FirebirdConnectionManager(this);
    this.queryGenerator = new FirebirdQueryGenerator(this);
    this.queryInterface = new FirebirdQueryInterface(this);
  }

  createBindCollector() {
    return createUnspecifiedOrderedBindCollector();
  }

  escapeString(value: string) {
    return escapeSqlString(value); // Remplace `escapeMysqlMariaDbString`
  }

  canBackslashEscape() {
    return false; // Firebird n'utilise pas le backslash pour l'échappement
  }

  getDefaultSchema(): string {
    return this.sequelize.options.replication.write.database ?? '';
  }

  parseConnectionUrl(url: string): FirebirdConnectionOptions {
    return parseCommonConnectionUrlOptions<FirebirdConnectionOptions>({
      url: new URL(url),
      allowedProtocols: ['firebird'],
      hostname: 'host',
      port: 'port',
      pathname: 'database',
      username: 'user',
      password: 'password',
    });
  }

  static getSupportedOptions() {
    return DIALECT_OPTION_NAMES;
  }
}
