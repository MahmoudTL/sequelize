import { AbstractQueryGeneratorInternal } from '@sequelize/core/_non-semver-use-at-your-own-risk_/abstract-dialect/query-generator-internal.js';
import type { AddLimitOffsetOptions } from '@sequelize/core/_non-semver-use-at-your-own-risk_/abstract-dialect/query-generator.internal-types.js';
import { formatFirebirdStyleLimitOffset } from '@sequelize/core/_non-semver-use-at-your-own-risk_/utils/sql.js';  // Adapter cette fonction si nécessaire
import type { FirebirdDialect } from './dialect.js';

export class FirebirdQueryGeneratorInternal<
  Dialect extends FirebirdDialect = FirebirdDialect,
> extends AbstractQueryGeneratorInternal<Dialect> {
  // Firebird n'a pas de schémas techniques comme MySQL/MariaDB
  getTechnicalSchemaNames() {
    return [];
  }

  addLimitAndOffset(options: AddLimitOffsetOptions) {
    
    return formatFirebirdStyleLimitOffset(options, this.queryGenerator);  // Adaptez cette fonction en fonction des spécifications de Firebird
  }
}
