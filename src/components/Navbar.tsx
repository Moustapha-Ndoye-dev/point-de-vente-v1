import {
  PackageSearch,
  ShoppingCart,
  Tags,
  LayoutDashboard,
  Menu,
  X,
  BarChart2,
  Users,
  BanknoteIcon,
  LogOut,
  FileText,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { logout } from "../data/auth";

export function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { setEnterprise } = useEnterprise();

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
    { to: "/inventory", icon: PackageSearch, label: "Inventaire" },
    { to: "/categories", icon: Tags, label: "Catégories" },
    { to: "/pos", icon: ShoppingCart, label: "Point de vente" },
    { to: "/sales-report", icon: BarChart2, label: "Rapport des ventes" },
    { to: "/customers", icon: Users, label: "Clients" },
    { to: "/debts", icon: BanknoteIcon, label: "Dettes" },
    { to: "/invoices", icon: FileText, label: "Factures" },
  ];

  const NavLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <Link
      to={to}
      onClick={() => setIsMenuOpen(false)}
      className={`flex items-center px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 relative
        ${
          location.pathname === to
            ? "bg-blue-700 text-white"
            : "text-white hover:text-blue-200 hover:bg-blue-600"
        }`}
    >
      <Icon className={`w-4 h-4 mr-2 ${location.pathname === to ? "text-white" : "text-blue-200"}`} />
      {label}
    </Link>
  );

  const handleLogout = async () => {
    await logout();
    setEnterprise(null);
    navigate("/login", { replace: true });
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 h-16">
        <h1 className="text-lg font-bold">Sama Shop</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-blue-700 rounded-full transition-all"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Background overlay */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-300 ease-out ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      ></div>

      {/* Mobile menu */}
      <div
        className={`fixed inset-y-0 left-0 w-64 transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-out bg-blue-600 shadow-2xl lg:hidden z-40`}
      >
        <div className="px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} {...item} />
          ))}
          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center px-4 py-2.5 text-sm font-medium text-white 
                     bg-red-600 rounded-md"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Desktop menu */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-14">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-lg font-bold">Sama Shop</h1>
              </div>
              <div className="ml-4 flex items-center space-x-1">
                {navItems.map((item) => (
                  <NavLink key={item.to} {...item} />
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-xs font-medium text-white 
                         bg-red-600 rounded-md hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
