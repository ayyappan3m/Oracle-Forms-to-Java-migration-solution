# Oracle Forms to Java Migration Tool

This repository contains a Spring Boot backend and a Vite + React frontend used for migrating Oracle Forms to a modern stack.

## Project structure

- `backend/` — Spring Boot application (Java 17, Maven)
- `frontend/` — React app built with Vite

## Quick start (run locally)

Prerequisites:
- Java 17
- Maven
- Node.js (16+) and npm or yarn

1) Start the backend

```bash
cd backend
mvn clean package -DskipTests
java -jar target/oracle-migration-backend-1.0.0-SNAPSHOT.jar
```

The backend listens on port `8080`.

2) Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on Vite's default port (usually `5173`). The frontend expects the backend at `http://localhost:8080`.

## Testing

- Backend: use `curl` or Postman to call endpoints (see `backend/src/main/java/com/migration/controller`).
- Frontend: open the dev server URL shown by Vite in your browser and use the Converter page.

## Pushing this repository to GitHub

1. Initialize git and commit:

```bash
git init
git add .
git commit -m "Initial commit: migration tool (backend + frontend)"
```

2. Create a new GitHub repo (either via the web UI or using `gh`):

```bash
# using GitHub CLI
gh repo create my-org/oracle-migration-tool --public --source=. --remote=origin --push

# OR create repo on github.com and then add remote (HTTPS example)
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

Replace `<your-username>/<repo-name>` with your GitHub account and chosen repo name.

## .gitignore suggestions
Add a `.gitignore` to exclude build artifacts and node modules. Example entries:

```
# Java / Maven
/backend/target/
*.class
*.jar

# Node
/frontend/node_modules/

# IDEs
.idea/
.vscode/
.DS_Store
```

---
If you want, I can create the `.gitignore` and commit & push the repo for you — tell me whether you want the `gh` CLI used or prefer to add the remote yourself.

## Environment variables

This project requires an Anthropic API key for features that call Claude. Do NOT store API keys in the repository. Set the environment variable before running the backend:

On macOS / Linux:

```bash
export ANTHROPIC_API_KEY="sk-..."
cd backend
mvn clean package -DskipTests
java -jar target/oracle-migration-backend-1.0.0-SNAPSHOT.jar
```

On macOS using a `.env` file with a process manager or IDE, add the variable there and ensure it's loaded into the process environment.

