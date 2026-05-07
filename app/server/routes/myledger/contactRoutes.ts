import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDb, LEDGER_OTHER_CATEGORY_ID } from '../../db.js';
import type { ContactWithNotes } from '../../../shared/types/myledger.js';

const router = Router();

function toContact(doc: Record<string, any>): ContactWithNotes {
  return {
    id: doc._id.toString(),
    name: doc.name,
    role: doc.role ?? null,
    company: doc.company ?? null,
    where_met: doc.where_met ?? null,
    linkedin: doc.linkedin ?? null,
    email: doc.email ?? null,
    phone: doc.phone ?? null,
    categories: (doc.categories ?? [{ id: LEDGER_OTHER_CATEGORY_ID, status: 'actual' }]).map(
      (c: Record<string, any>) => ({
        id: c.id.toString(),
        status: c.status === 'potential' ? 'potential' : 'actual',
      })
    ),
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    notes: (doc.notes ?? []).map((n: Record<string, any>) => ({
      id: n._id.toString(),
      contact_id: doc._id.toString(),
      body: n.body,
      position: n.position,
    })),
  };
}

function parseNotes(bodies: string[]) {
  return bodies
    .filter((b) => b.trim())
    .map((body, i) => ({ _id: new ObjectId(), body: body.trim(), position: i }));
}

function parseCategories(
  cats: { id: string; status: string }[]
): { id: ObjectId; status: 'actual' | 'potential' }[] {
  return cats.map((c) => ({
    id: new ObjectId(c.id),
    status: c.status === 'potential' ? 'potential' : 'actual',
  }));
}

router.get('/', async (_req, res) => {
  const docs = await getDb().collection('contacts').find().sort({ created_at: 1 }).toArray();
  res.json(docs.map(toContact));
});

router.post('/', async (req, res) => {
  const { name, role, company, where_met, linkedin, email, phone, categories, notes } = req.body as {
    name?: string; role?: string; company?: string;
    where_met?: string; linkedin?: string; email?: string; phone?: string;
    categories?: { id: string; status: string }[]; notes?: string[];
  };

  if (!name?.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  let parsedCats: { id: ObjectId; status: 'actual' | 'potential' }[];
  if (categories?.length) {
    try { parsedCats = parseCategories(categories); }
    catch { res.status(400).json({ error: 'Invalid categories' }); return; }
  } else {
    parsedCats = [{ id: LEDGER_OTHER_CATEGORY_ID, status: 'actual' }];
  }

  const now = new Date().toISOString();
  const result = await getDb().collection('contacts').insertOne({
    name: name.trim(),
    role: role?.trim() || null,
    company: company?.trim() || null,
    where_met: where_met?.trim() || null,
    linkedin: linkedin?.trim() || null,
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    categories: parsedCats,
    notes: parseNotes(notes ?? []),
    created_at: now,
    updated_at: now,
  });

  const doc = await getDb().collection('contacts').findOne({ _id: result.insertedId });
  res.status(201).json(toContact(doc!));
});

router.put('/:id', async (req, res) => {
  let oid: ObjectId;
  try { oid = new ObjectId(req.params['id']); }
  catch { res.status(404).json({ error: 'Not found' }); return; }

  const { name, role, company, where_met, linkedin, email, phone, categories, notes } = req.body as {
    name?: string; role?: string; company?: string;
    where_met?: string; linkedin?: string; email?: string; phone?: string;
    categories?: { id: string; status: string }[]; notes?: string[];
  };

  if (!name?.trim() || !categories?.length) {
    res.status(400).json({ error: 'name and categories are required' });
    return;
  }

  let parsedCats: { id: ObjectId; status: 'actual' | 'potential' }[];
  try { parsedCats = parseCategories(categories); }
  catch { res.status(400).json({ error: 'Invalid categories' }); return; }

  const doc = await getDb().collection('contacts').findOneAndUpdate(
    { _id: oid },
    {
      $set: {
        name: name.trim(),
        role: role?.trim() || null,
        company: company?.trim() || null,
        where_met: where_met?.trim() || null,
        linkedin: linkedin?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        categories: parsedCats,
        notes: parseNotes(notes ?? []),
        updated_at: new Date().toISOString(),
      },
      $unset: { category_id: '', category_ids: '', status: '' },
    },
    { returnDocument: 'after' },
  );

  if (!doc) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(toContact(doc));
});

router.delete('/:id', async (req, res) => {
  let oid: ObjectId;
  try { oid = new ObjectId(req.params['id']); }
  catch { res.status(404).json({ error: 'Not found' }); return; }

  const result = await getDb().collection('contacts').deleteOne({ _id: oid });
  if (result.deletedCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).send();
});

export default router;
