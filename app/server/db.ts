import { MongoClient, Db, ObjectId } from 'mongodb';

let _ledger_db!: Db;
let _todo_db!: Db;

export const OTHER_CATEGORY_ID = new ObjectId('69ed71237ba869aee9620036');

export async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in .env');

  const client = new MongoClient(uri);
  await client.connect();
  _ledger_db = client.db(process.env.MYLEDGER_DB_NAME);
  _todo_db = client.db(process.env.MYTODO_DB_NAME);

  await _ledger_db.collection('categories').createIndex({ name: 1 }, { unique: true });
  await _todo_db.collection('categories').createIndex({ name: 1 }, { unique: true });
}

export function getDb(): Db {
  return _ledger_db;
}

export function getTodoDb(): Db {
  return _todo_db;
}
