# LAPPED Frontend — AI Race Intelligence Dashboard

Production-grade React + TypeScript dashboard for F1 race telemetry analysis.

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: **http://localhost:5173**  
Backend expected at: **http://localhost:8000**

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/              # API clients
│   │   ├── client.ts     # Axios instance
│   │   ├── telemetry.ts  # Telemetry endpoints
│   │   ├── history.ts    # Race history endpoints
│   │   └── alerts.ts     # Alerts endpoints
│   ├── components/
│   │   ├── layout/       # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── Layout.tsx
│   │   ├── ui/           # Reusable UI components
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── StatusDot.tsx
│   │   └── charts/       # Chart components
│   │       ├── LapTimeChart.tsx
│   │       ├── TireWearChart.tsx
│   │       ├── SectorBarChart.tsx
│   │       └── PositionChart.tsx
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx
│   │   ├── RaceReport.tsx
│   │   ├── DriverComparison.tsx
│   │   └── RaceHistory.tsx
│   ├── hooks/            # Custom hooks
│   │   ├── useLiveData.ts
│   │   ├── useRaceReport.ts
│   │   └── useAlerts.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── styles/           # Global styles
│   │   ├── variables.css
│   │   └── global.css
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.local
```

## 🎨 Design System

### Colors
- **Background**: `#08090A` (near black)
- **Surface**: `#111318` (cards)
- **Primary Red**: `#E10600` (alerts, CTAs, live status)
- **Primary Blue**: `#0066FF` (data, charts, links)
- **Light Blue**: `#00D2FF` (highlights, active states)

### Typography
- **Body**: Inter
- **Headings/Numbers**: Rajdhani (bold, uppercase)

### Design Rules
- No shadows — borders and contrast only
- All transitions: 150ms ease
- Cards: 1px border, 8px radius
- Active cards: 2px top border (red or blue)

## 📊 Pages

### 1. Live Dashboard (`/dashboard`)
- Real-time telemetry updates every 5s
- Driver standings with position changes
- Lap time charts (all drivers)
- Sector analysis
- Tire strategy timeline
- Engine metrics
- Live alerts panel

### 2. Race Report (`/report/:sessionKey`)
- AI-generated race narrative
- Headline + race story
- Key moments timeline
- Podium display
- Driver-by-driver reports
- Technical insights
- Anomaly detection results

### 3. Driver Comparison (`/compare`)
- Side-by-side driver analysis
- Lap time overlays
- Sector breakdowns
- Tire degradation curves
- AI comparison insights

### 4. Race History (`/history`)
- Browse races by year (2023-2025)
- Generate or view cached reports
- Quick access to past sessions

## 🔌 API Integration

All API calls go through `src/api/` modules:

```typescript
// Telemetry
telemetryApi.getSessionLaps(sessionKey)
telemetryApi.getDriverLaps(sessionKey, driverNumber)

// History
historyApi.getRaces(year)
historyApi.getRaceReport(sessionKey)
historyApi.refreshReport(sessionKey)

// Alerts
alertsApi.getAlerts(sessionKey)
```

## 🎣 Custom Hooks

### `useLiveData(sessionKey, interval)`
Polls telemetry endpoint every `interval` ms (default 5000).

```typescript
const { data, loading, error, lastUpdated } = useLiveData('latest', 5000);
```

### `useRaceReport(sessionKey)`
Fetches race report with loading progress.

```typescript
const { report, loading, generating, error, progress } = useRaceReport('9158');
```

### `useAlerts(sessionKey)`
Polls alerts every 10s, tracks new critical alerts.

```typescript
const { alerts, newAlertsCount } = useAlerts('latest');
```

## 🧩 Component Guidelines

### Loading States
Every data component must handle:
1. **Loading**: Skeleton shimmer animation
2. **Empty**: EmptyState component with helpful message
3. **Error**: Red border + error message + retry button

### Number Formatting
- Lap times: `1:23.456`
- Gaps: `+1.234s`
- Percentages: `87.3%`

### Charts (Recharts)
- Always use `ResponsiveContainer` with `width="100%"`
- Include loading skeletons
- Tooltips with formatted values
- Legend with driver toggles

## 📱 Responsive Design

- **Desktop (1280px+)**: Full 3-column dashboard
- **Tablet (768-1280px)**: 2 columns, icon-only sidebar
- **Mobile (<768px)**: Single column, bottom tab bar

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## 🔧 Environment Variables

Create `.env.local`:

```
VITE_API_BASE_URL=http://localhost:8000
```

## 📦 Dependencies

- **React 18** + **TypeScript**
- **React Router v6** (routing)
- **Axios** (HTTP client)
- **Recharts** (charts)
- **Lucide React** (icons)
- **CSS Modules** (styling)

## ✅ Quality Checklist

- [ ] No console errors on load
- [ ] All API calls through `src/api/`
- [ ] All data has TypeScript types (no `any`)
- [ ] Every chart has loading skeleton
- [ ] All numbers properly formatted
- [ ] No placeholder/lorem ipsum text
- [ ] Responsive on all screen sizes
- [ ] Loading/empty/error states for all data

## 🚨 Backend Requirements

Ensure FastAPI backend is running:

```bash
cd ..
uvicorn app.main:app --reload
```

Backend should be accessible at `http://localhost:8000`

## 📝 Notes

- Sidebar navigation uses Lucide icons
- Active nav item: 2px left red border + highlight background
- Live status: pulsing red dot when session active
- Critical alerts trigger visual notification
- All transitions are 150ms for snappy feel
- No UI libraries — everything built from scratch

---

Built with ❤️ for F1 race intelligence
