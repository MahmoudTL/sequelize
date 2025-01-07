const Firebird = require('node-firebird');

const ER_DUP_ENTRY = '23505';  // Code d'erreur pour violation de clé unique
const ER_DEADLOCK = '40001';  // Code d'erreur pour un deadlock
const ER_FOREIGN_KEY_VIOLATION = '335544344';  // Code d'erreur pour violation de clé étrangère

class FirebirdDatabase {
  constructor(config) {
    this.config = config;
    this.connection = null;
  }

  // Connecter à la base de données Firebird
  connect() {
    return new Promise((resolve, reject) => {
      Firebird.attach(this.config, (err, db) => {
        if (err) {
          return reject(err);
        }
        this.connection = db;
        resolve(db);
      });
    });
  }

  // Exécution de requêtes
  async run(sql, parameters) {
    const { connection } = this;
    let results;

    try {
      results = await this.executeQuery(sql, parameters);
    } catch (error) {
      error.sql = sql;
      error.parameters = parameters;
      throw this.formatError(error);
    }

    return results;
  }

  // Exécution réelle de la requête
  executeQuery(sql, parameters) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, parameters, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  }

  // Formater l'erreur en fonction du code d'erreur Firebird
  formatError(err) {
    switch (err.code) {
      case ER_DUP_ENTRY:
        return new Error(`Unique constraint violation: ${err.message}`);
      case ER_DEADLOCK:
        return new Error('Deadlock occurred');
      case ER_FOREIGN_KEY_VIOLATION:
        return new Error('Foreign key constraint violation');
      default:
        return new Error(`Database error: ${err.message}`);
    }
  }

  // Récupérer les index d'une table
  async getIndexes(tableName) {
    const sql = `
      SELECT RDB$INDEX_NAME, RDB$RELATION_NAME, RDB$FIELD_NAME
      FROM RDB$INDEX_SEGMENTS
      WHERE RDB$RELATION_NAME = ?`;

    const indexes = await this.run(sql, [tableName]);

    return this.handleShowIndexesQuery(indexes);
  }

  // Formater les résultats des index
  handleShowIndexesQuery(data) {
    const result = [];

    data.forEach(item => {
      result.push({
        name: item.RDB$INDEX_NAME,
        tableName: item.RDB$RELATION_NAME,
        fields: [item.RDB$FIELD_NAME],
        unique: true, // Firebird ne gère pas cette propriété directement
      });
    });

    return result;
  }

  // Démarrer une transaction
  startTransaction() {
    return new Promise((resolve, reject) => {
      this.connection.startTransaction((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  // Valider une transaction
  commitTransaction() {
    return new Promise((resolve, reject) => {
      this.connection.commit((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  // Annuler une transaction
  rollbackTransaction() {
    return new Promise((resolve, reject) => {
      this.connection.rollback((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  // Fermer la connexion à la base de données
  close() {
    return new Promise((resolve, reject) => {
      if (this.connection) {
        this.connection.detach((err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = FirebirdDatabase;
