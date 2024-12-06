import { X } from 'lucide-react';
import { Sale } from '../types/types';
import { formatAmount } from '../utils/format';

interface ReceiptProps {
  sale: Sale;
  onClose: () => void;
}

export function Receipt({ sale, onClose }: ReceiptProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl print:page-break-inside-avoid">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-indigo-700">Ticket</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Détails de la vente</h4>
            <p className="text-sm text-gray-700">Date: {new Date(sale.created_at).toLocaleString()}</p>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">Articles</h4>
            <table className="w-full text-sm text-left text-gray-700 mt-2">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Produit</th>
                  <th className="px-4 py-2 text-right">Quantité</th>
                  <th className="px-4 py-2 text-right">Prix unitaire</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items && sale.items.length > 0 ? (
                  sale.items.map(item => (
                    <tr key={item.product_id} className="border-t">
                      <td className="px-4 py-2">{item.product?.name || `Produit ID: ${item.product_id}`}</td>
                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">{formatAmount(item.unit_price)}</td>
                      <td className="px-4 py-2 text-right">{formatAmount(item.subtotal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-sm text-gray-700 text-center">Aucun article</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between text-lg font-medium text-gray-900">
            <span>Total</span>
            <span>{formatAmount(sale.total)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-700">
            <span>Montant payé</span>
            <span>{formatAmount(sale.paid_amount)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-700">
            <span>Monnaie</span>
            <span>{sale.payment_method === 'debt' ? formatAmount(0) : formatAmount(sale.remaining_amount)}</span>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 print:hidden">Merci à bientôt!</p> {/* Ajout de print:hidden */}
            <div className="flex justify-center space-x-4 mt-4 print:hidden"> {/* Ajout de print:hidden */}
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none"
              >
                Imprimer
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none"
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