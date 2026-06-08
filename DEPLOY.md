# SPGAP Deployment Guide

## Local Development URLs

| Service | URL |
|---------|-----|
| Portal selection | http://localhost:5173/login |
| Teacher portal login | http://localhost:5173/login/teacher |
| Student portal login | http://localhost:5173/login/student |
| Teacher dashboard | http://localhost:5173/teacher |
| Student dashboard | http://localhost:5173/student |
| Backend API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |

### Start locally

```bash
# Terminal 1 — Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

## Deploy to Render

1. Push this repo to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New → Blueprint**.
3. Connect your repo — Render reads `render.yaml` automatically.
4. Set environment variables:
   - **spgap-api** → `FRONTEND_URL` = your frontend URL (e.g. `https://spgap-frontend.onrender.com`)
   - **spgap-frontend** → `VITE_API_URL` = your backend URL (e.g. `https://spgap-api.onrender.com`)
5. After deploy, run the seed script once via Render shell:
   ```bash
   cd backend && python seed.py
   ```

## Deploy to Railway / VPS

```bash
# Build frontend
cd frontend && npm run build

# Serve backend (also serves API)
cd backend
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Serve `frontend/dist` with any static host (Nginx, Vercel, Netlify) and point `VITE_API_URL` to the backend.

## Production Notes

- Change `SECRET_KEY` in backend `.env`
- For 140+ students in production, consider PostgreSQL instead of SQLite
- Teacher demo login: `admin@spgap.com` / `admin123`
- Student default password: USN in lowercase
