import { useEffect, useState } from 'react';
import { getEnterprises, activateEnterprise, deactivateEnterprise, isEnterpriseActive, getEnterprisesThisMonth } from '../../data/admin';
import { Enterprise } from '../../types/types';
import { Building, Search, Filter, ChevronDown, Info, BuildingIcon, MailIcon, ClockIcon, PhoneIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotifications } from '../../contexts/NotificationContext';
import Pagination from '../../components/Pagination';
import { ConfirmationModal } from '../../components/ConfirmationModal';

function EnterpriseCard({ enterprise, onStatusChange }: {
  enterprise: Enterprise,
  onStatusChange: (id: string, status: boolean) => void
}) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [statusToChange, setStatusToChange] = useState<boolean | null>(null);
  const { addNotification } = useNotifications();

  const handleStatusChange = (status: boolean) => {
    setStatusToChange(status);
    setShowConfirmationModal(true);
  };

  const confirmStatusChange = async (id: string) => {
    if (statusToChange === null) return;
    try {
      await onStatusChange(id, statusToChange);
      addNotification(
        `L'entreprise a été ${statusToChange ? 'activée' : 'désactivée'} avec succès.`,
        'success'
      );
    } catch (error) {
      addNotification('Erreur lors de la mise à jour du statut.', 'error');
    } finally {
      setShowConfirmationModal(false);
      setStatusToChange(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{enterprise.name}</h3>
            <p className="text-sm text-gray-500">{enterprise.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-500">Statut:</span>
            <span className={`ml-2 font-medium ${
              enterprise.subscriptionStatus ? 'text-green-600' : 'text-red-600'
            }`}>
              {enterprise.subscriptionStatus ? 'Compte activer' : 'Compte desactiver'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Dernière connexion:</span>
            <span className="ml-2 font-medium">
              {enterprise.lastLogin ? 
                formatDistanceToNow(new Date(enterprise.lastLogin), { addSuffix: true, locale: fr }) : 
                'il y a un moment'}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleStatusChange(true)}
            className={`w-full py-1.5 px-3 sm:py-2 sm:px-4 rounded-md sm:rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-xs sm:text-sm ${
              enterprise.subscriptionStatus ? 'hidden' : ''
            }`}
          >
            Activer
          </button>
          <button
            onClick={() => handleStatusChange(false)}
            className={`w-full py-1.5 px-3 sm:py-2 sm:px-4 rounded-md sm:rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs sm:text-sm ${
              !enterprise.subscriptionStatus ? 'hidden' : ''
            }`}
          >
            Désactiver
          </button>
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-1 sm:p-1.5 text-gray-500 hover:text-blue-600"
            title="Détails"
          >
            <Info className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {showInfoModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-0">
            <h3 className="text-lg font-bold mb-4 text-center">Détails de l'entreprise</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-blue-500">
                  <BuildingIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-gray-500">Nom:</p>
                  <p className="font-medium text-gray-900">{enterprise.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-500">
                  <MailIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-gray-500">Email:</p>
                  <p className="font-medium text-gray-900">{enterprise.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-500">
                  <ClockIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-gray-500">Dernière connexion:</p>
                  <p className="font-medium text-gray-900">
                    {enterprise.lastLogin ? 
                      formatDistanceToNow(new Date(enterprise.lastLogin), { addSuffix: true, locale: fr }) : 
                      'Jamais'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-500">
                  <PhoneIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-gray-500">Téléphone:</p>
                  <p className="font-medium text-gray-900">{enterprise.phone}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmationModal && (
        <ConfirmationModal
          message={`Êtes-vous sûr de vouloir ${statusToChange ? 'activer' : 'désactiver'} cette entreprise ?`}
          onConfirm={() => confirmStatusChange(enterprise.id)}
          onCancel={() => setShowConfirmationModal(false)}
        />
      )}
    </div>
  );
}

import AdminRoute from '../../components/AdminRoute';

export default function EnterprisesPage() {
  return (
    <AdminRoute>
      <EnterpriseContent />
    </AdminRoute>
  );
}

function EnterpriseContent() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [monthlyEnterprises, setMonthlyEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getEnterprises();
        setEnterprises(data);
        const monthlyData = await getEnterprisesThisMonth();
        setMonthlyEnterprises(monthlyData);
      } catch (err) {
        setError('Erreur lors du chargement des entreprises');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const newUsersThisMonth = enterprises.filter(e => new Date(e.createdAt).getMonth() === new Date().getMonth());
    if (newUsersThisMonth.length > 0) {
      addNotification(`${newUsersThisMonth.length} nouveaux utilisateurs inscrits ce mois-ci`, 'info');
    }
  }, [enterprises, addNotification]);

  const updateEnterpriseStatus = async (id: string, status: boolean) => {
    try {
      if (status) {
        await activateEnterprise(id);
      } else {
        await deactivateEnterprise(id);
      }
      const data = await getEnterprises(); // Recharger les données
      setEnterprises(data);
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const filteredEnterprises = enterprises.filter(enterprise => {
    const matchesSearch = enterprise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         enterprise.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'true' && enterprise.subscriptionStatus) ||
                         (filterStatus === 'false' && !enterprise.subscriptionStatus) ||
                         (filterStatus === 'active' && isEnterpriseActive(enterprise.lastLogin ?? null)) ||
                         (filterStatus === 'inactive' && !isEnterpriseActive(enterprise.lastLogin ?? null) && enterprise.subscriptionStatus) ||
                         (filterStatus === 'thisMonth' && new Date(enterprise.createdAt).getMonth() === new Date().getMonth());
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEnterprises.length / itemsPerPage);
  const paginatedEnterprises = filteredEnterprises.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeEnterprises = enterprises.filter(e => isEnterpriseActive(e.lastLogin ?? null));
  const inactiveEnterprises = enterprises.filter(e => 
    !isEnterpriseActive(e.lastLogin ?? null) && e.subscriptionStatus
  );
  const monthlyRevenue = enterprises.filter(e => e.subscriptionStatus).length * 10000;

  const newUsersThisMonth = monthlyEnterprises.length;

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des entreprises</h1>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-gray-500 text-sm mb-2">Clients actifs</div>
          <div className="text-2xl font-bold text-green-600">{activeEnterprises.length}</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-gray-500 text-sm mb-2">Clients inactifs</div>
          <div className="text-2xl font-bold text-red-600">{inactiveEnterprises.length}</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-gray-500 text-sm mb-2">Revenu mensuel</div>
          <div className="text-2xl font-bold text-blue-600">{monthlyRevenue} FCFA</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-gray-500 text-sm mb-2">Total entreprises</div>
          <div className="text-2xl font-bold">{enterprises.length}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-gray-500 text-sm mb-2">Entreprises actives</div>
          <div className="text-2xl font-bold text-green-600">{enterprises.filter(e => e.subscriptionStatus).length}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-gray-500 text-sm mb-2">Nouveaux inscrits ce mois</div>
          <div className="text-2xl font-bold">{newUsersThisMonth}</div>
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une entreprise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none w-full sm:w-48 pl-10 pr-8 py-1.5 sm:py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
          >
            <option value="all">Tous les statuts</option>
            <option value="true">Compte activer</option>
            <option value="false">Compte desactiver</option>
            <option value="active">Compte actif</option>
            <option value="inactive">Compte inactif</option>
            <option value="thisMonth">Inscrit ce mois</option>
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedEnterprises.map(enterprise => (
          <EnterpriseCard
            key={enterprise.id}
            enterprise={enterprise}
            onStatusChange={updateEnterpriseStatus}
          />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={() => {
          setCurrentPage(1);
          // Optionnel: ajuster itemsPerPage si nécessaire
        }}
        itemsPerPageOptions={[5, 10, 20]}
      />
    </div>
  );
}
