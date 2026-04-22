# LAPPED - Quick Start Guide

## 🏎️ Full Stack Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Quick Start (Recommended)

```bash
# One command to start everything!
./start.sh
```

This will:
1. Start the FastAPI backend on port 8000
2. Start the React frontend on port 5173
3. Open both servers with auto-reload enabled

### Manual Setup

#### 1. Backend Setup (FastAPI)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Run backend
uvicorn app.main:app --reload
```

Backend runs on: **http://localhost:8000**

#### 2. Frontend Setup (React)

```bash
# Navigate to frontend
cd frontend

# Run automated setup
./install.sh

# Or manual setup:
npm install
npm run dev
```

Frontend runs on: **http://localhost:5173**

### 3. Access the Application

Open your browser to:
- **Landing Page**: http://localhost:5173 (3D experience)
- **Dashboard**: http://localhost:5173/dashboard
- **Backend API Docs**: http://localhost:8000/docs

## 📁 Project Structure

```
LAPPED/
├── app/                    # FastAPI backend
│   ├── ai/                 # AI summarization
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   └── main.py             # FastAPI app
├── frontend/               # React frontend
│   ├── src/
│   │   ├── api/            # API clients
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript types
│   └── package.json
├── config.py               # Backend config
├── requirements.txt        # Python dependencies
└── README.md
```

## 🎯 Key Features

### Backend (FastAPI)
- ✅ Live F1 telemetry from OpenF1 API
- ✅ AI race summaries via Groq LLM
- ✅ Historical race reports
- ✅ Anomaly detection
- ✅ Tire degradation analysis
- ✅ Real-time alerts

### Frontend (React + TypeScript)
- ✅ Live telemetry dashboard
- ✅ AI-generated race reports
- ✅ Driver comparison
- ✅ Race history browser
- ✅ Real-time updates (5s polling)
- ✅ Professional Bloomberg Terminal design

## 🔌 API Endpoints

### Telemetry
- `GET /api/v1/telemetry/{session_key}/laps`
- `GET /api/v1/telemetry/{session_key}/driver/{driver_number}`

### History
- `GET /api/v1/history/{year}/races`
- `GET /api/v1/history/{session_key}/report`

### Analysis
- `GET /api/v1/analysis/{session_key}/anomalies`
- `GET /api/v1/analysis/{session_key}/tire-degradation`
- `GET /api/v1/analysis/{session_key}/sectors`

### Alerts
- `GET /api/v1/alerts/{session_key}`

### Summary
- `GET /api/v1/summary/{session_key}`
- `POST /api/v1/summary/{session_key}/refresh`

## 🎨 Frontend Pages

1. **Dashboard** (`/dashboard`)
   - Live telemetry updates
   - Driver standings
   - Lap time charts
   - Alerts panel

2. **Race Report** (`/report/:sessionKey`)
   - AI-generated narrative
   - Key moments
   - Driver reports
   - Technical insights

3. **Driver Comparison** (`/compare`)
   - Side-by-side analysis
   - Performance metrics

4. **Race History** (`/history`)
   - Browse past races
   - Generate reports

## 🛠️ Development

### Backend
```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Run tests (if available)
pytest
```

### Frontend
```bash
cd frontend

# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Environment Variables

### Backend (`.env`)
```
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
OPENF1_BASE_URL=https://api.openf1.org/v1
FASTF1_CACHE_DIR=./cache/fastf1
REPORTS_CACHE_DIR=./cache/reports
DEFAULT_SESSION_KEY=latest
```

### Frontend (`.env.local`)
```
VITE_API_BASE_URL=http://localhost:8000
```

## 🚨 Troubleshooting

### Backend Issues
- **Port 8000 in use**: `lsof -ti:8000 | xargs kill -9`
- **Missing dependencies**: `pip install -r requirements.txt`
- **GROQ API errors**: Check your API key in `.env`

### Frontend Issues
- **Port 5173 in use**: `lsof -ti:5173 | xargs kill -9`
- **Module not found**: `cd frontend && npm install`
- **API connection failed**: Ensure backend is running on port 8000

### CORS Issues
Backend has CORS enabled for all origins. If you still see CORS errors:
1. Check backend is running
2. Verify `VITE_API_BASE_URL` in frontend `.env.local`
3. Clear browser cache

## 📚 Documentation

- **Backend**: See `app/` directory and `/docs` endpoint
- **Frontend**: See `frontend/README.md` and `frontend/SETUP.md`
- **API**: Visit http://localhost:8000/docs for interactive API docs

## 🎉 You're Ready!

1. Start backend: `uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser: http://localhost:5173
4. Enjoy your F1 AI race intelligence platform! 🏁

---

For detailed documentation:
- Backend: See main `README.md`
- Frontend: See `frontend/README.md`
- Full summary: See `FRONTEND_SUMMARY.md`
