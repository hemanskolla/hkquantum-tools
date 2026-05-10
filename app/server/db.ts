import { MongoClient } from 'mongodb';

let _client!: MongoClient;

export async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in .env');
  _client = new MongoClient(uri);
  await _client.connect();
}

export function getClient(): MongoClient {
  return _client;
}

export function getAdminDb() {
  return _client.db('hkquantum_admin');
}
