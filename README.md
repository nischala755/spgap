# SPGAP — Smart Project & Guide Allocation Platform

A full-stack web application for automating student team formation, project allocation, and guide allocation in college departments.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React (Vite), Tailwind CSS, Framer Motion, Chart.js |
| **Backend** | FastAPI, SQLAlchemy ORM, Pydantic |
| **Database** | SQLite3 |
| **Auth** | JWT + bcrypt |

## 📁 Project Structure

```
spgap/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── models/   # SQLAlchemy models (13 tables)
│   │   ├── schemas/  # Pydantic validation schemas
│   │   ├── routers/  # API route handlers
│   │   ├── services/ # Business logic (allocation engine, CSV, etc.)
│   │   ├── middleware/# JWT auth & role-based access
│   │   └── utils/    # Security & audit helpers
│   ├── seed.py       # Database seeder
│   └── requirements.txt
├── frontend/         # React Vite application
│   └── src/
│       ├── pages/    # Teacher & Student dashboards
│       ├── components/# Reusable UI components
│       ├── context/  # Auth context
│       └── api/      # Axios instance
└── README.md
```

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload
```

Backend runs at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

### Portal URLs (separate teacher & student instances)

| Portal | URL |
|--------|-----|
| Portal selection | http://localhost:5173/login |
| Teacher login | http://localhost:5173/login/teacher |
| Student login | http://localhost:5173/login/student |
| Teacher dashboard | http://localhost:5173/teacher |
| Student dashboard | http://localhost:5173/student |

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Teacher/Admin | admin@spgap.com | admin123 |
| Students | (their email from CSV) | (USN in lowercase) |

## ✨ Features

### Teacher Dashboard
- 📊 Real-time statistics and charts
- 👨‍🎓 Student management with search/filter/pagination
- 👥 Team management with member visibility
- 📁 Project CRUD with skill tagging
- 🧑‍🏫 Guide management with workload tracking
- 🎯 **Smart Allocation Engine** with domain, skills, preferences, and natural-language matching
- 📤 CSV upload (140+ students), Contact column, specializations import, and CSV data reset
- 📈 Reports with Chart.js visualizations and CSV export
- 🔒 Allocation freeze/reset

### Student Portal
- 👤 Profile with clear domain/preference guidance, natural-language interests, and custom domain entry
- 👥 Team creation/joining via team codes
- 🎯 Allocation view with project and guide details
- 🌙 Dark mode support

### Allocation Engine

The smart allocation algorithm scores each team-project pair:

```
score = (domain_match × 50) + (common_specializations × 30) + (preference_match up to 20) + (natural_language_match up to 15)
```

Guide allocation prioritizes: Domain match → Lowest workload → Random tie-breaking.

### Security
- JWT Bearer token authentication
- bcrypt password hashing
- Role-based access control (student/teacher)
- Audit logging of all actions

## 📋 API Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | Public | Login |
| POST | /api/auth/register | Public | Register teacher |
| GET | /api/students/me | Student | Own profile |
| PUT | /api/students/me | Student | Update profile |
| GET | /api/students/me/team | Student | Own team |
| GET | /api/students/me/allocation | Student | Own allocation |
| POST | /api/teams | Student | Create team |
| POST | /api/teams/join | Student | Join team |
| POST | /api/teams/leave | Student | Leave team |
| GET | /api/teachers/dashboard | Teacher | Dashboard stats |
| GET | /api/teachers/students | Teacher | List students |
| GET | /api/teams | Teacher | List teams |
| CRUD | /api/projects | Teacher | Manage projects |
| CRUD | /api/guides | Teacher | Manage guides |
| POST | /api/allocations/run | Teacher | Run allocation |
| POST | /api/allocations/freeze | Teacher | Freeze allocations |
| POST | /api/allocations/reset | Teacher | Reset allocations |
| POST | /api/csv/upload | Teacher | Upload CSV |
| GET | /api/reports/* | Teacher | Analytics data |

## 📝 CSV Format

```csv
USN,Name,Email,Department,Semester,Section,Domain,Specialization,Contact
1RV21CS001,John Doe,john@college.edu,CSE,5,A,AI/ML,Machine Learning,9876543210
```

`Contact` (or `Contact No`) is optional. Specializations are saved and used by smart allocation.

## 🎨 Design

- Modern glassmorphism UI with gradient accents
- Dark mode with system preference detection
- Responsive layout (desktop, tablet, mobile)
- Framer Motion animations throughout
- Chart.js visualizations (Bar, Doughnut)

## 📦 Deployment

See **[DEPLOY.md](DEPLOY.md)** for full instructions. Quick summary:

- **Render**: Use the included `render.yaml` blueprint
- **Local build**: `cd frontend && npm run build`
- **Production tip**: For 140+ concurrent students, upgrade SQLite to PostgreSQL
