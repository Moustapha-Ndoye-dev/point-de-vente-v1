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

    const { enterprise, error: loginError } = await loginEnterprise(
      formData.email,
      formData.password
    );

    if (loginError) {
      setError(loginError);
      setLoading(false);
      return;
    }

    if (enterprise) {
      localStorage.setItem('enterprise', JSON.stringify(enterprise));
      setEnterprise(enterprise);
      navigate('/admin/enterprises');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center p-4 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
          Connexion Entreprise
        </h2>
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className="bg-gray-50 p-6 sm:p-8 rounded-lg shadow-sm">
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
                  className="h-12 appearance-none block w-full px-4 border border-gray-300 rounded-lg 
                            placeholder-gray-500 focus:outline-none focus:ring-2 
                            focus:ring-indigo-500 focus:border-indigo-500 transition-all
                            bg-white hover:bg-gray-50"
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
                  className="h-12 appearance-none block w-full px-4 border border-gray-300 rounded-lg 
                            placeholder-gray-500 focus:outline-none focus:ring-2 
                            focus:ring-indigo-500 focus:border-indigo-500 transition-all
                            bg-white hover:bg-gray-50"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex justify-center items-center py-2 px-4 border border-transparent 
                       rounded-lg text-base font-medium text-white bg-indigo-600 
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
