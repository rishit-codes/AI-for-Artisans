# Project Onboarding & IDE Guide

This guide ensures a seamless setup for developers and helps IDEs understand the project structure effectively.

## 🛠️ Environment Setup

The project uses separate environment files for the backend and frontend to maintain isolation.

### 1. Backend (`/backend/.env`)
Create a `.env` file in the `backend/` directory using `backend/.env.example` as a template.

**Required Variables:**
- `DATABASE_URL`: `postgresql+asyncpg://...` (Database connection string)
- `JWT_SECRET_KEY`: A strong random string for authentication.
- `ANTHROPIC_API_KEY`: API key for AI-driven insights.
- `ENVIRONMENT`: Set to `development` for local work.

### 2. Frontend (`/frontend/.env`)
Create a `.env` file in the `frontend/` directory with:
- `VITE_API_URL`: `http://localhost:8000` (Points to the backend API)

---

## 📂 Folder Structure & Repository Discipline

To keep the repository clean and collaborative, we use specific rules for various folders.

### System Folders (with `.gitkeep`)
These folders are essential for the application to function but are mostly ignored by Git to avoid repo bloat. **The `.gitkeep` files ensure these folders exist when you clone the project.**

- **`backend/lightning_logs/`**: Stores training logs for Machine Learning models.
- **`backend/checkpoints/`**: Stores model checkpoints (weights) created during training.
- **`backend/data/models/`**: Stores generated model artifacts.

### Core Backend Directories (`backend/app/`)
- **`api/`**: Endpoint routing and implementation.
- **`core/`**: Security (JWT), configuration, and global exceptions.
- **`ml/`**: Machine Learning logic, forecasting models, and AI services.
- **`models/`**: SQLAlchemy database models.
- **`schemas/`**: Pydantic data validation schemas.
- **`services/`**: Business logic, external API integrations, and background tasks.

### Data Management
- **`backend/data/benchmark/`**: **Tracked** by Git. Contains essential sample datasets needed for testing and development consistency across the team.

---

## 💻 IDE Recommendations

- **Python**: Use a virtual environment (`venv/`). Modern IDEs should auto-detect the `requirements.txt` and suggest creation.
- **Frontend**: Run `npm install` in the `frontend/` directory.
- **Extensions**: Recommend "Python" (Microsoft), "ESLint", "Prettier", and "Tailwind CSS IntelliSense" (if applicable).
