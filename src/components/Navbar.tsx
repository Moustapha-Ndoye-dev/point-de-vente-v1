import { PackageSearch, ShoppingCart, Tags, LayoutDashboard, Menu, X, BarChart2, Users, BanknoteIcon, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { logout } from '../data/auth';

export function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { setEnterprise } = useEnterprise();

  const navItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Tableau de bord'
    },
    {
      to: '/inventory',
      icon: PackageSearch,
      label: 'Inventaire'
    },
    {
      to: '/categories',
      icon: Tags,
      label: 'Catégories'
    },
    {
      to: '/pos',
      icon: ShoppingCart,
      label: 'Point de vente'
    },
    {
      to: '/sales-report',
      icon: BarChart2,
      label: 'Rapport des ventes'
    },
    {
      to: '/customers',
      icon: Users,
      label: 'Clients'
    },
    {
      to: '/debts',
      icon: BanknoteIcon,
      label: 'Dettes'
    }
  ];

  const NavLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <Link
      to={to}
      onClick={() => setIsMenuOpen(false)}
      className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
        location.pathname === to
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </Link>
  );

  const handleLogout = async () => {
    await logout();
    setEnterprise(null);
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14">
        <h1 className="text-lg font-bold text-gray-800">Sama Shop</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-500 hover:text-gray-900"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden ${isMenuOpen ? 'block' : 'hidden'} border-t border-gray-100`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} {...item} />
          ))}
        </div>
      </div>

      {/* Desktop menu */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-14">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-lg font-bold text-gray-800">Sama Shop</h1>
              </div>
              <div className="ml-6 flex items-center space-x-3">
                {navItems.map((item) => (
                  <NavLink key={item.to} {...item} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;