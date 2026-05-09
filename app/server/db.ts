import { MongoClient, Db, ObjectId } from 'mongodb';
import { LEDGER_OTHER_CATEGORY_ID as LEDGER_OTHER_ID, TODO_OTHER_CATEGORY_ID as TODO_OTHER_ID } from '@shared/constants';

let _ledger_db!: Db;
let _todo_db!: Db;

export const LEDGER_OTHER_CATEGORY_ID = new ObjectId(LEDGER_OTHER_ID);
export const TODO_OTHER_CATEGORY_ID = new ObjectId(TODO_OTHER_ID);

export async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in .env');

  const client = new MongoClient(uri);
  await client.connect();
  _ledger_db = client.db(process.env.MYLEDGER_DB_NAME);
  _todo_db = client.db(process.env.MYTODO_DB_NAME);

  await _ledger_db.collection('categories').createIndex({ name: 1 }, { unique: true });
  await _todo_db.collection('categories').createIndex({ name: 1 }, { unique: true });

  // Backfill: ensure all task documents have due_date field (null for non-time-sensitive)
  await _todo_db.collection('tasks').updateMany(
    { due_date: { $exists: false } },
    { $set: { due_date: null } },
  );
}

export function getDb(): Db {
  return _ledger_db;
}

export function getTodoDb(): Db {
  return _todo_db;
}
