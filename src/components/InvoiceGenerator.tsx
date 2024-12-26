import { jsPDF } from 'jspdf';
import { useState, useEffect } from 'react';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Plus, Trash2, PackageSearch } from 'lucide-react';
import { getPeriodicSaleInfo } from '../data/sales';
import { UserOptions } from 'jspdf-autotable';



interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => void;
}

interface InvoiceFormData {
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  invoiceNumber: string;
  dueDate: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  deposit: number;
}

// Composant Modal pour afficher la liste des ventes
interface SalesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: { id: number; name: string; price: number }) => void;
}

function SalesListModal({ isOpen, onClose, onSelectItem }: SalesListModalProps) {
  const [sales, setSales] = useState<Array<{ id: number; name: string; price: number }>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const { enterprise } = useEnterprise();
  const enterpriseId = enterprise?.id;

  useEffect(() => {
    const fetchSales = async () => {
      if (!enterpriseId) {
        console.error('ID entreprise manquant');
        return;
      }

      const salesData = await getPeriodicSaleInfo(enterpriseId, timeRange);
      if (salesData && salesData.products) {
        setSales(salesData.products.map((product, index) => ({
          id: index,
          name: product.name,
          price: product.unitPrice
        })));
      } else {
        console.error('Aucune donnée de vente disponible');
        setSales([]);
      }
    };

    if (isOpen) {
      fetchSales();
    }
  }, [isOpen, enterpriseId, timeRange]);

  const filteredSales = sales.filter(sale =>
    sale.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center transition-opacity duration-300 ease-in-out">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg transform transition-transform duration-300 ease-in-out scale-95">
        <h2 className="text-lg font-bold mb-4">Liste des ventes</h2>
        <div className="flex justify-between mb-4">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border border-gray-300 rounded-md w-full mr-2"
          />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'today' | 'week' | 'month' | 'all')}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="all">Tout</option>
          </select>
        </div>
        <ul className="divide-y divide-gray-200">
          {filteredSales.map((sale) => (
            <li key={sale.id} className="py-2 flex justify-between items-center">
              <span className="text-gray-700 font-medium">{sale.name}</span>
              <span className="text-gray-500">{sale.price}FCFA</span>
              <button
                onClick={() => {
                  onSelectItem(sale);
                  onClose();
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white
                         bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none
                         focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                         transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Ajouter
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 w-full text-sm font-medium text-white bg-red-600
                   rounded-md hover:bg-red-700 transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

function generateUniqueInvoiceNumber(prefix: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${prefix}${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}-${random}`;
}

export function InvoiceGenerator() {
  const { enterprise } = useEnterprise();
  const { formatAmount } = useCurrency();
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    invoiceNumber: generateUniqueInvoiceNumber('FAC-'),
    dueDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    items: [],
    deposit: 0
  });
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogo(base64String);
        localStorage.setItem('companyLogo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  const handleSelectItem = (item: { id: number; name: string; price: number }) => {
    setFormData((prevData) => {
      const existingItemIndex = prevData.items.findIndex(i => i.name === item.name);
      if (existingItemIndex !== -1) {
        const updatedItems = [...prevData.items];
        const existingItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          subtotal: (existingItem.quantity + 1) * existingItem.unitPrice
        };
        return { ...prevData, items: updatedItems };
      } else {
        return {
          ...prevData,
          items: [...prevData.items, { name: item.name, quantity: 1, unitPrice: item.price, subtotal: item.price }]
        };
      }
    });
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF() as jsPDFWithAutoTable;
      // Ajout du logo et informations de l'entreprise
      if (logo) {
        doc.addImage(logo, 'JPEG', 15, 20, 30, 30);
      }
  
      // En-tête de la facture
      doc.setFontSize(20);
      doc.text('FACTURE', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
  
      // Informations de l'entreprise
      doc.setFontSize(12);
      const entrepriseInfoX = doc.internal.pageSize.getWidth() - 15;
      doc.text(enterprise?.name || '', entrepriseInfoX, 30, { align: 'right' });
      doc.text(enterprise?.address || '', entrepriseInfoX, 35, { align: 'right' });
      doc.text(enterprise?.phone || '', entrepriseInfoX, 45, { align: 'right' });
      doc.text(enterprise?.email || '', entrepriseInfoX, 50,{ align: 'right' });
      // Informations du client
      doc.text('FACTURÉ À:', 15, 70);
      doc.text(formData.customerName, 15, 75);
      doc.text(formData.customerPhone, 15, 80);
      doc.text(`N° Facture: ${formData.invoiceNumber}`, entrepriseInfoX, 70, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, entrepriseInfoX, 75, { align: 'right' });
      doc.text(`Date d'échéance: ${new Date(formData.dueDate).toLocaleDateString('fr-FR')}`, entrepriseInfoX, 80, { align: 'right' });
      doc.text(`Mode de paiement: ${
        formData.paymentMethod === 'cash' ? 'Espèces' :
        formData.paymentMethod === 'card' ? 'Mobile Money' : 'Virement'
      }`, entrepriseInfoX, 85, { align: 'right' });
      // Tableau des articles
      const tableData = formData.items.map(item => [
        item.name,
        item.quantity.toString(),
        item.unitPrice,
        item.subtotal
      ]);
  
      if (formData.deposit > 0) {
        tableData.push([
          'Acompte', 
          '1', 
         (-formData.deposit), 
          (-formData.deposit)
        ]);
      }
  
      doc.autoTable({
        startY: 100,
        head: [['Description', 'Quantité', 'Prix Unitaire(XOF)', 'Montant(XOF)']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [59, 130, 246], 
          textColor: 255,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 80, halign: 'center' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' },
          3: { cellWidth: 40, halign: 'center' }
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
          halign: 'center'
        },
        margin: { left: 10 },
        didParseCell: function(data) {
          if (data.section === 'body' && data.row.index === tableData.length - 1 && formData.deposit > 0) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [220, 53, 69];
            data.cell.styles.halign = 'center';
          }
        }
      });
  
      // Totaux
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      const total = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
      doc.setFontSize(12);
      doc.text('MONTANT TOTAL (XOF):', doc.internal.pageSize.getWidth() - 20, finalY + 10, { align: 'right' });
      doc.text(total.toString(), doc.internal.pageSize.getWidth() - 10, finalY + 10, { align: 'right' });
  
      doc.text('TOTAL À PAYER (XOF):', doc.internal.pageSize.getWidth() - 20, finalY + 17, { align: 'right' });
      doc.text((total - formData.deposit).toString(), doc.internal.pageSize.getWidth() - 10, finalY + 17, { align: 'right' });
  
      // Sauvegarde du PDF avec gestion des erreurs
      try {
        doc.save(`facture-${formData.invoiceNumber}.pdf`);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du PDF:', error);
        throw new Error('Impossible de télécharger le PDF');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  };
  
  
  



  const handleWhatsAppSend = async () => {
    try {
      // Générer le PDF
      const doc = new jsPDF() as jsPDFWithAutoTable;
      
      // Ajout du logo et informations de l'entreprise
      if (logo) {
        doc.addImage(logo, 'JPEG', 15, 20, 30, 30);
      }

      // En-tête de la facture
      doc.setFontSize(20);
      doc.text('FACTURE', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

      // Informations de l'entreprise
      doc.setFontSize(12);
      const entrepriseInfoX = doc.internal.pageSize.getWidth() - 15;
      doc.text(enterprise?.name || '', entrepriseInfoX, 30, { align: 'right' });
      doc.text(enterprise?.address || '', entrepriseInfoX, 35, { align: 'right' });
      doc.text(enterprise?.phone || '', entrepriseInfoX, 45, { align: 'right' });
      doc.text(enterprise?.email || '', entrepriseInfoX, 50, { align: 'right' });

      // Informations du client
      doc.text('FACTURÉ À:', 15, 70);
      doc.text(formData.customerName, 15, 75);
      doc.text(formData.customerPhone, 15, 80);
      doc.text(`N° Facture: ${formData.invoiceNumber}`, entrepriseInfoX, 70, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, entrepriseInfoX, 75, { align: 'right' });
      doc.text(`Date d'échéance: ${new Date(formData.dueDate).toLocaleDateString('fr-FR')}`, entrepriseInfoX, 80, { align: 'right' });
      doc.text(`Mode de paiement: ${
        formData.paymentMethod === 'cash' ? 'Espèces' :
        formData.paymentMethod === 'card' ? 'Mobile Money' : 'Virement'
      }`, entrepriseInfoX, 85, { align: 'right' });

      // Tableau des articles
      const tableData = formData.items.map(item => [
        item.name,
        item.quantity.toString(),
        item.unitPrice,
        item.subtotal
      ]);

      if (formData.deposit > 0) {
        tableData.push([
          'Acompte',
          '1',
          (-formData.deposit),
          (-formData.deposit)
        ]);
      }

      doc.autoTable({
        startY: 100,
        head: [['Description', 'Quantité', 'Prix Unitaire(XOF)', 'Montant(XOF)']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 80, halign: 'center' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' },
          3: { cellWidth: 40, halign: 'center' }
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
          halign: 'center'
        },
        margin: { left: 10 },
        didParseCell: function(data) {
          if (data.section === 'body' && data.row.index === tableData.length - 1 && formData.deposit > 0) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [220, 53, 69];
            data.cell.styles.halign = 'center';
          }
        }
      });

      // Ajout des totaux
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      const total = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
      
      doc.setFontSize(12);
      doc.text('MONTANT TOTAL (XOF):', doc.internal.pageSize.getWidth() - 20, finalY + 10, { align: 'right' });
      doc.text(total.toString(), doc.internal.pageSize.getWidth() - 10, finalY + 10, { align: 'right' });

      doc.text('TOTAL À PAYER (XOF):', doc.internal.pageSize.getWidth() - 20, finalY + 17, { align: 'right' });
      doc.text((total - formData.deposit).toString(), doc.internal.pageSize.getWidth() - 10, finalY + 17, { align: 'right' });

      // Générer le PDF comme Blob
      const pdfBlob = doc.output('blob');
      
      // Créer un fichier à partir du Blob
      const pdfFile = new File([pdfBlob], `facture-${formData.invoiceNumber}.pdf`, { type: 'application/pdf' });

      // Formater le numéro de téléphone
      const phoneNumber = formData.customerPhone.replace(/\s/g, '');
      const whatsappNumber = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
      
      // Message pour WhatsApp
      const message = `Bonjour ${formData.customerName}, voici votre facture n°${formData.invoiceNumber}`;

      // Vérifier si l'API Web Share est disponible
      if (navigator.share) {
        await navigator.share({
          files: [pdfFile],
          title: 'Facture',
          text: message
        });
      } else {
        // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi par WhatsApp:', error);
      alert('Une erreur est survenue lors de l\'envoi de la facture. Veuillez réessayer.');
    }
  };

  const handleReset = () => {
    setFormData({
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      invoiceNumber: generateUniqueInvoiceNumber('FAC-'),
      dueDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      items: [],
      deposit: 0
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 print-container">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 print-content">
        {/* En-tête */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">FACTURE</h2>
            <div className="mt-4">
              {logo && (
                <div className="mb-4">
                  <img
                    src={logo}
                    alt="Logo de l'entreprise"
                    className="h-20 object-contain print-logo"
                  />
                  <button
                    onClick={() => {
                      setLogo(null);
                      localStorage.removeItem('companyLogo');
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 print-hide"
                  >
                    Supprimer le logo
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2
                         file:px-3 file:rounded-md file:border-0 file:text-sm
                         file:font-semibold file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100 print-hide"
              />
            </div>
          </div>

          {/* Informations de l'entreprise */}
          <div className="text-right">
            <input
              type="text"
              value={enterprise?.name || ''}
              placeholder="Nom de l'entreprise"
              className="text-lg font-semibold text-right block w-full border-gray-300
                       rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              value={enterprise?.address || ''}
              placeholder="Adresse complète"
              className="mt-2 text-sm text-right block w-full border-gray-300
                       rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="tel"
              value={enterprise?.phone || ''}
              placeholder="Téléphone"
              className="mt-2 text-sm text-right block w-full border-gray-300
                       rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="email"
              value={enterprise?.email || ''}
              placeholder="Email"
              className="mt-2 text-sm text-right block border-gray-300
                       rounded-md focus:ring-blue-500 focus:border-blue-500"
              style={{ width: '150%', whiteSpace: 'normal', marginLeft: '-50%' }}
            />
          </div>
        </div>

        {/* Informations du client */}
        <div className="mt-8 grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">FACTURÉ À</h3>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              placeholder="Nom du client"
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500
                       focus:border-blue-500"
            />
            {/* Adresse du client retirée */}
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
              placeholder="Numéro du client"
              className="mt-2 block w-full border-gray-300 rounded-md focus:ring-blue-500
                       focus:border-blue-500"
            />
          </div>

          <div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  N° Facture :
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    readOnly
                    className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md 
                             focus:ring-blue-500 focus:border-blue-500 cursor-not-allowed"
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500
                           focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mode de paiement
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentMethod: e.target.value as 'cash' | 'card' | 'transfer'
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500
                           focus:border-blue-500"
                >
                  <option value="cash">Espèces</option>
                  <option value="card">Mobile Money</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des articles */}
        <div className="mt-8 print-no-break">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Articles</h3>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un article
            </button>
          </div>
          <div className="bg-blue-500 rounded-lg shadow-sm border border-blue-100">
            <div className="overflow-x-auto">
              {/* Table pour desktop */}
              <table className="hidden md:table min-w-full divide-y divide-blue-200">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                      Prix Unitaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items.length > 0 ? (
                    formData.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQuantity = Number(e.target.value);
                              if (newQuantity > 0) {
                                setFormData(prevData => {
                                  const newItems = [...prevData.items];
                                  newItems[index].quantity = newQuantity;
                                  newItems[index].subtotal = newQuantity * newItems[index].unitPrice;
                                  return { ...prevData, items: newItems };
                                });
                              }
                            }}
                            className="w-20 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatAmount(item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatAmount(item.subtotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setFormData(prevData => ({
                                ...prevData,
                                items: prevData.items.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        Aucun article ajouté à la facture.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Vue mobile en cards */}
              <div className="md:hidden space-y-3">
                {formData.items.length > 0 ? (
                  formData.items.map((item, index) => (
                    <div 
                      key={index} 
                      className="bg-gradient-to-r from-blue-50 to-white rounded-lg shadow-sm p-4 border border-blue-100"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-base font-semibold text-blue-900">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => {
                            setFormData(prevData => ({
                              ...prevData,
                              items: prevData.items.filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-2 rounded-md border border-blue-100">
                          <label className="text-xs font-medium text-blue-600 block mb-1">
                            Quantité
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQuantity = Number(e.target.value);
                              if (newQuantity > 0) {
                                setFormData(prevData => {
                                  const newItems = [...prevData.items];
                                  newItems[index].quantity = newQuantity;
                                  newItems[index].subtotal = newQuantity * newItems[index].unitPrice;
                                  return { ...prevData, items: newItems };
                                });
                              }
                            }}
                            className="w-full border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>

                        <div className="bg-white p-2 rounded-md border border-blue-100">
                          <label className="text-xs font-medium text-blue-600 block mb-1">
                            Prix unitaire
                          </label>
                          <div className="text-sm font-medium text-gray-900">
                            {formatAmount(item.unitPrice)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 bg-blue-50 p-2 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-blue-700">Total</span>
                          <span className="text-sm font-bold text-blue-900">
                            {formatAmount(item.subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <PackageSearch className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Aucun article ajouté à la facture</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Totaux */}
        <div className="mt-8 md:flex md:justify-end print-no-break">
          <div className="w-full md:w-64 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Montant total</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatAmount(formData.items.reduce((sum, item) => sum + item.subtotal, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Acompte</span>
                  <input
                    type="number"
                    value={formData.deposit}
                    onChange={(e) => setFormData({...formData, deposit: Number(e.target.value)})}
                    className="w-32 text-right border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-base font-bold text-gray-900">Total à payer</span>
                  <span className="text-base font-bold text-blue-600">
                    {formatAmount(
                      formData.items.reduce((sum, item) => sum + item.subtotal, 0) - formData.deposit
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:justify-end">
              <button
                onClick={handleWhatsAppSend}
                className="w-full md:w-auto px-4 py-2.5 text-sm font-medium text-white bg-green-600 
                         rounded-md hover:bg-green-700 flex items-center justify-center"
              >
                <span>Envoyer par WhatsApp</span>
              </button>
              <button
                onClick={handleReset}
                className="w-full md:w-auto px-4 py-2.5 text-sm font-medium text-white bg-red-600
                         rounded-md hover:bg-red-700 flex items-center justify-center"
              >
                <span>Réinitialiser</span>
              </button>
              <button
                onClick={generatePDF}
                className="w-full md:w-auto px-4 py-2.5 text-sm font-medium text-white bg-blue-600
                         rounded-md hover:bg-blue-700 flex items-center justify-center"
              >
                <span>Télécharger PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour la liste des ventes */}
      <SalesListModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onSelectItem={handleSelectItem}
      />
    </div>
  );
}
