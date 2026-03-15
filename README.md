# 🎨 ArtisanGPS — AI for Artisans

AI-powered market intelligence platform for Indian artisans.

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Frontend | React 19 · Vite · Framer Motion · React Router |
| Backend  | FastAPI · SQLAlchemy (async) · Pydantic · JWT  |
| Database | PostgreSQL 16                                  |
| DevOps   | Docker · Docker Compose                        |


## 🚀 Start the Application

## 🐳 Full Docker Stack (DB + Backend)

Run **all commands from the root `AI-for-Artisans/` folder**.

```powershell
docker compose up --build -d       # build & start both services
docker compose ps                  # check status
docker compose logs -f backend     # follow backend logs
docker compose restart backend     # restart backend
docker compose down                # stop everything
docker compose exec db psql -U postgres -d artisangps  # open DB shell
```

> The frontend is **not containerised** — always start it with `npm run dev`.
### Start the backend (from `backend/` folder)

```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

→ API: http://localhost:8000  
→ Swagger: http://localhost:8000/docs

###  Start the frontend (new terminal, from `frontend/` folder)

```powershell
cd frontend
npm install        # first time only
npm run dev -- --port 5173
```

→ App: http://localhost:5173


## ⚙️ Environment Variables

| Variable            | Description                      |
| ------------------- | -------------------------------- |
| `DATABASE_URL`      | PostgreSQL asyncpg connection    |
| `JWT_SECRET_KEY`    | JWT signing secret (32+ chars)   |
| `JWT_EXPIRE_DAYS`   | Token lifetime in days           |
| `ANTHROPIC_API_KEY` | Claude key for Advisor feature   |
| `FRONTEND_URL`      | Added to CORS allowlist          |
| `VITE_API_URL`      | Backend URL consumed by frontend |

---

## 📄 License

Built for educational and social impact purposes.
