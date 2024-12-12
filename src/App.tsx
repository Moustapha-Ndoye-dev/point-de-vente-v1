import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEnterprise } from './contexts/EnterpriseContext';
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Categories } from './pages/Categories';
import { POS } from './pages/POS';
import { SalesReport } from './pages/SalesReport';
import { Customers } from './pages/Customers';
import { Debts } from './pages/Debts';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationCenter } from './components/NotificationCenter';
import { CurrencyProvider } from './contexts/CurrencyContext';
import './index.css';

function App() {
  const { enterprise, loading } = useEnterprise();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <CurrencyProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            {enterprise ? (
              <>
                <Navbar />
                <main>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/pos" element={<POS />} />
                    <Route path="/sales-report" element={<SalesReport />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/debts" element={<Debts />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </>
            ) : (
              <Routes>
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            )}
            <NotificationCenter />
          </div>
        </Router>
      </CurrencyProvider>
    </NotificationProvider>
  );
}

export default App;