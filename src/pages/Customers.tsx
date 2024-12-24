import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Phone, X } from 'lucide-react';
import { Customer } from '../types/types';
import { ClientForm } from '../components/ClientForm';
import { fetchCustomers, addCustomer, updateCustomer, deleteCustomer, searchCustomers } from '../data/clients';
import { useNotifications } from '../contexts/NotificationContext';
import  Pagination  from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { useEnterprise } from '../contexts/EnterpriseContext';

export function Customers() {
  const { enterprise } = useEnterprise();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { addNotification } = useNotifications();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const {
    currentItems: currentCustomers,
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    changeItemsPerPage
  } = usePagination(customers);

  const loadCustomers = async () => {
    if (!enterprise?.id) {
      addNotification('Erreur: ID entreprise non disponible', 'error');
      return;
    }
    try {
      const data = await fetchCustomers(enterprise.id);
      setCustomers(data);
    } catch (error) {
      console.error('Erreur loadCustomers:', error);
      addNotification('Erreur lors du chargement des clients', 'error');
    }
  };

  useEffect(() => {
    if (enterprise?.id) {
      loadCustomers();
    }
  }, [enterprise?.id]);

  useEffect(() => {
    if (searchTerm) {
      const delayDebounceFn = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      loadCustomers();
    }
  }, [searchTerm]);

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      if (!enterprise?.id) {
        addNotification('Erreur: ID entreprise non disponible', 'error');
        return;
      }
      const results = await searchCustomers(searchTerm, enterprise.id);
      setCustomers(results);
    }
  };

  const handleSubmit = async (customerData: Omit<Customer, 'id'>) => {
    if (!enterprise?.id) {
      addNotification('Erreur: ID entreprise non disponible', 'error');
      return;
    }
    try {
      if (editingCustomer) {
        const result = await updateCustomer(
          editingCustomer.id,
          customerData,
          enterprise.id
        );
        if (result.success) {
          addNotification('Client mis à jour avec succès', 'success');
          setShowForm(false);
          await loadCustomers();
        } else {
          if (result.error?.includes('numéro de téléphone existe déjà')) {
            addNotification('Ce numéro de téléphone est déjà utilisé par un autre client', 'warning');
          } else {
            addNotification(result.error || 'Erreur lors de la mise à jour', 'error');
          }
        }
      } else {
        const result = await addCustomer(customerData, enterprise.id);
        if (result.success) {
          addNotification('Client ajouté avec succès', 'success');
          setShowForm(false);
          await loadCustomers();
        } else {
          if (result.error?.includes('numéro de téléphone existe déjà')) {
            addNotification('Ce numéro de téléphone est déjà utilisé par un autre client', 'warning');
          } else {
            addNotification(result.error || 'Erreur lors de l\'ajout', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Erreur handleSubmit:', error);
      addNotification('Erreur lors de l\'enregistrement du client', 'error');
    }
  };

  const handleDelete = async (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete || !enterprise?.id) {
      addNotification('Erreur: Données manquantes', 'error');
      return;
    }

    try {
      const result = await deleteCustomer(customerToDelete.id, enterprise.id);
      if (result.success) {
        addNotification('Client supprimé avec succès', 'success');
        await loadCustomers();
      } else {
        addNotification(result.error || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      addNotification('Erreur lors de la suppression', 'error');
    }
    setShowDeleteModal(false);
    setCustomerToDelete(null);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouveau client
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Téléphone
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {customer.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    {customer.phone ? (
                      <>
                        <Phone className="h-4 w-4 mr-1" />
                        {customer.phone}
                      </>
                    ) : (
                      <span className="text-gray-400">Non renseigné</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingCustomer(customer);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun client trouvé
          </div>
        )}
      </div>

      {customers.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={changeItemsPerPage}
            itemsPerPageOptions={[10, 20, 50, 100]}
          />
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingCustomer ? 'Modifier le client' : 'Nouveau client'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ClientForm
              onSubmit={handleSubmit}
              initialCustomer={editingCustomer}
            />
          </div>
        </div>
      )}

      {showDeleteModal && customerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirmer la suppression
              </h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600 mb-3">
                  Êtes-vous sûr de vouloir supprimer {customerToDelete.name} ?
                </p>
                <div className="space-y-2">
                  {customerToDelete.phone && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Téléphone</span>
                      <span className="text-sm text-gray-900">{customerToDelete.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCustomerToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}