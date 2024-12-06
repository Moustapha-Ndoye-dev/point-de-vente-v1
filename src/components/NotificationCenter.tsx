import { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { Debt } from '../types/types';

export function NotificationCenter() {
  const { notifications, removeNotification, addNotification } = useNotifications();

  // Check for overdue debts every minute
  useEffect(() => {
    const checkOverdueDebts = () => {
      const debts: Debt[] = JSON.parse(localStorage.getItem('debts') || '[]');
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const now = new Date();

      debts.forEach(debt => {
        if (!debt.settled && new Date(debt.dueDate) < now) { // Changed due_date to dueDate
          const customer = customers.find((c: any) => c.id === debt.customerId); // Changed customer_id to customerId
          addNotification(
            `Dette en retard pour ${customer?.name || 'Client inconnu'} - Montant: ${debt.amount} FCFA`,
            'warning'
          );
        }
      });
    };

    // Check immediately and then every minute
    checkOverdueDebts();
    const interval = setInterval(checkOverdueDebts, 60000);

    return () => clearInterval(interval);
  }, [addNotification]);

  const icons = {
    warning: <AlertTriangle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    error: 'bg-red-50 text-red-600 border-red-200',
    success: 'bg-green-50 text-green-600 border-green-200',
    info: 'bg-blue-50 text-blue-600 border-blue-200',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center p-4 rounded-lg border shadow-lg ${colors[notification.type]}`}
        >
          <div className="flex-shrink-0">
            {icons[notification.type]}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-4 flex-shrink-0 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
}