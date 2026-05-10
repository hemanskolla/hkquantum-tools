import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CrmPage from './apps/myledger/pages/CrmPage';
import TodoPage from './apps/mytodo/pages/TodoPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/myledger" element={<ProtectedRoute><CrmPage /></ProtectedRoute>} />
          <Route path="/myledger/*" element={<ProtectedRoute><CrmPage /></ProtectedRoute>} />
          <Route path="/mytodo" element={<ProtectedRoute><TodoPage /></ProtectedRoute>} />
          <Route path="/mytodo/*" element={<ProtectedRoute><TodoPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
