# 🎨 AI-for-Artisans (ArtisanGPS)

An AI-powered market intelligence platform designed to empower traditional and rural Indian artisans with actionable insights, trend predictions, and production planning tools.

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 19 · Vite · Framer Motion · React Router  |
| Backend  | FastAPI · SQLAlchemy (async) · Pydantic          |
| Database | PostgreSQL 16                                    |
| ML       | Time-series forecasting · NLP · Computer Vision  |
| DevOps   | Docker · Docker Compose                          |

---

## 🚀 Quick Start (Docker — Recommended)

> **Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```bash
# Clone the repository
git clone https://github.com/Unnati-88/AI-for-Artisans.git
cd AI-for-Artisans

# Start PostgreSQL + Backend in containers
docker compose up --build -d

# Check everything is running
docker compose ps
```

- **API:** [http://localhost:8000](http://localhost:8000)
- **Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### Docker Commands Cheat Sheet

```bash
docker compose up -d            # Start containers (detached)
docker compose up --build -d    # Rebuild & start (after requirements.txt changes)
docker compose down             # Stop containers
docker compose logs backend     # View backend logs
docker compose logs -f backend  # Follow backend logs (live)
docker compose restart backend  # Restart backend only
```

---

## 🖥️ Manual Setup (Without Docker)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\Activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run the server (hot-reload enabled)
uvicorn app.main:app --reload
```

> **Note:** You need a running PostgreSQL instance with a database named `artisangps`. Update `DATABASE_URL` in `.env` accordingly.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

- **App:** [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Environment Variables

Copy the example and update values as needed:

```bash
cp backend/.env.example backend/.env
```

| Variable                     | Description                    | Default                                                     |
| ---------------------------- | ------------------------------ | ----------------------------------------------------------- |
| `DATABASE_URL`               | PostgreSQL connection string   | `postgresql+asyncpg://postgres:postgres@localhost:5432/artisangps` |
| `SECRET_KEY`                 | JWT signing key                | `changeme-super-secret-key`                                 |
| `ALGORITHM`                  | JWT algorithm                  | `HS256`                                                     |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Token expiry duration          | `60`                                                        |

> ⚠️ **Important:** Change `SECRET_KEY` to a strong random value before deploying to production.

---

## 📄 License

This project is built for educational and social impact purposes.
