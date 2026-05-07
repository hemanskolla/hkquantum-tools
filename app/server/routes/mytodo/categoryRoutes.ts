import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getTodoDb } from '../../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const col = getTodoDb().collection('categories');
  const [orderDoc, docs] = await Promise.all([
    col.findOne({ type: 'order-doc' }),
    col.find({ type: { $exists: false } }).toArray(),
  ]);

  if (orderDoc?.order?.length) {
    const idxMap = new Map<string, number>(
      (orderDoc.order as ObjectId[]).map((id, i) => [id.toString(), i])
    );
    docs.sort((a, b) => {
      const ai = idxMap.get(a._id.toString()) ?? Infinity;
      const bi = idxMap.get(b._id.toString()) ?? Infinity;
      return ai !== bi ? ai - bi : a.name.localeCompare(b.name);
    });
  } else {
    docs.sort((a, b) => a.name.localeCompare(b.name));
  }

  res.json(docs.map((d) => ({ id: d._id.toString(), name: d.name, created_at: d.created_at })));
});

router.put('/order', async (req, res) => {
  const { order } = req.body as { order?: string[] };
  if (!Array.isArray(order)) {
    res.status(400).json({ error: 'order must be an array of id strings' });
    return;
  }
  let objectIds: ObjectId[];
  try {
    objectIds = order.map((id) => new ObjectId(id));
  } catch {
    res.status(400).json({ error: 'invalid id in order array' });
    return;
  }
  await getTodoDb().collection('categories').updateOne(
    { type: 'order-doc' },
    { $set: { type: 'order-doc', order: objectIds } },
    { upsert: true }
  );
  res.status(204).send();
});

router.post('/', async (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'name is required' }); return; }

  const now = new Date().toISOString();
  try {
    const result = await getTodoDb().collection('categories').insertOne({ name: name.trim(), created_at: now });
    res.status(201).json({ id: result.insertedId.toString(), name: name.trim(), created_at: now });
  } catch (err: any) {
    if (err?.code === 11000) { res.status(409).json({ error: 'Category already exists' }); return; }
    throw err;
  }
});

router.delete('/:id', async (req, res) => {
  let oid: ObjectId;
  try { oid = new ObjectId(req.params['id']); }
  catch { res.status(404).json({ error: 'Not found' }); return; }

  const inUse = await getTodoDb().collection('tasks').findOne({ category_id: oid });
  if (inUse) { res.status(409).json({ error: 'Category is in use by one or more tasks' }); return; }

  const result = await getTodoDb().collection('categories').deleteOne({ _id: oid });
  if (result.deletedCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).send();
});

export default router;
