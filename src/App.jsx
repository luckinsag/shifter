import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

import AdminLayout from './components/Layout/AdminLayout';
import ShiftTables from './pages/Admin/ShiftTables';
import ShiftTableDetail from './pages/Admin/ShiftTableDetail';
import ShiftTableStaff from './pages/Admin/ShiftTableStaff';
import AttendanceApproval from './pages/Admin/AttendanceApproval';
import Reports from './pages/Admin/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Staff Dashboard Route */}
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Settings Route */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ShiftTables />} />
          <Route path="shift-tables/:id" element={<ShiftTableDetail />} />
          <Route path="shift-tables/:id/staff" element={<ShiftTableStaff />} />
          <Route path="attendance" element={<AttendanceApproval />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
