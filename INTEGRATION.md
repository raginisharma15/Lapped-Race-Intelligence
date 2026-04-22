# LAPPED - Full Stack Integration Guide

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LAPPED Full Stack                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Landing Page   │         │   React Dashboard │          │
│  │   (3D Three.js)  │────────▶│   (TypeScript)    │          │
│  │   Port: 5173     │         │   Port: 5173      │          │
│  └──────────────────┘         └─────────┬─────────┘          │
│                                          │                    │
│                                          │ HTTP/REST          │
│                                          │                    │
│                                ┌─────────▼─────────┐          │
│                                │  FastAPI Backend  │          │
│                                │  Port: 8000       │          │
│                                └─────────┬─────────┘          │
│                                          │                    │
│                                          │                    │
│                          ┌───────────────┼───────────────┐    │
│                          │               │               │    │
│                    ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼────┐│
│                    │  OpenF1   │  │   Groq    │  │ FastF1   ││
│                    │    API    │  │    LLM    │  │  Cache   ││
│                    └───────────┘  └───────────┘  └──────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📂 Project Structure

```
LAPPED/
├── app/                          # Backend (FastAPI)
│   ├── ai/                       # AI summarization
│   ├── routes/                   # API endpoints
│   ├── services/                 # Business logic
│   └── main.py                   # FastAPI app entry
│
├── frontend/                     # Frontend (React)
│   ├── landing/                  # Original 3D landing (separate Vite project)
│   │   ├── src/
│   │   │   ├── main.js          # Three.js 3D scene
│   │   │   └── style.css        # Landing styles
│   │   ├── public/models/       # 3D models
│   │   └── index.html
│   │
│   ├── src/                      # React dashboard
│   │   ├── api/                  # API clients
│   │   │   ├── client.ts        # Axios instance
│   │   │   ├── telemetry.ts     # Telemetry endpoints
│   │   │   ├── history.ts       # History endpoints
│   │   │   └── alerts.ts        # Alerts endpoints
│   │   │
│   │   ├── components/
│   │   │   ├── layout/          # Layout components
│   │   │   │   ├── Layout.tsx   # Main layout with sidebar
│   │   │   │   ├── Sidebar.tsx  # Navigation sidebar
│   │   │   │   └── TopBar.tsx   # Top navigation bar
│   │   │   └── ui/              # Reusable UI components
│   │   │       └── Card.tsx
│   │   │
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useLiveData.ts   # Live telemetry polling
│   │   │   ├── useRaceReport.ts # Race report fetching
│   │   │   └── useAlerts.ts     # Alerts polling
│   │   │
│   │   ├── pages/               # Page components
│   │   │   ├── Landing.tsx      # Landing page (iframe wrapper)
│   │   │   ├── Dashboard.tsx    # Main dashboard
│   │   │   ├── RaceReport.tsx   # AI race report
│   │   │   ├── DriverComparison.tsx
│   │   │   └── RaceHistory.tsx
│   │   │
│   │   ├── types/               # TypeScript types
│   │   │   └── index.ts         # API response types
│   │   │
│   │   ├── styles/              # Global styles
│   │   │   ├── variables.css    # CSS variables
│   │   │   └── global.css       # Global styles
│   │   │
│   │   ├── App.tsx              # React Router setup
│   │   └── main.tsx             # React entry point
│   │
│   ├── public/
│   │   └── landing.html         # Standalone 3D landing (for iframe)
│   │
│   └── package.json
│
├── config.py                     # Backend configuration
├── requirements.txt              # Python dependencies
├── start.sh                      # Full stack startup script
├── QUICKSTART.md                 # Quick start guide
└── INTEGRATION.md                # This file
```

## 🔗 Integration Points

### 1. Landing Page → Dashboard Navigation

**Implementation**: The landing page is embedded in an iframe and communicates with the React app via `postMessage`.

**Files**:
- `frontend/public/landing.html` - Standalone 3D landing page
- `frontend/src/pages/Landing.tsx` - React wrapper with iframe
- `frontend/src/App.tsx` - Route configuration

**Flow**:
```
User visits http://localhost:5173
    ↓
Landing.tsx renders iframe with /landing.html
    ↓
User clicks "Enter Dashboard" button
    ↓
landing.html sends postMessage('navigate-to-dashboard')
    ↓
Landing.tsx receives message and navigates to /dashboard
```

**Code Example** (landing.html):
```javascript
window.navigateToDashboard = function() {
  if (window.parent !== window) {
    // Inside iframe - send message to parent
    window.parent.postMessage('navigate-to-dashboard', '*');
  } else {
    // Standalone - navigate directly
    window.location.href = '/dashboard';
  }
};
```

**Code Example** (Landing.tsx):
```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data === 'navigate-to-dashboard') {
      navigate('/dashboard');
    }
  };
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [navigate]);
```

### 2. Frontend → Backend API Connection

**Implementation**: Axios client with base URL configuration and interceptors.

**Files**:
- `frontend/src/api/client.ts` - Axios instance
- `frontend/.env.local` - API base URL configuration
- `app/main.py` - CORS middleware setup

**Configuration**:
```typescript
// frontend/src/api/client.ts
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});
```

**CORS Setup** (backend):
```python
# app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Real-Time Data Updates

**Implementation**: Polling-based updates using custom React hooks.

**Polling Intervals**:
- Telemetry: 5 seconds (`useLiveData`)
- Alerts: 10 seconds (`useAlerts`)
- Race Reports: On-demand (`useRaceReport`)

**Example** (useLiveData.ts):
```typescript
useEffect(() => {
  const fetchData = async () => {
    const data = await getTelemetryLaps(sessionKey);
    setLaps(data);
  };
  
  fetchData();
  const interval = setInterval(fetchData, 5000); // Poll every 5s
  
  return () => clearInterval(interval);
}, [sessionKey]);
```

## 🎨 Design System Integration

### Color Palette
```css
/* Bloomberg Terminal-inspired */
--color-bg-primary: #08090A;
--color-bg-secondary: #0F1011;
--color-primary-red: #E10600;    /* Alerts, CTAs */
--color-primary-blue: #0066FF;   /* Data, Charts */
--color-accent-green: #b4ff2c;   /* Landing page accent */
--color-text-primary: #FFFFFF;
--color-text-secondary: #8A8D91;
```

### Typography
```css
--font-body: 'Inter', sans-serif;
--font-heading: 'Rajdhani', sans-serif;
```

### Transitions
```css
/* All UI transitions */
transition: all 150ms ease;
```

## 🚀 Deployment Considerations

### Environment Variables

**Backend** (`.env`):
```bash
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
OPENF1_BASE_URL=https://api.openf1.org/v1
FASTF1_CACHE_DIR=./cache/fastf1
REPORTS_CACHE_DIR=./cache/reports
DEFAULT_SESSION_KEY=latest
```

**Frontend** (`.env.local`):
```bash
VITE_API_BASE_URL=http://localhost:8000
```

**Production** (`.env.production`):
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Build Commands

**Backend**:
```bash
# No build needed - Python runs directly
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Frontend**:
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

### Serving in Production

**Option 1: Separate Servers**
- Backend: Deploy FastAPI on port 8000 (e.g., Railway, Render, AWS)
- Frontend: Deploy static build to CDN (e.g., Vercel, Netlify, Cloudflare Pages)

**Option 2: Single Server**
- Serve frontend static files from FastAPI:
```python
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
```

## 🔧 Development Workflow

### Starting Development

**Option 1: Unified Script** (Recommended)
```bash
./start.sh
```

**Option 2: Separate Terminals**

Terminal 1 (Backend):
```bash
uvicorn app.main:app --reload
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### Hot Reload

- **Backend**: FastAPI auto-reloads on file changes (with `--reload` flag)
- **Frontend**: Vite HMR (Hot Module Replacement) updates instantly
- **Landing Page**: Refresh browser to see changes

### Testing API Endpoints

1. **Interactive Docs**: http://localhost:8000/docs
2. **Curl**:
```bash
curl http://localhost:8000/api/v1/telemetry/latest/laps
```
3. **Frontend**: Use browser DevTools Network tab

## 🐛 Troubleshooting

### CORS Errors
**Symptom**: "Access-Control-Allow-Origin" error in browser console

**Solution**:
1. Verify backend is running on port 8000
2. Check `VITE_API_BASE_URL` in `frontend/.env.local`
3. Ensure CORS middleware is enabled in `app/main.py`

### Landing Page Not Loading
**Symptom**: Blank page or 404 error

**Solution**:
1. Check `frontend/public/landing.html` exists
2. Verify 3D models are in `frontend/landing/public/models/`
3. Check browser console for Three.js errors

### API Connection Failed
**Symptom**: "Network Error" or timeout in frontend

**Solution**:
1. Verify backend is running: `curl http://localhost:8000`
2. Check firewall settings
3. Verify `VITE_API_BASE_URL` matches backend URL

### Port Already in Use
**Symptom**: "Address already in use" error

**Solution**:
```bash
# Kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

## 📊 API Endpoints Reference

### Telemetry
- `GET /api/v1/telemetry/{session_key}/laps` - All laps
- `GET /api/v1/telemetry/{session_key}/driver/{driver_number}` - Driver data

### History
- `GET /api/v1/history/{year}/races` - Races by year
- `GET /api/v1/history/{session_key}/report` - Race report

### Analysis
- `GET /api/v1/analysis/{session_key}/anomalies` - Anomaly detection
- `GET /api/v1/analysis/{session_key}/tire-degradation` - Tire analysis
- `GET /api/v1/analysis/{session_key}/sectors` - Sector analysis

### Alerts
- `GET /api/v1/alerts/{session_key}` - Real-time alerts

### Summary
- `GET /api/v1/summary/{session_key}` - AI summary
- `POST /api/v1/summary/{session_key}/refresh` - Regenerate summary

## 🎯 Next Steps

1. **Add Authentication**: Implement JWT tokens for API security
2. **WebSocket Support**: Replace polling with real-time WebSocket connections
3. **Caching**: Add Redis for API response caching
4. **Testing**: Add unit tests (pytest for backend, Vitest for frontend)
5. **CI/CD**: Set up GitHub Actions for automated deployment
6. **Monitoring**: Add Sentry for error tracking
7. **Analytics**: Integrate Plausible or Google Analytics

## 📚 Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **React Docs**: https://react.dev
- **Three.js Docs**: https://threejs.org/docs
- **Vite Docs**: https://vitejs.dev
- **OpenF1 API**: https://openf1.org

---

**Built with ❤️ for F1 enthusiasts**
