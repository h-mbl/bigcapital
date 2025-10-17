#!/usr/bin/env node
import { Command } from 'commander';
import * as color from 'colorette';
import knex, { Knex } from 'knex';
import { knexSnakeCaseMappers } from 'objection';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

function initSystemKnex(): Knex {
  return knex({
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.SYSTEM_DB_NAME || 'bigcapital_system',
      charset: process.env.DB_CHARSET || 'utf8',
    },
    migrations: {
      directory: path.join(__dirname, '../database/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '../database/seeds/core'),
    },
    pool: { min: 0, max: 7 },
    ...knexSnakeCaseMappers({ upperCase: true }),
  });
}

function exit(text: any) {
  if (text instanceof Error) {
    console.error(
      color.red(`${text.message ? `${text.message}\n` : ''}${text.stack}`)
    );
  } else {
    console.error(color.red(text));
  }
  process.exit(1);
}

function success(text: string) {
  console.log(color.green(text));
  process.exit(0);
}

const program = new Command();

program
  .name('bigcapital')
  .description('Bigcapital CLI for database migrations and management')
  .version('1.0.0');

// system:migrate:latest
program
  .command('system:migrate:latest')
  .description('Migrate latest migration of the system database.')
  .action(async () => {
    try {
      const sysKnex = initSystemKnex();
      const [batchNo, log] = await sysKnex.migrate.latest();

      if (log.length === 0) {
        success(color.cyan('Already up to date'));
      }
      success(
        color.green(`Batch ${batchNo} run: ${log.length} migrations\n`) +
          color.cyan(log.join('\n'))
      );
    } catch (error) {
      exit(error);
    }
  });

// system:migrate:rollback
program
  .command('system:migrate:rollback')
  .description('Rollback the system database.')
  .action(async () => {
    try {
      const sysKnex = initSystemKnex();
      const [batchNo, log] = await sysKnex.migrate.rollback();

      if (log.length === 0) {
        success(color.cyan('Already at the base migration'));
      }
      success(
        color.green(`Batch ${batchNo} rolled back: ${log.length} migrations\n`) +
          color.cyan(log.join('\n'))
      );
    } catch (error) {
      exit(error);
    }
  });

// system:migrate:make
program
  .command('system:migrate:make <name>')
  .description('Create a named migration file for the system database.')
  .action(async (name: string) => {
    try {
      const sysKnex = initSystemKnex();
      const filename = await sysKnex.migrate.make(name);
      success(color.green(`Created Migration: ${filename}`));
    } catch (error) {
      exit(error);
    }
  });

program.parse(process.argv);
