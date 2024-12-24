import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginEnterprise } from '../../data/auth';
import { useEnterprise } from '../../contexts/EnterpriseContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setEnterprise } = useEnterprise();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setError('');
    };

    const handleOffline = () => {
      setError('Pas de connexion internet. Veuillez vérifier votre connexion.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifier l'état initial
    if (!navigator.onLine) {
      setError('Pas de connexion internet. Veuillez vérifier votre connexion.');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (location.search.includes('registered=true')) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
        window.history.replaceState({}, '', '/login');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!navigator.onLine) {
      setError('Pas de connexion internet. Veuillez vérifier votre connexion.');
      setLoading(false);
      return;
    }

    const { session, enterprise, error: loginError } = await loginEnterprise(
      formData.email,
      formData.password
    );

    if (loginError) {
      setError(loginError);
      setLoading(false);
      return;
    }

    if (enterprise && session) {
      localStorage.setItem('enterprise', JSON.stringify(enterprise));
      localStorage.setItem('token', session.token);
      setEnterprise(enterprise);
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Connexion Entreprise
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-indigo-100/50 sm:rounded-lg sm:px-10 border border-indigo-50">
          {showSuccessMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r">
              <p className="text-sm text-green-700 font-medium">
                Compte créé avec succès ! Vous pouvez maintenant vous connecter.
              </p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  type="email"
                  required
                  className="h-10 appearance-none block w-full px-3 border border-gray-200 rounded-md 
                            shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                            focus:ring-indigo-500/20 focus:border-indigo-500 transition-all
                            bg-gray-50/50 hover:bg-white"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type="password"
                  required
                  className="h-10 appearance-none block w-full px-3 border border-gray-200 rounded-md 
                            shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                            focus:ring-indigo-500/20 focus:border-indigo-500 transition-all
                            bg-gray-50/50 hover:bg-white"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 flex justify-center items-center py-2 px-4 border border-transparent 
                       rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 
                       hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-indigo-500 transition-all disabled:opacity-50 
                       disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 text-center">
        <span className="text-sm text-gray-600">
          Pas encore de compte ? {' '}
          <Link 
            to="/register" 
            className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Inscrivez-vous maintenant
          </Link>
        </span>
      </div>
    </div>
  );
} 