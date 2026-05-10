import type { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { getUserDbs } from '../dbManager.js';

export function dbMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { sub: email, ledger_db, todo_db, ledger_other_id, todo_other_id } = req.user;
  const { ledgerDb, todoDb } = getUserDbs(email, ledger_db, todo_db);

  req.ledgerDb = ledgerDb;
  req.todoDb = todoDb;
  req.ledgerOtherId = new ObjectId(ledger_other_id);
  req.todoOtherId = new ObjectId(todo_other_id);

  next();
}
