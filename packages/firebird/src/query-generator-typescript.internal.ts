import type {
    Expression,
    ListSchemasQueryOptions,
    ListTablesQueryOptions,
    RemoveIndexQueryOptions,
    ShowConstraintsQueryOptions,
    TableOrModel,
    TruncateTableQueryOptions,
  } from '@sequelize/core';
  import { AbstractQueryGenerator, Op } from '@sequelize/core';
  import type { EscapeOptions } from '@sequelize/core/_non-semver-use-at-your-own-risk_/abstract-dialect/query-generator-typescript.js';
  import {
    REMOVE_INDEX_QUERY_SUPPORTABLE_OPTIONS,
    TRUNCATE_TABLE_QUERY_SUPPORTABLE_OPTIONS,
  } from '@sequelize/core/_non-semver-use-at-your-own-risk_/abstract-dialect/query-generator-typescript.js';
  import { rejectInvalidOptions } from '@sequelize/core/_non-semver-use-at-your-own-risk_/utils/check.js';
  import { joinSQLFragments } from '@sequelize/core/_non-semver-use-at-your-own-risk_/utils/join-sql-fragments.js';
  import { EMPTY_SET } from '@sequelize/core/_non-semver-use-at-your-own-risk_/utils/object.js';
  import { generateIndexName } from '@sequelize/core/_non-semver-use-at-your-own-risk_/utils/string.js';
  import type { FirebirdDialect } from './dialect.js';
  import { FirebirdQueryGeneratorInternal } from './query-generator.internal.js';
  
  const REMOVE_INDEX_QUERY_SUPPORTED_OPTIONS = new Set<keyof RemoveIndexQueryOptions>(['ifExists']);
  
  /**
   * Classe temporaire pour faciliter la migration vers TypeScript
   */
  export class FirebirdQueryGeneratorTypeScript extends AbstractQueryGenerator {
    readonly #internals: FirebirdQueryGeneratorInternal;
  
    constructor(
      dialect: FirebirdDialect,
      internals: FirebirdQueryGeneratorInternal = new FirebirdQueryGeneratorInternal(dialect),
    ) {
      super(dialect, internals);
  
      internals.whereSqlBuilder.setOperatorKeyword(Op.regexp, 'REGEXP');
      internals.whereSqlBuilder.setOperatorKeyword(Op.notRegexp, 'NOT REGEXP');
  
      this.#internals = internals;
    }
  
    listSchemasQuery(options?: ListSchemasQueryOptions) {
      let schemasToSkip = this.#internals.getTechnicalSchemaNames();
  
      if (options && Array.isArray(options?.skip)) {
        schemasToSkip = [...schemasToSkip, ...options.skip];
      }
  
      // Firebird n'a pas de schémas comme MariaDB, il utilise des bases de données distinctes
      return joinSQLFragments([
        'SELECT RDB$DATABASE AS schema',
        'FROM RDB$DATABASE',
      ]);
    }
  
    describeTableQuery(tableName: TableOrModel) {
      // Firebird utilise RDB$FIELDS pour décrire les colonnes
      return `SELECT RDB$FIELD_NAME AS columnName, RDB$FIELD_TYPE AS fieldType, RDB$NULL_FLAG AS isNull
              FROM RDB$FIELDS
              WHERE RDB$RELATION_NAME = ${this.escape(tableName)}`;
    }
  
    listTablesQuery(options?: ListTablesQueryOptions) {
      // Firebird utilise RDB$RELATIONS pour lister les tables
      return joinSQLFragments([
        'SELECT RDB$RELATION_NAME AS tableName FROM RDB$RELATIONS',
        options?.schema ? `WHERE RDB$RELATION_NAME = ${this.escape(options.schema)}` : '',
      ]);
    }
  
    truncateTableQuery(tableName: TableOrModel, options?: TruncateTableQueryOptions) {
      if (options) {
        rejectInvalidOptions(
          'truncateTableQuery',
          this.dialect,
          TRUNCATE_TABLE_QUERY_SUPPORTABLE_OPTIONS,
          EMPTY_SET,
          options,
        );
      }
  
      // Firebird n'a pas de TRUNCATE, on utilise DELETE
      return `DELETE FROM ${this.quoteTable(tableName)}`;
    }
  
    showConstraintsQuery(tableName: TableOrModel, options?: ShowConstraintsQueryOptions) {
      // Firebird utilise RDB$RELATION_CONSTRAINTS pour les contraintes
      return joinSQLFragments([
        'SELECT RDB$CONSTRAINT_NAME AS constraintName, RDB$CONSTRAINT_TYPE AS constraintType',
        'FROM RDB$RELATION_CONSTRAINTS',
        `WHERE RDB$RELATION_NAME = ${this.escape(tableName)}`,
      ]);
    }
  
    showIndexesQuery(tableName: TableOrModel) {
      // Firebird utilise RDB$INDICES pour lister les index
      return `SELECT RDB$INDEX_NAME AS indexName FROM RDB$INDICES WHERE RDB$RELATION_NAME = ${this.escape(tableName)}`;
    }
  }
  