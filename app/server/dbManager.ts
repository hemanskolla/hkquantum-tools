import { Db, ObjectId } from 'mongodb';
import { getClient } from './db.js';

interface UserDbs {
  ledgerDb: Db;
  todoDb: Db;
}

const dbCache = new Map<string, UserDbs>();

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function dbNamesForEmail(email: string): { ledgerDbName: string; todoDbName: string } {
  const s = sanitizeEmail(email);
  return {
    ledgerDbName: `user-${s}-ledger-db`,
    todoDbName: `user-${s}-todo-db`,
  };
}

export function getUserDbs(email: string, ledgerDbName: string, todoDbName: string): UserDbs {
  const cached = dbCache.get(email);
  if (cached) return cached;

  const client = getClient();
  const entry: UserDbs = {
    ledgerDb: client.db(ledgerDbName),
    todoDb: client.db(todoDbName),
  };
  dbCache.set(email, entry);
  return entry;
}

export async function provisionUserDbs(email: string): Promise<{
  ledgerDb: Db;
  todoDb: Db;
  ledgerDbName: string;
  todoDbName: string;
  ledgerOtherId: ObjectId;
  todoOtherId: ObjectId;
}> {
  const { ledgerDbName, todoDbName } = dbNamesForEmail(email);
  const client = getClient();
  const ledgerDb = client.db(ledgerDbName);
  const todoDb = client.db(todoDbName);

  await ledgerDb.collection('categories').createIndex({ name: 1 }, { unique: true });
  await todoDb.collection('categories').createIndex({ name: 1 }, { unique: true });

  const now = new Date().toISOString();
  const [ledgerResult, todoResult] = await Promise.all([
    ledgerDb.collection('categories').insertOne({ name: 'Other', created_at: now }),
    todoDb.collection('categories').insertOne({ name: 'Other', created_at: now }),
  ]);

  dbCache.set(email, { ledgerDb, todoDb });

  return {
    ledgerDb,
    todoDb,
    ledgerDbName,
    todoDbName,
    ledgerOtherId: ledgerResult.insertedId,
    todoOtherId: todoResult.insertedId,
  };
}
