import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { findUser, createUser } from '../userRegistry.js';
import { provisionUserDbs } from '../dbManager.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

function makeOAuthClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

router.get('/auth/google', (_req, res) => {
  const client = makeOAuthClient();
  const url = client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
  });
  res.redirect(url);
});

router.get('/auth/google/callback', async (req, res) => {
  const code = req.query['code'] as string | undefined;
  if (!code) {
    res.status(400).send('Missing authorization code');
    return;
  }

  try {
    const client = makeOAuthClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      res.status(400).send('No ID token returned from Google');
      return;
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.name) {
      res.status(400).send('Could not retrieve profile from Google');
      return;
    }

    const email = payload.email;
    const name = payload.name;

    let user = await findUser(email);

    if (!user) {
      const { ledgerDbName, todoDbName, ledgerOtherId, todoOtherId } = await provisionUserDbs(email);
      user = await createUser({
        email,
        name,
        ledger_db: ledgerDbName,
        todo_db: todoDbName,
        ledger_other_category_id: ledgerOtherId,
        todo_other_category_id: todoOtherId,
        created_at: new Date().toISOString(),
      });
    }

    const token = jwt.sign(
      {
        sub: email,
        name: user.name,
        ledger_db: user.ledger_db,
        todo_db: user.todo_db,
        ledger_other_id: user.ledger_other_category_id.toString(),
        todo_other_id: user.todo_other_category_id.toString(),
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('hkq_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect('/');
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Authentication failed');
  }
});

router.get('/api/auth/me', authMiddleware, (req, res) => {
  const u = req.user!;
  res.json({
    email: u.sub,
    name: u.name,
    ledgerOtherId: u.ledger_other_id,
    todoOtherId: u.todo_other_id,
  });
});

router.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('hkq_token', { httpOnly: true, sameSite: 'lax' });
  res.status(204).send();
});

export default router;
