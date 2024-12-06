// Debts.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, DollarSign, UserRound, X } from 'lucide-react';
import { Debt, Payment } from '../types/types';
import { useCurrency } from '../contexts/CurrencyContext';
import { useNotifications } from '../contexts/NotificationContext';
import { fetchDebts, markDebtAsPaid, fetchCustomers } from '../data/debts';
import { usePagination } from '../hooks/usePagination';

export function Debts() {
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
    currentPage,
    itemsPerPage,
    totalPages,
    currentItems,
    goToPage
  } = usePagination(debts, 10);

  const loadData = useCallback(async () => {
    try {
      const filters: any = {};

      if (filterType !== 'all') {
        filters.settled = filterType === 'settled';
        if (filterType === 'overdue') {
          filters.overdue = true;
        }
      }

      if (timeRange !== 'all') {
        filters.timeRange = timeRange;
      }

      filters.limit = itemsPerPage;
      filters.offset = (currentPage - 1) * itemsPerPage;

      const fetchedDebts = await fetchDebts(filters);
      setDebts(fetchedDebts);

      const fetchedCustomers = await fetchCustomers();
      const customersMap: { [key: string]: string } = {};
      fetchedCustomers.forEach(customer => {
        customersMap[customer.id] = customer.name;
      });
      setCustomers(customersMap);
    } catch (error) {
      console.error('Erreur lors du chargement des dettes:', error);
      addNotification('Erreur lors du chargement des dettes.', 'error');
    }
  }, [filterType, timeRange, currentPage, itemsPerPage, addNotification]);

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
  }, [selectedDebtId, paymentAmount, debts, getPaidAmount, markDebtAsPaid, addNotification]);

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

  const stats = useMemo(() => {
    const total = debts.reduce((sum, debt) => sum + debt.amount, 0);
    const settled = debts.filter(debt => debt.settled).reduce((sum, debt) => sum + debt.amount, 0);
    const pending = total - settled;
    const overdue = debts
      .filter(debt => !debt.settled && debt.dueDate && new Date(debt.dueDate) < new Date())
      .reduce((sum, debt) => sum + debt.amount, 0);

    return { total, settled, pending, overdue };
  }, [debts]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {showPaymentModal && selectedDebtId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Enregistrer un paiement</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Montant du paiement</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    min="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="block w-full pr-12 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">FCFA</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleAddPayment}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Valider le paiement
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestion des dettes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Total des dettes</p>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.total)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Dettes en cours</p>
          <p className="text-2xl font-bold text-blue-600">{formatAmount(stats.pending)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Dettes réglées</p>
          <p className="text-2xl font-bold text-green-600">{formatAmount(stats.settled)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Dettes en retard</p>
          <p className="text-2xl font-bold text-red-600">{formatAmount(stats.overdue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par client..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); goToPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value as 'all' | 'pending' | 'settled' | 'overdue'); goToPage(1); }}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En cours</option>
                <option value="settled">Réglées</option>
                <option value="overdue">En retard</option>
              </select>
              <select
                value={timeRange}
                onChange={(e) => { setTimeRange(e.target.value as 'all' | 'today' | 'week' | 'month'); goToPage(1); }}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">Toute période</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>
          </div>
        </div>

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
              {currentItems.map((debt) => {
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
          {currentItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucune dette trouvée
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-md ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            Précédent
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-md ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}