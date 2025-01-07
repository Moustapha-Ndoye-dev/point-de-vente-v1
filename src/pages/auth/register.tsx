import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createEnterprise } from '../../data/enterprise';

function generateUniqueId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!navigator.onLine) {
      setError('Pas de connexion internet. Veuillez vérifier votre connexion.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const [result, registerError] = await createEnterprise({
        id: generateUniqueId(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        subscriptionStatus: 'active',
        subscriptionEndDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      if (registerError) {
        setError(registerError);
        setLoading(false);
        return;
      }

      if (result) {
        navigate('/login?registered=true');
      }
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Créer un compte entreprise
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-xl shadow-indigo-100/50 sm:rounded-lg sm:px-10 border border-indigo-50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nom de l'entreprise
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    type="text"
                    required
                    className="h-10 appearance-none block w-full px-3 border border-gray-200 rounded-md 
                              shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                              focus:ring-indigo-500/20 focus:border-indigo-500 transition-all
                              bg-gray-50/50 hover:bg-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
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
                <div className="mt-1">
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmer le mot de passe
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    className="h-10 appearance-none block w-full px-3 border border-gray-200 rounded-md 
                              shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                              focus:ring-indigo-500/20 focus:border-indigo-500 transition-all
                              bg-gray-50/50 hover:bg-white"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Téléphone
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    type="tel"
                    required
                    className="h-10 appearance-none block w-full px-3 border border-gray-200 rounded-md 
                              shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                              focus:ring-indigo-500/20 focus:border-indigo-500 transition-all
                              bg-gray-50/50 hover:bg-white"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Adresse
                </label>
                <div className="mt-1">
                  <textarea
                    id="address"
                    required
                    className="h-10 appearance-none block w-full px-3 border border-gray-200 rounded-md 
                              shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                              focus:ring-indigo-500/20 focus:border-indigo-500 transition-all
                              bg-gray-50/50 hover:bg-white"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
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
                  Création en cours...
                </span>
              ) : (
                'Créer le compte'
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 text-center">
        <span className="text-sm text-gray-600">
          Déjà un compte ? {' '}
          <Link 
            to="/login" 
            className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Connectez-vous maintenant
          </Link>
        </span>
      </div>
    </div>
  );
} 