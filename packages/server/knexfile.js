// Knexfile for running migrations
const path = require('path');
const { knexSnakeCaseMappers } = require('objection');

// Load .env from server directory or root directory
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.SYSTEM_DB_NAME || 'bigcapital_system',
      charset: process.env.DB_CHARSET || 'utf8',
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
      loadExtensions: ['.ts'],
    },
    seeds: {
      directory: './src/database/seeds/core',
      extension: 'ts',
      loadExtensions: ['.ts'],
    },
    pool: { min: 0, max: 7 },
    ...knexSnakeCaseMappers({ upperCase: true }),
  },

  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.SYSTEM_DB_NAME || 'bigcapital_system',
      charset: process.env.DB_CHARSET || 'utf8',
    },
    pool: {
      min: 0,
      max: 10,
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
      loadExtensions: ['.ts'],
    },
    seeds: {
      directory: './src/database/seeds/core',
      extension: 'ts',
      loadExtensions: ['.ts'],
    },
    ...knexSnakeCaseMappers({ upperCase: true }),
  },
};
