import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect } from './db.js';
import categoryRoutes from './routes/myledger/categoryRoutes.js';
import contactRoutes from './routes/myledger/contactRoutes.js';
import todoCategoryRoutes from './routes/mytodo/categoryRoutes.js';
import todoTaskRoutes from './routes/mytodo/taskRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const PORT = process.env.SERVER_PORT ?? 8000;
const app = express();

app.use(express.json());

let dbReady = false;
app.use('/api', (_req, res, next) => {
  if (!dbReady) { res.status(503).json({ error: 'Server starting, please retry' }); return; }
  next();
});

app.use('/api/myledger/categories', categoryRoutes);
app.use('/api/myledger/contacts', contactRoutes);
app.use('/api/mytodo/categories', todoCategoryRoutes);
app.use('/api/mytodo/tasks', todoTaskRoutes);

const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));
app.get(/^(?!\/api).*$/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connect()
    .then(() => { dbReady = true; console.log('Database connected'); })
    .catch((err) => { console.error('Database connection failed:', err); process.exit(1); });
});
