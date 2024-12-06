import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Categories } from './pages/Categories';
import { POS } from './pages/POS';
import { SalesReport } from './pages/SalesReport';
import { Customers } from './pages/Customers';
import { Debts } from './pages/Debts';
import { NotificationProvider } from './contexts/NotificationContext'; // Use NotificationProvider
import './index.css';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
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
            </Routes>
          </main>
          {/* Remove NotificationCenter to prevent duplicate notifications */}
          {/* <NotificationCenter /> */}
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;