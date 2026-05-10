import { ObjectId } from 'mongodb';
import { getAdminDb } from './db.js';

export interface UserRecord {
  email: string;
  name: string;
  ledger_db: string;
  todo_db: string;
  ledger_other_category_id: ObjectId;
  todo_other_category_id: ObjectId;
  created_at: string;
}

export async function findUser(email: string): Promise<UserRecord | null> {
  const doc = await getAdminDb().collection<UserRecord>('users').findOne({ email });
  return doc ?? null;
}

export async function createUser(record: UserRecord): Promise<UserRecord> {
  await getAdminDb().collection<UserRecord>('users').insertOne(record);
  return record;
}
