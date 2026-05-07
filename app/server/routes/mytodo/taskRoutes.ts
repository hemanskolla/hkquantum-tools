import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getTodoDb } from '../../db.js';
import type { Task } from '../../../shared/types/mytodo.js';

const router = Router();

const PURGE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function toTask(doc: Record<string, any>): Task {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description ?? null,
    category_id: doc.category_id ? doc.category_id.toString() : null,
    time_sensitive: doc.time_sensitive ?? false,
    completed: doc.completed ?? false,
    completed_at: doc.completed_at ?? null,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };
}

router.get('/', async (req, res) => {
  const view = req.query['view'] as string | undefined;

  if (view === 'completed') {
    const cutoff = new Date(Date.now() - PURGE_WINDOW_MS).toISOString();
    await getTodoDb().collection('tasks').deleteMany({
      completed: true,
      completed_at: { $lt: cutoff },
    });
    const docs = await getTodoDb()
      .collection('tasks')
      .find({ completed: true })
      .sort({ completed_at: -1 })
      .toArray();
    res.json(docs.map(toTask));
    return;
  }

  // Default: active tasks
  const docs = await getTodoDb()
    .collection('tasks')
    .find({ completed: false })
    .sort({ time_sensitive: -1, updated_at: -1 })
    .toArray();
  res.json(docs.map(toTask));
});

router.post('/', async (req, res) => {
  const { title, description, category_id, time_sensitive } = req.body as {
    title?: string; description?: string; category_id?: string | null; time_sensitive?: boolean;
  };

  if (!title?.trim()) { res.status(400).json({ error: 'title is required' }); return; }

  let catOid: ObjectId | null = null;
  if (category_id) {
    try { catOid = new ObjectId(category_id); }
    catch { res.status(400).json({ error: 'Invalid category_id' }); return; }
  }

  const now = new Date().toISOString();
  const result = await getTodoDb().collection('tasks').insertOne({
    title: title.trim(),
    description: description?.trim() || null,
    category_id: catOid,
    time_sensitive: time_sensitive ?? false,
    completed: false,
    completed_at: null,
    created_at: now,
    updated_at: now,
  });

  const doc = await getTodoDb().collection('tasks').findOne({ _id: result.insertedId });
  res.status(201).json(toTask(doc!));
});

router.put('/:id', async (req, res) => {
  let oid: ObjectId;
  try { oid = new ObjectId(req.params['id']); }
  catch { res.status(404).json({ error: 'Not found' }); return; }

  const { title, description, category_id, time_sensitive } = req.body as {
    title?: string; description?: string; category_id?: string | null; time_sensitive?: boolean;
  };

  if (!title?.trim()) { res.status(400).json({ error: 'title is required' }); return; }

  let catOid: ObjectId | null = null;
  if (category_id) {
    try { catOid = new ObjectId(category_id); }
    catch { res.status(400).json({ error: 'Invalid category_id' }); return; }
  }

  const doc = await getTodoDb().collection('tasks').findOneAndUpdate(
    { _id: oid },
    {
      $set: {
        title: title.trim(),
        description: description?.trim() || null,
        category_id: catOid,
        time_sensitive: time_sensitive ?? false,
        updated_at: new Date().toISOString(),
      },
    },
    { returnDocument: 'after' },
  );

  if (!doc) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(toTask(doc));
});

router.patch('/:id/complete', async (req, res) => {
  let oid: ObjectId;
  try { oid = new ObjectId(req.params['id']); }
  catch { res.status(404).json({ error: 'Not found' }); return; }

  const existing = await getTodoDb().collection('tasks').findOne({ _id: oid });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }

  const nowCompleted = !existing.completed;
  const now = new Date().toISOString();
  const doc = await getTodoDb().collection('tasks').findOneAndUpdate(
    { _id: oid },
    {
      $set: {
        completed: nowCompleted,
        completed_at: nowCompleted ? now : null,
        updated_at: now,
      },
    },
    { returnDocument: 'after' },
  );

  res.json(toTask(doc!));
});

router.delete('/:id', async (req, res) => {
  let oid: ObjectId;
  try { oid = new ObjectId(req.params['id']); }
  catch { res.status(404).json({ error: 'Not found' }); return; }

  const result = await getTodoDb().collection('tasks').deleteOne({ _id: oid });
  if (result.deletedCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).send();
});

export default router;
