import type { BindParamOptions, GeoJson } from '@sequelize/core';
import type { AcceptedDate } from '@sequelize/core/_non-semver-use-at-your-own-risk_/abstract-dialect/data-types.js';
import * as BaseTypes from '@sequelize/core/_non-semver-use-at-your-own-risk_/abstract-dialect/data-types.js';
import { isValidTimeZone } from '@sequelize/core/_non-semver-use-at-your-own-risk_/utils/dayjs.js';
import { isString } from '@sequelize/utils';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export class FLOAT extends BaseTypes.FLOAT {
  protected getNumberSqlTypeName(): string {
    return 'FLOAT';
  }
}

export class BOOLEAN extends BaseTypes.BOOLEAN {
  toSql() {
    return 'BOOLEAN';
  }

  toBindableValue(value: boolean | unknown): unknown {
    // Firebird supporte directement le type BOOLEAN.
    return value ? 1 : 0;
  }
}

export class DATE extends BaseTypes.DATE {
  toBindableValue(date: AcceptedDate) {
    date = this._applyTimezone(date);

    const precision = this.options.precision ?? 0;
    let format = 'YYYY-MM-DD HH:mm:ss';

    if (precision > 0) {
      format += `.SSS`;
    }

    return date.format(format);
  }

  sanitize(value: unknown, options?: { timezone?: string }): unknown {
    if (isString(value) && options?.timezone) {
      if (isValidTimeZone(options.timezone)) {
        return dayjs.tz(value, options.timezone).toDate();
      }

      return new Date(`${value} ${options.timezone}`);
    }

    return super.sanitize(value);
  }
}

export class UUID extends BaseTypes.UUID {
  toSql() {
    return 'CHAR(36)';
  }
}

export class GEOMETRY extends BaseTypes.GEOMETRY {
  toBindableValue(value: GeoJson) {
    // Firebird n'a pas de support natif pour GEOMETRY, il faudra utiliser BLOB ou une autre solution.
    throw new Error('GEOMETRY type is not natively supported by Firebird.');
  }

  getBindParamSql(value: GeoJson, options: BindParamOptions) {
    throw new Error('GEOMETRY type is not natively supported by Firebird.');
  }

  toSql() {
    return 'BLOB SUB_TYPE TEXT'; // Utilisation d'un BLOB pour stocker les données géographiques.
  }
}

export class ENUM<Member extends string> extends BaseTypes.ENUM<Member> {
  toSql() {
    // Firebird n'a pas de type ENUM, utiliser CHECK pour simuler le comportement.
    const values = this.options.values.map(value => `'${value}'`).join(', ');
    return `VARCHAR(255) CHECK (VALUE IN (${values}))`;
  }
}
