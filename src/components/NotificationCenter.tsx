import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

import { fetchDebts } from '../data/debts';
import { fetchCustomers } from '../data/clients';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { useCurrency } from '../contexts/CurrencyContext';

export function NotificationCenter() {
  const { notifications, addNotification } = useNotifications();
  const { enterprise } = useEnterprise();
  const { formatAmount } = useCurrency();
  const [notifiedDebtIds, setNotifiedDebtIds] = useState<string[]>([]);

  useEffect(() => {
    const checkOverdueDebts = async () => {
      if (!enterprise?.id) return;

      try {
        const debts = await fetchDebts(enterprise.id, { overdue: true });
        const customers = await fetchCustomers(enterprise.id);
        const now = new Date();

        debts.forEach(debt => {
          if (!debt.settled && debt.dueDate && new Date(debt.dueDate) < now) {
            if (!notifiedDebtIds.includes(debt.id)) {
              const customer = customers.find(c => c.id === debt.customerId);
              if (customer) {
                addNotification(
                  `Dette en retard pour ${customer.name} - Montant: ${formatAmount(debt.amount)}`,
                  'warning'
                );
                setNotifiedDebtIds(prev => [...prev, debt.id]);
              }
            }
          }
        });
      } catch (error) {
        console.error('Erreur lors de la vérification des dettes:', error);
      }
    };

    const interval = setInterval(checkOverdueDebts, 60000); // Vérifie toutes les minutes
    checkOverdueDebts(); // Vérifie immédiatement au montage

    return () => clearInterval(interval);
  }, [enterprise?.id, addNotification, notifiedDebtIds, formatAmount]);

  const icons: Record<'warning' | 'error' | 'success' | 'info', JSX.Element> = {
    warning: <AlertTriangle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="flex items-center p-4 rounded-lg shadow-lg bg-white border-l-4 min-w-[300px]"
          style={{
            borderLeftColor: 
              notification.type === 'warning' ? '#f59e0b' :
              notification.type === 'error' ? '#ef4444' :
              notification.type === 'success' ? '#10b981' : '#3b82f6'
          }}
        >
          <span className="mr-3">
            {icons[notification.type as 'warning' | 'error' | 'success' | 'info']}
          </span>
          <p className="text-sm text-gray-700">{notification.message}</p>
        </div>
      ))}
    </div>
  );
}