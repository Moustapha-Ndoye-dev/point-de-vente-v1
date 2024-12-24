import { X } from 'lucide-react';
import { Sale } from '../types/types';
import { formatAmount } from '../utils/format';
import { useEffect } from 'react';

interface DebtReceiptProps {
  sale: Sale;
  onClose: () => void;
  paymentMethod: 'cash' | 'card' | 'debt';
}

export function DebtReceipt({ sale, onClose, paymentMethod }: DebtReceiptProps) {
  useEffect(() => {
    console.log("Mode de paiement:", paymentMethod);
    console.log("Est-ce une dette ?", paymentMethod === 'debt');
  }, [paymentMethod]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-8 w-full max-w-md mx-auto shadow-xl print:page-break-inside-avoid overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-red-700">Reçu de Dette</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 print:hidden" />
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <h4 className="text-base sm:text-lg font-medium text-gray-900">Détails de la dette</h4>
            <p className="text-xs sm:text-sm text-gray-700">
              Date: {new Date(sale.created_at).toLocaleString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-xs sm:text-sm text-red-600 mt-1">
              Date d'échéance: {new Date(sale.dueDate!).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="border-t border-b py-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Client</h4>
            <p className="text-base font-medium text-gray-900">{sale.customer?.name}</p>
            {sale.customer?.phone && (
              <p className="text-sm text-gray-600">{sale.customer.phone}</p>
            )}
          </div>

          <div className="overflow-x-auto">
            <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Articles</h4>
            <table className="w-full text-xs sm:text-sm text-left text-gray-700">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="px-2 sm:px-4 py-2">Produit</th>
                  <th className="px-2 sm:px-4 py-2 text-right">Qté</th>
                  <th className="px-2 sm:px-4 py-2 text-right">Prix</th>
                  <th className="px-2 sm:px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map(item => (
                  <tr key={item.productId} className="border-t">
                    <td className="px-2 sm:px-4 py-2">{item.product?.name}</td>
                    <td className="px-2 sm:px-4 py-2 text-right">{item.quantity}</td>
                    <td className="px-2 sm:px-4 py-2 text-right">{formatAmount(item.unitPrice)}</td>
                    <td className="px-2 sm:px-4 py-2 text-right">{formatAmount(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 sm:space-y-3 border-t pt-3 sm:pt-4">
            <div className="flex justify-between text-base sm:text-lg font-bold text-red-700">
              <span>Montant total de la dette</span>
              <span>{formatAmount(sale.total)}</span>
            </div>
          </div>

          <div className="flex justify-center space-x-3 sm:space-x-4 mt-4 print:hidden">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Fermer
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Imprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 