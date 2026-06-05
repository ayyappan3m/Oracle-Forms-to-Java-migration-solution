# Address Hub

A local-first automation hub for tracking and managing address updates across all of your online accounts. Moved recently? Address Hub keeps a checklist of every site where your address is on file, walks you through the update for each one, and tracks your progress until everything is in sync.

## Features

- **Local-first SQLite database** — your address data never leaves your machine
- **10 supported platforms** with detailed, step-by-step update instructions
- **Progress tracking** with per-address completion bars
- **Status workflow** — pending → in-progress → completed
- **Per-account notes** for capturing confirmation numbers or quirks
- **Multiple addresses** — track moves for family members or properties separately
- **REST API** — backend can be driven independently of the React UI
- **Hot-reload React UI** built with Vite

## Supported Platforms

| Platform          | Category           | API Available |
|-------------------|--------------------|---------------|
| Amazon            | Retail             | No            |
| Walmart           | Retail             | No            |
| Costco            | Retail / Membership| No            |
| Sam's Club        | Retail / Membership| No            |
| USPS              | Postal             | Yes           |
| PNC Bank          | Banking            | Yes           |
| Chase Bank        | Banking            | Yes           |
| Discover Card     | Credit Card        | No            |
| Apple Card        | Credit Card        | No            |
| Rakuten Rewards   | Rewards            | No            |

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# from the repo root
cd address-hub

# install workspace + backend + frontend dependencies
npm run install:all

# start backend (3001) and frontend (3000) together
npm run dev
```

Then open <http://localhost:3000>.

### Individual Services

```bash
npm run dev:backend    # http://localhost:3001
npm run dev:frontend   # http://localhost:3000
```

### Production Build

```bash
npm run build          # builds the frontend
npm start              # starts the backend (serve frontend separately)
```

## Project Structure

```
address-hub/
├── backend/
│   ├── src/
│   │   ├── index.js                  # Express server + routes
│   │   └── services/
│   │       └── addressService.js     # Platform catalog + instructions
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddressForm.jsx
│   │   │   ├── AddressCard.jsx
│   │   │   ├── PlatformChecklist.jsx
│   │   │   └── PlatformItem.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── data/                             # SQLite file lives here (gitignored)
│   └── addresses.db
├── package.json                      # workspace root
└── README.md
```

## Database Schema

SQLite is initialized automatically at first run. Tables:

### `addresses`
| Column      | Type    | Notes                          |
|-------------|---------|--------------------------------|
| id          | INTEGER | PK, autoincrement              |
| name        | TEXT    | Friendly label e.g. "Home 2026"|
| old_street  | TEXT    | Optional                       |
| old_city    | TEXT    | Optional                       |
| old_state   | TEXT    | Optional                       |
| old_zip     | TEXT    | Optional                       |
| new_street  | TEXT    | Required                       |
| new_city    | TEXT    | Required                       |
| new_state   | TEXT    | Required                       |
| new_zip     | TEXT    | Required                       |
| created_at  | TEXT    | ISO timestamp                  |
| updated_at  | TEXT    | ISO timestamp                  |

### `accounts`
| Column        | Type    | Notes                                            |
|---------------|---------|--------------------------------------------------|
| id            | INTEGER | PK                                               |
| address_id    | INTEGER | FK → addresses.id                                |
| platform      | TEXT    | Platform key (e.g. `amazon`)                     |
| username      | TEXT    | Optional                                         |
| email         | TEXT    | Optional                                         |
| status        | TEXT    | `pending` \| `in-progress` \| `completed`        |
| update_date   | TEXT    | ISO timestamp of last status change              |
| notes         | TEXT    | Free-form per-account notes                      |
| requires_api  | INTEGER | 0/1 — whether the platform exposes an API        |
| created_at    | TEXT    | ISO timestamp                                    |

### `api_integrations`
| Column         | Type    | Notes                                  |
|----------------|---------|----------------------------------------|
| id             | INTEGER | PK                                     |
| platform       | TEXT    | Unique                                 |
| api_key        | TEXT    | Encrypted at rest in future versions   |
| api_secret     | TEXT    |                                        |
| is_configured  | INTEGER | 0/1                                    |
| auth_type      | TEXT    | e.g. `oauth2`, `api_key`               |
| created_at     | TEXT    | ISO timestamp                          |

### `update_log`
| Column      | Type    | Notes                          |
|-------------|---------|--------------------------------|
| id          | INTEGER | PK                             |
| account_id  | INTEGER | FK → accounts.id               |
| action      | TEXT    | e.g. `status_change`           |
| status      | TEXT    | Result status                  |
| response    | TEXT    | API or UI response payload     |
| error       | TEXT    | Error message if any           |
| created_at  | TEXT    | ISO timestamp                  |

## API Endpoints

Base URL: `http://localhost:3001/api`

| Method  | Path                                         | Description                                  |
|---------|----------------------------------------------|----------------------------------------------|
| GET     | `/addresses`                                 | List all addresses with account summaries    |
| POST    | `/addresses`                                 | Create a new address                         |
| DELETE  | `/addresses/:addressId`                      | Delete an address and cascade its accounts   |
| POST    | `/addresses/:addressId/accounts`             | Add a platform account to an address         |
| PATCH   | `/accounts/:accountId`                       | Update status / notes for an account         |
| GET     | `/accounts/:accountId/logs`                  | View activity log for an account             |
| POST    | `/accounts/:accountId/logs`                  | Append an entry to the activity log          |
| GET     | `/platforms`                                 | List supported platforms with metadata       |
| GET     | `/platforms/:platform/instructions`          | Step-by-step instructions for a platform     |

## Troubleshooting

**The frontend can't reach the backend.**
Make sure both services are running. The Vite dev server proxies `/api` to `http://localhost:3001`; if you changed the backend port, update `frontend/vite.config.js` too.

**`better-sqlite3` fails to install.**
It compiles native bindings. On macOS make sure Xcode CLT is installed (`xcode-select --install`). On Linux install `build-essential` and `python3`.

**The database file is locked.**
SQLite uses a single writer. Stop other instances of the backend and try again. You can safely delete `data/addresses.db` to start fresh — note that this wipes all stored addresses.

**Port already in use.**
Backend uses 3001, frontend uses 3000. Either free the port or change it: `PORT=3002 npm run dev:backend`, and update the Vite proxy target.

**Reset everything.**
```bash
rm -rf data/ node_modules backend/node_modules frontend/node_modules
npm run install:all
```
