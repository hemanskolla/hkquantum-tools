import type { Db, ObjectId } from 'mongodb';

export interface JwtPayload {
  sub: string;
  name: string;
  ledger_db: string;
  todo_db: string;
  ledger_other_id: string;
  todo_other_id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      ledgerDb: Db;
      todoDb: Db;
      ledgerOtherId: ObjectId;
      todoOtherId: ObjectId;
    }
  }
}
