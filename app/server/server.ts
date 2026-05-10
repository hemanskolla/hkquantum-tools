import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { connect } from './db.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { dbMiddleware } from './middleware/dbMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/myledger/categoryRoutes.js';
import contactRoutes from './routes/myledger/contactRoutes.js';
import todoCategoryRoutes from './routes/mytodo/categoryRoutes.js';
import todoTaskRoutes from './routes/mytodo/taskRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT ?? process.env.SERVER_PORT ?? 8000;
const app = express();

app.use(express.json());
app.use(cookieParser());

let dbReady = false;
app.use('/api', (_req, res, next) => {
  if (!dbReady) { res.status(503).json({ error: 'Server starting, please retry' }); return; }
  next();
});
app.use('/auth', (_req, res, next) => {
  if (!dbReady) { res.status(503).send('Server starting, please retry'); return; }
  next();
});

app.use(authRoutes);

const apiProtected = [authMiddleware, dbMiddleware] as const;
app.use('/api/myledger/categories', ...apiProtected, categoryRoutes);
app.use('/api/myledger/contacts', ...apiProtected, contactRoutes);
app.use('/api/mytodo/categories', ...apiProtected, todoCategoryRoutes);
app.use('/api/mytodo/tasks', ...apiProtected, todoTaskRoutes);

const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));
app.get(/^(?!\/api|\/auth).*$/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connect()
    .then(() => { dbReady = true; console.log('Database connected'); })
    .catch((err) => { console.error('Database connection failed:', err); process.exit(1); });
});
