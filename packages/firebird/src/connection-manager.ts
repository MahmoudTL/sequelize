import type { AbstractConnection, ConnectionOptions } from '@sequelize/core';
import {
  AbstractConnectionManager,
  AccessDeniedError,
  ConnectionError,
  ConnectionRefusedError,
  HostNotFoundError,
  HostNotReachableError,
  InvalidConnectionError,
} from '@sequelize/core';
import { isErrorWithStringCode } from '@sequelize/core/_non-semver-use-at-your-own-risk_/utils/check.js';
import { logger } from '@sequelize/core/_non-semver-use-at-your-own-risk_/utils/logger.js';
import * as Firebird from 'node-firebird';

const debug = logger.debugContext('connection:firebird');

export type FirebirdModule = typeof Firebird;

export interface FirebirdConnection extends AbstractConnection, Firebird.Connection {}

export interface FirebirdConnectionOptions
  extends Omit<Firebird.Options, 'timezone'> {}

/**
 * Firebird Connection Manager
 *
 * Manage connections, validate, and disconnect them.
 * Handles Firebird-specific connection settings and errors.
 */
export class FirebirdConnectionManager extends AbstractConnectionManager<
  any, // Replace `any` with your custom FirebirdDialect if defined
  FirebirdConnection
> {
  readonly #lib: FirebirdModule;

  constructor(dialect: any) {
    super(dialect);
    this.#lib = Firebird;
  }

  /**
   * Establish a connection to the Firebird database.
   * @param config Configuration for the connection.
   */
  async connect(config: ConnectionOptions<any>): Promise<FirebirdConnection> {
    const connectionConfig: Firebird.Options = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      charset: this.sequelize.options.charset || 'UTF8',
      role: config.role,
    };

    return new Promise((resolve, reject) => {
      this.#lib.attach(connectionConfig, (error, connection) => {
        if (error) {
          if (isErrorWithStringCode(error)) {
            switch (error.code) {
              case 'ECONNREFUSED':
                reject(new ConnectionRefusedError(error));
                break;
              case 'EACCES':
                reject(new AccessDeniedError(error));
                break;
              case 'ENOTFOUND':
                reject(new HostNotFoundError(error));
                break;
              case 'EHOSTUNREACH':
                reject(new HostNotReachableError(error));
                break;
              case 'EINVAL':
                reject(new InvalidConnectionError(error));
                break;
              default:
                reject(new ConnectionError(error));
            }
          } else {
            reject(new ConnectionError(error));
          }
          return;
        }

        debug('connection acquired');
        resolve(connection as FirebirdConnection);
      });
    });
  }

  /**
   * Disconnect a connection.
   * @param connection The connection to disconnect.
   */
  async disconnect(connection: FirebirdConnection) {
    if (!connection.connected) {
      debug('connection tried to disconnect but was already closed');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      connection.detach((error) => {
        if (error) {
          reject(new ConnectionError(error));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Validate that a connection is still active.
   * @param connection The connection to validate.
   */
  validate(connection: FirebirdConnection): boolean {
    return connection && connection.connected;
  }
}
