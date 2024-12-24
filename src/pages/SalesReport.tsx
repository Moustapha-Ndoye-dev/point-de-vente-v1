import { useState, useMemo, useEffect } from 'react';
import { Menu } from '@headlessui/react';
import { Calendar, Download, DollarSign, Package, Box, Star } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from '../components/Pagination';
import { getPeriodicSaleInfo } from '../data/sales';
import { fetchProducts } from '../data/products';
import { useEnterprise } from '../contexts/EnterpriseContext';

type TimeRange = 'today' | 'week' | 'month' | 'all';

export function SalesReport() {
  const { enterprise } = useEnterprise();
  const enterpriseId = enterprise?.id;
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const { formatAmount } = useCurrency();
  const [salesInfo, setSalesInfo] = useState<any[]>([]);
  const [totalItemsSold, setTotalItemsSold] = useState<number>(0);
  const [totalProductsInStock, setTotalProductsInStock] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  useEffect(() => {
    const loadData = async () => {
      if (!enterpriseId) {
        console.error('ID entreprise manquant');
        return;
      }

      try {
        const [productsFromDB, periodicSalesInfo] = await Promise.all([
          fetchProducts(enterpriseId),
          getPeriodicSaleInfo(enterpriseId, timeRange)
        ]);

        const totalInStock = productsFromDB.reduce((sum, product) => sum + (product.stock || 0), 0);
        setTotalProductsInStock(totalInStock);

        if (periodicSalesInfo) {
          setTotalSales(periodicSalesInfo.saleTotal);
          setSalesInfo([periodicSalesInfo]);
          setTotalItemsSold(periodicSalesInfo.totalItemsSold);
        } else {
          setTotalSales(0);
          setSalesInfo([]);
          setTotalItemsSold(0);
        }

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setTotalSales(0);
        setSalesInfo([]);
        setTotalItemsSold(0);
      }
    };

    loadData();
  }, [timeRange, enterpriseId]);

  const combinedSales = useMemo(() => {
    if (!enterpriseId || !salesInfo.length) {
      console.log('Pas de ventes filtrées');
      return [];
    }
    
    const productMap = new Map<string, { 
      name: string, 
      quantity: number, 
      unitPrice: number, 
      subtotal: number 
    }>();

    salesInfo.forEach((info: { products: Array<{ name: string; quantity: number; unitPrice: number; total: number }> }) => {
      info.products.forEach((product) => {
        const productId = product.name; // Assuming name is unique for simplicity
        if (productMap.has(productId)) {
          const existing = productMap.get(productId)!;
          existing.quantity += product.quantity;
          existing.subtotal += product.total;
        } else {
          productMap.set(productId, {
            name: product.name,
            quantity: product.quantity,
            unitPrice: product.unitPrice,
            subtotal: product.total
          });
        }
      });
    });

    console.log('Résultat des ventes combinées:', Array.from(productMap.values()));
    return Array.from(productMap.values());
  }, [salesInfo, enterpriseId]);

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
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;

    // En-tête avec dégradé
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Titre principal
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    const title = "Rapport des ventes";
    const titleWidth = doc.getStringUnitWidth(title) * doc.getFontSize() / doc.internal.scaleFactor;
    doc.text(title, (pageWidth - titleWidth) / 2, 25);

    // Sous-titre avec la période
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const period = timeRange === 'today' ? 'Aujourd\'hui' :
                  timeRange === 'week' ? '7 derniers jours' :
                  timeRange === 'month' ? 'Ce mois' : 'Toute période';
    const subtitle = `Période : ${period}`;
    const subtitleWidth = doc.getStringUnitWidth(subtitle) * doc.getFontSize() / doc.internal.scaleFactor;
    doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 35);

    // Statistiques principales dans des boîtes
    const statsY = 60;
    const boxWidth = (pageWidth - (2 * margin) - 20) / 3;
    const boxHeight = 30;

    // Fonction pour dessiner une boîte de statistique
    const drawStatBox = (x: number, title: string, value: string, index: number) => {
      const colors = ['#EFF6FF', '#F0FDF4'];
      const textColors = ['#1D4ED8', '#047857'];
      
      doc.setFillColor(colors[index]);
      doc.roundedRect(x, statsY, boxWidth, boxHeight, 3, 3, 'F');
      
      doc.setTextColor(textColors[index]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(title, x + 5, statsY + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(value, x + 5, statsY + 22);
    };

    drawStatBox(margin, "Total des ventes", formatAmount(totalSales), 0);
    drawStatBox(margin + boxWidth + 10, "Articles vendus", totalItemsSold.toString(), 1);

    // Tableau des ventes avec style amélioré
    autoTable(doc, {
      head: [["Produit", "Quantité", "Prix Initial", "Total"]],
      body: combinedSales.map(item => [
        item.name,
        item.quantity,
        formatAmount(item.unitPrice),
        formatAmount(item.subtotal)
      ]),
      startY: statsY + boxHeight + 20,
      styles: {
        fontSize: 10,
        cellPadding: 6,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
    });

    // Grand Total avec style amélioré
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(pageWidth - 90, finalY, 75, 25, 3, 3, 'F');
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("TOTAL", pageWidth - 85, finalY + 10);
    doc.setFontSize(14);
    doc.text(formatAmount(grandTotal), pageWidth - 85, finalY + 20);

    // Meilleur produit si disponible
    if (bestSellingProduct) {
      const bestY = finalY + 40;
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(margin, bestY, pageWidth - (2 * margin), 30, 3, 3, 'F');
      doc.setTextColor(161, 98, 7);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Meilleur produit", margin + 10, bestY + 10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`${bestSellingProduct.name} (${bestSellingProduct.quantity} unités)`, margin + 10, bestY + 22);
    }

    // Pied de page
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('CONFIDENTIEL', margin, pageHeight - 10);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Page 1/${doc.getNumberOfPages()}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

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
            <Menu.Items className="absolute right-0 z-50 mt-2 w-full sm:w-56 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg max-h-[80vh] overflow-y-auto">
              <div className="py-1">
                {['today', 'week', 'month', 'all'].map((range) => (
                  <Menu.Item key={range}>
                    {({ active }) => (
                      <button
                        onClick={() => setTimeRange(range as TimeRange)}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block px-4 py-3 sm:py-2 text-base sm:text-sm w-full text-left`}
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
                {formatAmount(totalSales)}  
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
          {/* Table pour desktop */}
          <table className="hidden md:table min-w-full divide-y divide-gray-200">
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
                      {formatAmount(item.unitPrice)}
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
            </tbody>
          </table>

          {/* Vue mobile en cards */}
          <div className="md:hidden">
            {currentSales.length > 0 ? (
              currentSales.map((item) => (
                <div key={item.name} className="border-b border-gray-200 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                    <span className="text-sm font-bold text-gray-900">
                      {formatAmount(item.subtotal)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Quantité:</span>
                      <span className="ml-2">{item.quantity}</span>
                    </div>
                    <div>
                      <span className="font-medium">Prix unitaire:</span>
                      <span className="ml-2">{formatAmount(item.unitPrice)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-sm text-gray-500 text-center">
                Aucune vente disponible pour la période sélectionnée.
              </div>
            )}

            {currentSales.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Grand Total:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatAmount(grandTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              itemsPerPageOptions={[5, 10, 20, 50]}
            />
          </div>
        )}
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Grand Total</span>
          <span className="text-lg font-bold text-gray-900">{formatAmount(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}