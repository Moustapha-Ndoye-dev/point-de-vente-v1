import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
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
import EnterprisesPage from './pages/admin/enterprises';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationCenter } from './components/NotificationCenter';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { checkSession} from './data/auth';
import './index.css';
import { useLoading } from './contexts/LoadingContext';
import { InvoiceGenerator } from './components/InvoiceGenerator';
import { ErrorBoundary } from 'react-error-boundary';
import AdminRoute from './components/AdminRoute';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900">Une erreur est survenue</h3>
      <p className="mt-1 text-sm text-gray-500">{error.message}</p>
    </div>
  );
}

function App() {
  const { enterprise, setEnterprise, setLoading } = useEnterprise();
  const { setIsLoading } = useLoading();
  const [initializing, setInitializing] = useState(true);


  useEffect(() => {
    const verifySession = async () => {
      setIsLoading(true);
      try {
        const { isValid, enterprise: validEnterprise } = await checkSession();
        if (isValid && validEnterprise) {
          setEnterprise(validEnterprise);
        } else {
          setEnterprise(null);
        }
      } catch (error) {
        console.error('Erreur de vérification de session:', error);
        setEnterprise(null);
      } finally {
        setLoading(false);
        setIsLoading(false);
        setInitializing(false);
      }
    };

    verifySession();
  }, [setEnterprise, setLoading, setIsLoading]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <NotificationProvider>
        <CurrencyProvider>
          <div className="min-h-screen bg-gray-50">
            {initializing ? (
              <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
              </div>
            ) : (
              <>
                {enterprise ? <PrivateRoutes /> : <PublicRoutes />}
                <NotificationCenter />
              </>
            )}
          </div>
        </CurrencyProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

function PrivateRoutes() {
  return (
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
          <Route path="/invoices" element={<InvoiceGenerator />} />
          <Route 
            path="/admin/enterprises" 
            element={
              <AdminRoute>
                <EnterprisesPage />
              </AdminRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={<Navigate to="/admin/enterprises" replace />} 
          />
          <Route 
            path="*"
            element={<Navigate to="/admin/enterprises" replace />} 
          />
        </Routes>
      </main>
    </>
  );
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
