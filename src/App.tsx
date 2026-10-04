'use client';

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { SensorProvider } from '@/context/SensorContext';
import Layout from '@/components/layout/Layout';

import Login from '@/views/auth/Login';

import FleetOverview from '@/views/commander/FleetOverview';
import AircraftStatusMap from '@/views/commander/AircraftStatusMap';
import MissionReadiness from '@/views/commander/MissionReadiness';
import Alerts from '@/views/commander/Alerts';
import CommanderReports from '@/views/commander/Reports';

import AircraftHealth from '@/views/engineer/AircraftHealth';
import AircraftDetail from '@/views/engineer/AircraftDetail';
import LiveSensorData from '@/views/engineer/LiveSensorData';
import FaultPredictions from '@/views/engineer/FaultPredictions';
import WorkOrdersBoard from '@/views/engineer/WorkOrders';
import MaintenanceHistory from '@/views/engineer/MaintenanceHistory';
import AIRecommendations from '@/views/engineer/AIRecommendations';
import CrewWorkload from '@/views/engineer/CrewWorkload';

import InventoryOverview from '@/views/logistics/InventoryOverview';
import PartsInventory from '@/views/logistics/PartsInventory';
import UpcomingDemand from '@/views/logistics/UpcomingDemand';
import ProcurementAlerts from '@/views/logistics/ProcurementAlerts';
import ProcurementTracking from '@/views/logistics/ProcurementTracking';
import PartsAnalytics from '@/views/logistics/PartsAnalytics';
import LogisticsReports from '@/views/logistics/Reports';

import type { Role } from '@/data/types';

function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen bg-white" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen bg-white" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <SensorProvider>
          <HashRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* ---------- Commander ---------- */}
              <Route
                path="/commander"
                element={
                  <RequireRole role="commander">
                    <Layout />
                  </RequireRole>
                }
              >
                <Route index element={<FleetOverview />} />
                <Route path="map" element={<AircraftStatusMap />} />
                <Route path="readiness" element={<MissionReadiness />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="reports" element={<CommanderReports />} />
              </Route>

              {/* ---------- Engineer ---------- */}
              <Route
                path="/engineer"
                element={
                  <RequireRole role="engineer">
                    <Layout />
                  </RequireRole>
                }
              >
                <Route index element={<AircraftHealth />} />
                <Route path="sensors" element={<LiveSensorData />} />
                <Route path="aircraft/:id" element={<AircraftDetail />} />
                <Route path="predictions" element={<FaultPredictions />} />
                <Route path="workorders" element={<WorkOrdersBoard />} />
                <Route path="history" element={<MaintenanceHistory />} />
                <Route path="recommendations" element={<AIRecommendations />} />
                <Route path="crew" element={<CrewWorkload />} />
              </Route>

              {/* ---------- Logistics ---------- */}
              <Route
                path="/logistics"
                element={
                  <RequireRole role="logistics">
                    <Layout />
                  </RequireRole>
                }
              >
                <Route index element={<InventoryOverview />} />
                <Route path="parts" element={<PartsInventory />} />
                <Route path="demand" element={<UpcomingDemand />} />
                <Route path="procurement" element={<ProcurementAlerts />} />
                <Route path="tracking" element={<ProcurementTracking />} />
                <Route path="analytics" element={<PartsAnalytics />} />
                <Route path="reports" element={<LogisticsReports />} />
              </Route>

              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </HashRouter>
        </SensorProvider>
      </DataProvider>
    </AuthProvider>
  );
}
