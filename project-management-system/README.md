# Project Management System

A complete, professional full-stack Project Management System.

- **Frontend:** React + Vite + Tailwind CSS + React Router + Axios + Recharts
- **Backend:** FastAPI + SQLAlchemy + SQLite
- **Auth:** JWT (`Authorization: Bearer <token>`) with Admin / User roles

Runs both **locally** and inside **GitHub Codespaces**. The frontend never hard-codes
`http://localhost:8000` — it reads the API base URL from `VITE_API_URL`.

---

## Project structure

```
project-management-system/
├── frontend/
│   ├── src/
│   │   ├── components/   # Layout, UI primitives, TaskTable, modals, TaskManager
│   │   ├── pages/        # Login, Dashboard, Tasks, MyTasks, Users, Reports, Settings
│   │   ├── services/     # api.js (Axios + JWT), index.js (auth/tasks/users/... APIs)
│   │   ├── hooks/        # useAuth.jsx (auth context)
│   │   ├── lib/          # format.js (date helpers)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── main.py           # FastAPI app + all endpoints + CORS + seed admin
│   ├── models.py         # SQLAlchemy models (explicit foreign_keys — no ambiguity)
│   ├── schemas.py        # Pydantic schemas
│   ├── database.py       # SQLite engine + session
│   ├── auth.py           # JWT + password hashing + role dependencies
│   ├── requirements.txt
│   └── .env.example
│
├── .devcontainer/        # Codespaces auto-forwards ports 8000 & 5173
├── README.md
└── .gitignore
```

---

## Default login

| Username | Password   | Role  |
| -------- | ---------- | ----- |
| `admin`  | `admin123` | Admin |

The admin user is seeded automatically on first backend startup.

---

## Running locally

### 1. Start the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API is now at `http://localhost:8000`. Interactive docs: `http://localhost:8000/docs`.

### 2. Start the frontend (in a second terminal)

```bash
cd frontend
cp .env.example .env               # VITE_API_URL defaults to http://localhost:8000
npm install
npm run dev -- --host 0.0.0.0
```

The app is now at `http://localhost:5173`.

---

## Running in GitHub Codespaces

### 1. Open a Codespace

On the GitHub repo, click **Code → Codespaces → Create codespace on main**.
The included `.devcontainer` installs Python 3.12 + Node 20 and runs
`pip install` / `npm install` for you.

### 2. Start the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Start the frontend (second terminal)

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

### 4. Forward port 8000 (backend)

Open the **Ports** tab in the Codespaces bottom panel. Port `8000` should appear
automatically (the devcontainer forwards it). If not, click **Add Port** and enter `8000`.

### 5. Forward port 5173 (frontend)

Port `5173` should also appear automatically. If not, add it manually the same way.

### 6. Get the Codespaces backend URL

In the **Ports** tab, find the `8000` row, hover over **Forwarded Address**, and copy the URL.
It looks like:

```
https://YOUR-CODESPACE-NAME-8000.app.github.dev
```

> **Make port 8000 Public.** Right-click the `8000` port → **Port Visibility → Public**.
> Otherwise the browser-based frontend cannot reach the API and you'll get
> "Unable to connect to the Project Management API."

### 7. Configure `frontend/.env`

Create `frontend/.env` (copy from `.env.example`) and set `VITE_API_URL` to the URL from step 6:

```bash
VITE_API_URL=https://YOUR-CODESPACE-NAME-8000.app.github.dev
```

### 8. The frontend must NOT call `localhost:8000` in Codespaces

When you open the app through the Codespaces browser preview, your browser is **not**
on the same machine as the server. `localhost:8000` would resolve to *your* laptop, not
the Codespace. That is exactly why the app reads `VITE_API_URL` instead of hard-coding
localhost — always point it at the forwarded `...app.github.dev` URL.

### 9. Restart Vite after changing `.env`

Vite only reads env vars at startup. After editing `frontend/.env`, stop the dev server
(`Ctrl+C`) and run `npm run dev -- --host 0.0.0.0` again.

### 10. Test FastAPI with `/docs`

Open the forwarded `8000` URL and append `/docs`:

```
https://YOUR-CODESPACE-NAME-8000.app.github.dev/docs
```

You get Swagger UI where you can call every endpoint. Use **Authorize** with a token from
`POST /api/auth/login` to test protected routes.

---

## Environment variables

**Frontend (`frontend/.env`)**

```bash
# Local
VITE_API_URL=http://localhost:8000

# Codespaces (replace with your forwarded 8000 URL)
# VITE_API_URL=https://YOUR-CODESPACE-NAME-8000.app.github.dev
```

**Backend (`backend/.env`)**

```bash
SECRET_KEY=change-this-secret-key
DATABASE_URL=sqlite:///./project_management.db
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

---

## API reference

**Auth**
- `POST /api/auth/login` — `{ username, password }` → `{ access_token, token_type, user }`
- `POST /api/auth/register` — create a user (admin only, except first admin seed)

**Users** (admin only)
- `GET /api/users`
- `GET /api/users/{user_id}`
- `PUT /api/users/{user_id}`
- `DELETE /api/users/{user_id}`

**Tasks**
- `GET /api/tasks` — supports `?search=&status=&priority=&assigned_to_id=&due_before=&mine=true`
- `GET /api/tasks/{task_id}`
- `POST /api/tasks`
- `PUT /api/tasks/{task_id}`
- `DELETE /api/tasks/{task_id}`

**Comments**
- `GET /api/tasks/{task_id}/comments`
- `POST /api/tasks/{task_id}/comments`
- `DELETE /api/comments/{comment_id}`

**Dashboard**
- `GET /api/dashboard` — stats + recent/my/due-soon task lists

---

## CORS

For development the backend uses `allow_origins=["*"]` so any Codespaces forwarded URL
works out of the box. **For production**, replace this in `backend/main.py` with the actual
frontend origin, e.g.:

```python
allow_origins=["https://your-frontend-domain.com"]
```

---

## Notes

- SQLite database (`project_management.db`) is created automatically on first run.
- The `tasks` table has **two** foreign keys to `users` (`created_by_id`, `assigned_to_id`).
  SQLAlchemy relationships explicitly set `foreign_keys=` so there is **no
  `AmbiguousForeignKeysError`**.
- Passwords are hashed with bcrypt (via passlib). JWTs are signed with `SECRET_KEY`.
