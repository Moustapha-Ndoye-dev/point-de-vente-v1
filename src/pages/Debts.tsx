import { useState, useEffect, useCallback } from 'react';
import { Search, DollarSign, UserRound } from 'lucide-react';
import { Debt, Payment } from '../types/types';
import { useCurrency } from '../contexts/CurrencyContext';
import { useNotifications } from '../contexts/NotificationContext';
import { fetchDebts, markDebtAsPaid, fetchCustomers } from '../data/debts';
import { usePagination } from '../hooks/usePagination';
import { useEnterprise } from '../contexts/EnterpriseContext';
import Pagination from '../components/Pagination';

export function Debts() {
  const { enterprise } = useEnterprise();
  const enterpriseId = enterprise?.id;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'settled' | 'overdue'>('pending');
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const { formatAmount } = useCurrency();
  const { addNotification } = useNotifications();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<{ [key: string]: string }>({});
  const [notifiedDebts, setNotifiedDebts] = useState<string[]>([]);

  const {
    currentItems: currentDebts,
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    changeItemsPerPage
  } = usePagination(debts, 10); // Default items per page

  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const loadData = useCallback(async () => {
    if (!enterpriseId) return;

    try {
      setIsLoading(true);
      const filters: any = {};
      filters.limit = itemsPerPage;
      filters.offset = (currentPage - 1) * itemsPerPage;
      if (filterType !== 'all') {
        filters.settled = filterType === 'settled';
        if (filterType === 'overdue') {
          filters.overdue = true;
        }
      }

      if (timeRange !== 'all') {
        filters.timeRange = timeRange;
      }

      const fetchedDebts = await fetchDebts(enterpriseId, filters);
      setDebts(fetchedDebts || []);

      const fetchedCustomers = await fetchCustomers();
      const customersMap: { [key: string]: string } = {};
      fetchedCustomers.forEach(customer => {
        customersMap[customer.id] = customer.name;
      });
      setCustomers(customersMap);
    } catch (error) {
      console.error('Erreur lors du chargement des dettes:', error);
      addNotification('Erreur lors du chargement des dettes.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filterType, timeRange, enterpriseId, addNotification, currentPage, itemsPerPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (Notification.permission === 'granted') {
      const overdueDebts = debts.filter(debt =>
        !debt.settled && debt.dueDate && new Date(debt.dueDate) < new Date()
      );

      overdueDebts.forEach(debt => {
        if (!notifiedDebts.includes(debt.id)) {
          const customerName = customers[debt.customerId] || 'Client inconnu';
          new Notification('Dette en retard', {
            body: `La dette de ${customerName} d'un montant de ${formatAmount(debt.amount)} est en retard.`,
          });
          setNotifiedDebts(prev => [...prev, debt.id]);
        }
      });
    }
  }, [debts, customers, notifiedDebts, formatAmount]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getPaidAmount = useCallback((debtId: string): number => {
    return payments
      .filter(payment => payment.debtId === debtId)
      .reduce((sum, payment) => sum + payment.amount, 0);
  }, [payments]);

  const handleAddPayment = useCallback(async () => {
    if (!selectedDebtId || paymentAmount <= 0 || isNaN(paymentAmount)) {
      addNotification('Montant invalide.', 'warning');
      return;
    }

    const debt = debts.find(d => d.id === selectedDebtId);
    if (!debt) {
      addNotification('Dette non trouvée.', 'error');
      return;
    }

    const totalPaid = getPaidAmount(selectedDebtId) + paymentAmount;
    const isFullyPaid = totalPaid >= debt.amount;

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      debtId: selectedDebtId,
      amount: paymentAmount,
      date: new Date().toISOString(),
      enterpriseId: enterpriseId!,
      createdAt: new Date().toISOString(),
    };

    setPayments(prev => [...prev, newPayment]);

    if (isFullyPaid) {
      try {
        const updatedDebt = await markDebtAsPaid(selectedDebtId);
        if (updatedDebt) {
          setDebts(prev => prev.map(d => (d.id === selectedDebtId ? updatedDebt : d)));
          addNotification('Dette réglée avec succès.', 'success');
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la dette:', error);
        addNotification('Erreur lors de la mise à jour de la dette.', 'error');
      }
    } else {
      addNotification('Paiement enregistré.', 'success');
    }

    setShowPaymentModal(false);
    setSelectedDebtId(null);
    setPaymentAmount(0);
  }, [selectedDebtId, paymentAmount, debts, getPaidAmount, markDebtAsPaid, addNotification, enterpriseId]);

  const getRemainingAmount = useCallback((debt: Debt): number => {
    const remaining = debt.amount - getPaidAmount(debt.id);
    return remaining < 0 ? 0 : remaining;
  }, [getPaidAmount]);

  const handlePayment = useCallback((debtId: string) => {
    setSelectedDebtId(debtId);
    const debt = debts.find(d => d.id === debtId);
    if (debt) {
      setPaymentAmount(getRemainingAmount(debt));
    }
    setShowPaymentModal(true);
  }, [debts, getRemainingAmount]);

  const renderMobileDebtList = () => (
    <div className="space-y-4">
      {currentDebts.map((debt) => {
        const paidAmount = getPaidAmount(debt.id);
        const remainingAmount = getRemainingAmount(debt);
        const customerName = customers[debt.customerId];
        const dueDateFormatted = debt.dueDate
          ? new Date(debt.dueDate).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : 'N/A';

        return (
          <div key={debt.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserRound className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{customerName || 'Client inconnu'}</h3>
                  <p className="text-sm text-gray-500">{dueDateFormatted}</p>
                </div>
              </div>
              <div>
                {debt.settled ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Réglée
                  </span>
                ) : (debt.dueDate && new Date(debt.dueDate) < new Date()) ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    En retard
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    En cours
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Montant total</p>
                <p className="text-sm font-medium text-gray-900">{formatAmount(debt.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Montant payé</p>
                <p className="text-sm font-medium text-green-600">{formatAmount(paidAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reste à payer</p>
                <p className="text-sm font-medium text-red-600">{formatAmount(remainingAmount)}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              {!debt.settled && (
                <button
                  onClick={() => handlePayment(debt.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Payer
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {isLoading ? (
        <div className="text-center py-12">
          <p>Chargement...</p>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestion des dettes</h2>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'pending' | 'settled' | 'overdue')}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En cours</option>
                <option value="settled">Réglées</option>
                <option value="overdue">En retard</option>
              </select>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'all' | 'today' | 'week' | 'month')}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">Toute période</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>
          </div>

          {currentDebts.length === 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune dette</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Il n'y a actuellement aucune dette à afficher pour les critères sélectionnés.
                </p>
              </div>
            </div>
          ) : (
            <>
              {isMobile ? renderMobileDebtList() : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Montant total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Montant payé
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reste à payer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Échéance
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentDebts.map((debt) => {
                          const paidAmount = getPaidAmount(debt.id);
                          const remainingAmount = getRemainingAmount(debt);
                          const customerName = customers[debt.customerId];
                          const dueDateFormatted = debt.dueDate
                            ? new Date(debt.dueDate).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'N/A';

                          return (
                            <tr key={debt.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <UserRound className="w-5 h-5 text-gray-400 mr-2" />
                                  <div className="text-sm font-medium text-gray-900">
                                    {customerName || 'Client inconnu'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatAmount(debt.amount)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-green-600">
                                  {formatAmount(paidAmount)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-red-600">
                                  {formatAmount(remainingAmount)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {dueDateFormatted}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {debt.settled ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Réglée
                                  </span>
                                ) : (debt.dueDate && new Date(debt.dueDate) < new Date()) ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    En retard
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    En cours
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {!debt.settled && remainingAmount > 0 && (
                                  <button
                                    onClick={() => handlePayment(debt.id)}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                  >
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    Payer
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {debts.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={changeItemsPerPage}
              itemsPerPageOptions={[5, 10, 20]}
            />
          )}

          {showPaymentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-medium mb-4">Ajouter un paiement</h3>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full border rounded p-2 mb-4"
                />
                <div className="flex justify-end space-x-2">
                  <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-gray-600">
                    Annuler
                  </button>
                  <button onClick={handleAddPayment} className="px-4 py-2 bg-blue-600 text-white rounded">
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
