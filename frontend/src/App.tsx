import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Landing } from './pages/Landing';
import { LandingWithCar } from './pages/LandingWithCar';
import { Dashboard } from './pages/Dashboard';
import { RaceReport } from './pages/RaceReport';
import { DriverComparison } from './pages/DriverComparison';
import { RaceHistory } from './pages/RaceHistory';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/landing-3d" element={<LandingWithCar />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report/:sessionKey" element={<RaceReport />} />
        <Route path="/compare" element={<DriverComparison />} />
        <Route path="/history" element={<RaceHistory />} />
      </Route>
    </Routes>
  );
}

export default App;
