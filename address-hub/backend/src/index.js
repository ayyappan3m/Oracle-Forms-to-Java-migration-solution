/**
 * Address Hub backend.
 *
 * Express server backed by a single-file SQLite database. All routes are
 * mounted under /api. The database file is created on first run.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const addressService = require('./services/addressService');

const PORT = Number(process.env.PORT) || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const DATABASE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  process.env.DATABASE_PATH || 'data/addresses.db'
);

// Make sure the directory exists before SQLite tries to create the file.
fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });

const db = new Database(DATABASE_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --------------------------------------------------------------------------
// Schema
// --------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS addresses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    old_street  TEXT,
    old_city    TEXT,
    old_state   TEXT,
    old_zip     TEXT,
    new_street  TEXT    NOT NULL,
    new_city    TEXT    NOT NULL,
    new_state   TEXT    NOT NULL,
    new_zip     TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    address_id    INTEGER NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
    platform      TEXT    NOT NULL,
    username      TEXT,
    email         TEXT,
    status        TEXT    NOT NULL DEFAULT 'pending',
    update_date   TEXT,
    notes         TEXT,
    requires_api  INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS api_integrations (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    platform       TEXT    NOT NULL UNIQUE,
    api_key        TEXT,
    api_secret     TEXT,
    is_configured  INTEGER NOT NULL DEFAULT 0,
    auth_type      TEXT,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS update_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id  INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    action      TEXT    NOT NULL,
    status      TEXT,
    response    TEXT,
    error       TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_accounts_address_id ON accounts(address_id);
  CREATE INDEX IF NOT EXISTS idx_update_log_account_id ON update_log(account_id);
`);

// --------------------------------------------------------------------------
// Prepared statements
// --------------------------------------------------------------------------
const stmts = {
  insertAddress: db.prepare(`
    INSERT INTO addresses
      (name, old_street, old_city, old_state, old_zip,
       new_street, new_city, new_state, new_zip)
    VALUES
      (@name, @old_street, @old_city, @old_state, @old_zip,
       @new_street, @new_city, @new_state, @new_zip)
  `),
  listAddresses: db.prepare(`SELECT * FROM addresses ORDER BY created_at DESC`),
  getAddress: db.prepare(`SELECT * FROM addresses WHERE id = ?`),
  deleteAddress: db.prepare(`DELETE FROM addresses WHERE id = ?`),

  insertAccount: db.prepare(`
    INSERT INTO accounts
      (address_id, platform, username, email, status, notes, requires_api)
    VALUES
      (@address_id, @platform, @username, @email, @status, @notes, @requires_api)
  `),
  listAccountsByAddress: db.prepare(`
    SELECT * FROM accounts WHERE address_id = ? ORDER BY created_at ASC
  `),
  getAccount: db.prepare(`SELECT * FROM accounts WHERE id = ?`),
  updateAccount: db.prepare(`
    UPDATE accounts
       SET status      = COALESCE(@status, status),
           notes       = COALESCE(@notes, notes),
           username    = COALESCE(@username, username),
           email       = COALESCE(@email, email),
           update_date = datetime('now')
     WHERE id = @id
  `),

  insertLog: db.prepare(`
    INSERT INTO update_log (account_id, action, status, response, error)
    VALUES (@account_id, @action, @status, @response, @error)
  `),
  listLogs: db.prepare(`
    SELECT * FROM update_log WHERE account_id = ? ORDER BY created_at DESC
  `),
};

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
function summarizeAccounts(addressId) {
  const accounts = stmts.listAccountsByAddress.all(addressId);
  const total = accounts.length;
  const completed = accounts.filter((a) => a.status === 'completed').length;
  const inProgress = accounts.filter((a) => a.status === 'in-progress').length;
  return { total, completed, inProgress, accounts };
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// --------------------------------------------------------------------------
// App setup
// --------------------------------------------------------------------------
const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: DATABASE_PATH });
});

// ----- Addresses ----------------------------------------------------------
app.get(
  '/api/addresses',
  asyncHandler((_req, res) => {
    const rows = stmts.listAddresses.all();
    const enriched = rows.map((row) => {
      const { total, completed, inProgress } = summarizeAccounts(row.id);
      return {
        ...row,
        progress: { total, completed, inProgress },
      };
    });
    res.json(enriched);
  })
);

app.post(
  '/api/addresses',
  asyncHandler((req, res) => {
    const {
      name,
      newStreet,
      newCity,
      newState,
      newZip,
      oldStreet,
      oldCity,
      oldState,
      oldZip,
    } = req.body || {};

    if (!name || !newStreet || !newCity || !newState || !newZip) {
      return res.status(400).json({
        error:
          'name, newStreet, newCity, newState, and newZip are required fields.',
      });
    }

    const info = stmts.insertAddress.run({
      name,
      new_street: newStreet,
      new_city: newCity,
      new_state: newState,
      new_zip: newZip,
      old_street: oldStreet || null,
      old_city: oldCity || null,
      old_state: oldState || null,
      old_zip: oldZip || null,
    });

    const created = stmts.getAddress.get(info.lastInsertRowid);
    res.status(201).json({
      ...created,
      progress: { total: 0, completed: 0, inProgress: 0 },
    });
  })
);

app.get(
  '/api/addresses/:addressId',
  asyncHandler((req, res) => {
    const id = Number(req.params.addressId);
    const address = stmts.getAddress.get(id);
    if (!address) return res.status(404).json({ error: 'Address not found' });
    const { accounts, ...progress } = summarizeAccounts(id);
    res.json({ ...address, progress, accounts });
  })
);

app.delete(
  '/api/addresses/:addressId',
  asyncHandler((req, res) => {
    const id = Number(req.params.addressId);
    const info = stmts.deleteAddress.run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.status(204).send();
  })
);

// ----- Accounts -----------------------------------------------------------
app.post(
  '/api/addresses/:addressId/accounts',
  asyncHandler((req, res) => {
    const addressId = Number(req.params.addressId);
    if (!stmts.getAddress.get(addressId)) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const { platform, username, email, notes } = req.body || {};
    if (!platform) {
      return res.status(400).json({ error: 'platform is required' });
    }
    if (!addressService.isValidPlatform(platform)) {
      return res.status(400).json({ error: `Unknown platform: ${platform}` });
    }

    const meta = addressService.getInstructions(platform);
    const info = stmts.insertAccount.run({
      address_id: addressId,
      platform,
      username: username || null,
      email: email || null,
      status: 'pending',
      notes: notes || null,
      requires_api: meta.hasAPI ? 1 : 0,
    });

    const created = stmts.getAccount.get(info.lastInsertRowid);
    stmts.insertLog.run({
      account_id: created.id,
      action: 'account_created',
      status: 'pending',
      response: null,
      error: null,
    });
    res.status(201).json(created);
  })
);

app.patch(
  '/api/accounts/:accountId',
  asyncHandler((req, res) => {
    const id = Number(req.params.accountId);
    const existing = stmts.getAccount.get(id);
    if (!existing) return res.status(404).json({ error: 'Account not found' });

    const { status, notes, username, email } = req.body || {};
    const allowedStatuses = ['pending', 'in-progress', 'completed'];
    if (status && !allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of ${allowedStatuses.join(', ')}` });
    }

    stmts.updateAccount.run({
      id,
      status: status ?? null,
      notes: notes ?? null,
      username: username ?? null,
      email: email ?? null,
    });

    const updated = stmts.getAccount.get(id);
    if (status && status !== existing.status) {
      stmts.insertLog.run({
        account_id: id,
        action: 'status_change',
        status,
        response: JSON.stringify({ from: existing.status, to: status }),
        error: null,
      });
    }
    res.json(updated);
  })
);

app.get(
  '/api/accounts/:accountId/logs',
  asyncHandler((req, res) => {
    const id = Number(req.params.accountId);
    if (!stmts.getAccount.get(id)) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(stmts.listLogs.all(id));
  })
);

app.post(
  '/api/accounts/:accountId/logs',
  asyncHandler((req, res) => {
    const id = Number(req.params.accountId);
    if (!stmts.getAccount.get(id)) {
      return res.status(404).json({ error: 'Account not found' });
    }
    const { action, status, response, error } = req.body || {};
    if (!action) {
      return res.status(400).json({ error: 'action is required' });
    }
    const info = stmts.insertLog.run({
      account_id: id,
      action,
      status: status || null,
      response: response ? JSON.stringify(response) : null,
      error: error || null,
    });
    res.status(201).json({ id: info.lastInsertRowid });
  })
);

// ----- Platforms ----------------------------------------------------------
app.get('/api/platforms', (_req, res) => {
  res.json(addressService.getAllPlatforms());
});

app.get('/api/platforms/:platform/instructions', (req, res) => {
  const platform = addressService.getInstructions(req.params.platform);
  if (!platform) return res.status(404).json({ error: 'Platform not found' });
  res.json(platform);
});

// --------------------------------------------------------------------------
// Error handler
// --------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[address-hub]', err);
  res
    .status(err.status || 500)
    .json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[address-hub] backend listening on http://localhost:${PORT}`);
  console.log(`[address-hub] database: ${DATABASE_PATH}`);
});
