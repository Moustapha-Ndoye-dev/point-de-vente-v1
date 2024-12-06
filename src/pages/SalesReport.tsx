import { useState, useMemo, useEffect } from 'react';
import { Menu } from '@headlessui/react';
import { Calendar, Download, Search, DollarSign, Package, Box, Star } from 'lucide-react';
import { Sale, Customer } from '../types/types';
import { useCurrency } from '../contexts/CurrencyContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from '../components/Pagination';
import { fetchAllSales, fetchDailyItemsSold, fetchMonthlyItemsSold } from '../data/sales';
import { fetchCustomers } from '../data/clients';
import { fetchProducts } from '../data/products';

type TimeRange = 'today' | 'week' | 'month' | 'all';

export function SalesReport() {
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const { formatAmount } = useCurrency();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalItemsSold, setTotalItemsSold] = useState<number>(0);
  const [totalProductsInStock, setTotalProductsInStock] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5); // Set initial items per page to 5

  useEffect(() => {
    const loadData = async () => {
      let salesFromDB: Sale[] = [];
      let totalItemsSoldFromDB: number = 0;
      switch (timeRange) {
        case 'today':
          salesFromDB = await fetchAllSales();
          totalItemsSoldFromDB = await fetchDailyItemsSold();
          break;
        case 'month':
          salesFromDB = await fetchAllSales();
          totalItemsSoldFromDB = await fetchMonthlyItemsSold();
          break;
        default:
          salesFromDB = await fetchAllSales();
          totalItemsSoldFromDB = salesFromDB.reduce((sum, sale) => sum + sale.items.reduce((acc, item) => acc + item.quantity, 0), 0);
          break;
      }

      const customersFromDB = await fetchCustomers();
      const productsFromDB = await fetchProducts();

      console.log('Sales from DB:', salesFromDB);
      console.log('Customers from DB:', customersFromDB);
      console.log('Total items sold from DB:', totalItemsSoldFromDB);
      console.log('Products from DB:', productsFromDB);

      setSales(salesFromDB);
      setCustomers(customersFromDB);
      setTotalItemsSold(totalItemsSoldFromDB);
      setTotalProductsInStock(productsFromDB.reduce((sum, product) => sum + product.stock, 0));
    };
    loadData();
  }, [timeRange]);

  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      const matchesTimeRange = (() => {
        switch (timeRange) {
          case 'today':
            return saleDate.toDateString() === now.toDateString();
          case 'week': {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return saleDate >= weekAgo;
          }
          case 'month':
            return saleDate.getMonth() === now.getMonth() && 
                   saleDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      })();

      // Filter by search term (e.g., customer name)
      const matchesSearch = searchTerm.trim() === '' || 
        customers.find(c => c.id === sale.customer_id)?.name.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesTimeRange && matchesSearch;
    });
  }, [sales, timeRange, searchTerm, customers]);

  const combinedSales = useMemo(() => {
    const productMap = new Map<string, { name: string, quantity: number, unit_price: number, subtotal: number }>();

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.product) {
          if (productMap.has(item.product.id)) {
            const existing = productMap.get(item.product.id)!;
            existing.quantity += item.quantity;
            existing.subtotal += item.subtotal;
          } else {
            productMap.set(item.product.id, {
              name: item.product.name ?? 'Unknown Product',
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal
            });
          }
        }
      });
    });

    return Array.from(productMap.values());
  }, [filteredSales]);

  const totalPages = Math.ceil(combinedSales.length / itemsPerPage);
  const currentSales = combinedSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const grandTotal = useMemo(() => {
    return combinedSales.reduce((sum, item) => sum + item.subtotal, 0);
  }, [combinedSales]);

  const bestSellingProduct = useMemo(() => {
    if (combinedSales.length === 0) return null;
    return combinedSales.reduce((max, item) => item.quantity > max.quantity ? item : max);
  }, [combinedSales]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Produit", "Quantité", "Prix Initial", "Total"];
    const tableRows = combinedSales.map(item => [
      item.name,
      item.quantity,
      formatAmount(item.unit_price),
      formatAmount(item.subtotal)
    ]);

    doc.text("Rapport des ventes", 14, 15);
    doc.text(`Période: ${timeRange}`, 14, 25);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    doc.text(`Grand Total: ${formatAmount(grandTotal)}`, 14, (doc as any).lastAutoTable.finalY + 10);

    doc.save("rapport-ventes.pdf");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Rapport des ventes</h2>
        <div className="flex flex-wrap gap-2">
          <Menu as="div" className="relative">
            <Menu.Button className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              <Calendar className="w-4 h-4 mr-2" />
              {timeRange === 'today' ? 'Aujourd\'hui' :
               timeRange === 'week' ? '7 derniers jours' :
               timeRange === 'month' ? 'Ce mois' : 'Toute période'}
            </Menu.Button>
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="py-1">
                {['today', 'week', 'month', 'all'].map((range) => (
                  <Menu.Item key={range}>
                    {({ active }) => (
                      <button
                        onClick={() => setTimeRange(range as TimeRange)}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block px-4 py-2 text-sm w-full text-left`}
                      >
                        {range === 'today' ? 'Aujourd\'hui' :
                         range === 'week' ? '7 derniers jours' :
                         range === 'month' ? 'Ce mois' : 'Toute période'}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Menu>

          <button
            onClick={exportPDF}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </button>
        </div>
      </div>

      <div className="flex mb-4">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Rechercher par produit..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total des ventes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatAmount(grandTotal)}  
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Articles vendus</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalItemsSold}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Sur la période sélectionnée
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Produits en stock</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalProductsInStock}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl">
              <Box className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Total des produits en stock
          </div>
        </div>
      </div>

      {bestSellingProduct && (
        <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Meilleur produit vendu</p>
              <p className="mt-2 text-3xl font-bold text-yellow-900">
                {bestSellingProduct.name}
              </p>
              <p className="mt-1 text-lg text-yellow-700">
                Quantité vendue: {bestSellingProduct.quantity}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-xl">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix Initial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentSales.length > 0 ? (
                currentSales.map((item) => (
                  <tr key={item.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(item.unit_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(item.subtotal)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Aucune vente disponible pour la période sélectionnée.
                  </td>
                </tr>
              )}
              {currentSales.length > 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    Grand Total:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatAmount(grandTotal)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              itemsPerPageOptions={[5, 10, 20, 50]} // Add 5 to the options
            />
          </div>
        )}
      </div>
    </div>
  );
}