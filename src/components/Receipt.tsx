import { X } from 'lucide-react';
import { Sale } from '../types/types';
import { formatAmount } from '../utils/format';

interface ReceiptProps {
  sale: Sale;
  onClose: () => void;
}

export function Receipt({ sale, onClose }: ReceiptProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-8 w-full max-w-md mx-auto shadow-xl print:page-break-inside-avoid overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-indigo-700">Ticket</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <h4 className="text-base sm:text-lg font-medium text-gray-900">Détails de la vente</h4>
            <p className="text-xs sm:text-sm text-gray-700">
              Date: {new Date(sale.created_at).toLocaleString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
</p>          </div>

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
                {sale.items && sale.items.length > 0 ? (
                  sale.items.map(item => (
                    <tr key={item.productId} className="border-t">
                      <td className="px-2 sm:px-4 py-2">{item.product?.name || `Produit ID: ${item.productId}`}</td>
                      <td className="px-2 sm:px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-2 sm:px-4 py-2 text-right">{formatAmount(item.unitPrice)}</td>
                      <td className="px-2 sm:px-4 py-2 text-right">{formatAmount(item.subtotal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 text-center">
                      Aucun article
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 sm:space-y-3 border-t pt-3 sm:pt-4">
            <div className="flex justify-between text-base sm:text-lg font-medium text-gray-900">
              <span>Total</span>
              <span>{formatAmount(sale.total)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm text-gray-700">
              <span>Montant payé</span>
              <span>{formatAmount(sale.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm text-gray-700">
              <span>Monnaie</span>
              <span>{sale.paymentMethod === 'debt' ? formatAmount(0) : formatAmount(sale.remaining_amount)}</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs sm:text-sm text-gray-600 print:hidden">Merci à bientôt!</p>
            <div className="flex justify-center space-x-3 sm:space-x-4 mt-4 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none"
              >
                Imprimer
              </button>
              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}