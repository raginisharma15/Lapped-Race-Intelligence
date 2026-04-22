# LAPPED Frontend Setup Guide

## 🚀 Quick Start

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at **http://localhost:5173**

## ✅ What's Been Created

### Core Structure
- ✅ Vite + React + TypeScript configuration
- ✅ React Router v6 setup
- ✅ API client with Axios
- ✅ Custom hooks for data fetching
- ✅ TypeScript types matching backend schemas
- ✅ CSS Modules with design system variables

### Components
- ✅ Layout (Sidebar + TopBar)
- ✅ Card component
- ✅ All 4 pages (Dashboard, RaceReport, DriverComparison, RaceHistory)

### API Integration
- ✅ Telemetry API
- ✅ History API
- ✅ Alerts API
- ✅ Axios interceptors

### Hooks
- ✅ `useLiveData` - Polls telemetry every 5s
- ✅ `useRaceReport` - Fetches race reports with progress
- ✅ `useAlerts` - Polls alerts every 10s

## 📦 Dependencies Installed

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.22.0",
  "axios": "^1.6.7",
  "recharts": "^2.12.0",
  "lucide-react": "^0.344.0"
}
```

## 🎨 Design System

All design tokens are in `src/styles/variables.css`:

- **Colors**: Bloomberg Terminal-inspired dark theme
- **Typography**: Inter (body) + Rajdhani (headings)
- **Spacing**: Consistent 24px grid
- **Transitions**: 150ms for snappy feel

## 🔌 Backend Connection

The frontend expects the FastAPI backend at:
```
http://localhost:8000
```

Make sure your backend is running:
```bash
cd ..
uvicorn app.main:app --reload
```

## 📁 File Structure

```
frontend/
├── src/
│   ├── api/              # API clients
│   ├── components/       # React components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # Reusable UI
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Page components
│   ├── styles/           # Global styles
│   ├── types/            # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🎯 Next Steps

### To Complete the Dashboard:

1. **Add Charts** (using Recharts):
   - Create `src/components/charts/LapTimeChart.tsx`
   - Create `src/components/charts/TireWearChart.tsx`
   - Create `src/components/charts/SectorBarChart.tsx`
   - Create `src/components/charts/PositionChart.tsx`

2. **Add More UI Components**:
   - `src/components/ui/Badge.tsx` - Status badges
   - `src/components/ui/Spinner.tsx` - Loading spinner
   - `src/components/ui/EmptyState.tsx` - No data state
   - `src/components/ui/StatusDot.tsx` - Pulsing live indicator

3. **Enhance Dashboard**:
   - Driver standings table with live updates
   - Tire strategy timeline visualization
   - Engine metrics gauges
   - Fastest lap card with sector splits

4. **Add Data Processing**:
   - Create `src/utils/formatters.ts` for number formatting
   - Create `src/utils/calculations.ts` for lap time deltas
   - Create `src/utils/colors.ts` for driver/team colors

### Example: Adding a Chart

```typescript
// src/components/charts/LapTimeChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LapRecord } from '@/types';

interface Props {
  data: LapRecord[];
}

export const LapTimeChart = ({ data }: Props) => {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <XAxis dataKey="lap_number" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="lap_time" stroke="#0066FF" />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### Example: Number Formatting

```typescript
// src/utils/formatters.ts
export const formatLapTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
};

export const formatGap = (seconds: number): string => {
  return `+${seconds.toFixed(3)}s`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Backend Not Connecting
1. Check backend is running on port 8000
2. Check `.env.local` has correct `VITE_API_BASE_URL`
3. Check browser console for CORS errors

### TypeScript Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Development Tips

1. **Hot Reload**: Vite provides instant HMR - changes appear immediately
2. **TypeScript**: All types are in `src/types/index.ts` - keep them synced with backend
3. **CSS Modules**: Each component has its own `.module.css` file
4. **API Calls**: Always go through `src/api/` - never use `fetch()` directly in components
5. **Loading States**: Every data component should handle loading/empty/error states

## 🚢 Building for Production

```bash
# Build
npm run build

# Preview production build
npm run preview
```

Build output goes to `dist/` directory.

## 📚 Resources

- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [Recharts](https://recharts.org/)
- [Lucide Icons](https://lucide.dev/)

---

**Status**: ✅ Core structure complete, ready for feature development

**Next Priority**: Add Recharts visualizations to Dashboard page
