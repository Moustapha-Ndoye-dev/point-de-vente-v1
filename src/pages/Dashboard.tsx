import { useState, useMemo, useEffect } from 'react';
import { BanknoteIcon, Package, TrendingUp, Users } from 'lucide-react';
import { Sale, Debt, Product } from '../types/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useCurrency } from '../contexts/CurrencyContext';
import { fetchSalesHistory, fetchDailyItemsSold, fetchMonthlyItemsSold, fetchDailySalesTotal, fetchMonthlySalesTotal } from '../data/sales';
import { fetchDebts } from '../data/debts';
import { fetchTotalCustomers } from '../data/clients';
import { fetchProducts } from '../data/products';

type TimeRange = 'day' | 'month';

export function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const { formatAmount } = useCurrency();
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [itemsSold, setItemsSold] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const salesFromDB = await fetchSalesHistory();
      const debtsFromDB = await fetchDebts({});
      const totalCustomersFromDB = await fetchTotalCustomers();
      const itemsSoldFromDB = timeRange === 'day' ? await fetchDailyItemsSold() : await fetchMonthlyItemsSold();
      const totalSalesFromDB = timeRange === 'day' ? await fetchDailySalesTotal() : await fetchMonthlySalesTotal();
      const productsFromDB = await fetchProducts();

      setSales(salesFromDB);
      setDebts(debtsFromDB);
      setTotalCustomers(totalCustomersFromDB);
      setItemsSold(itemsSoldFromDB);
      setTotalSales(totalSalesFromDB);
      setProducts(productsFromDB);
    };
    loadData();
  }, [timeRange]);

  const stats = useMemo(() => {
    const now = new Date();
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      if (timeRange === 'day') {
        return saleDate.toDateString() === now.toDateString();
      } else {
        return saleDate.getMonth() === now.getMonth() && 
               saleDate.getFullYear() === now.getFullYear();
      }
    });

    const filteredDebts = debts.filter(debt => {
      const debtDate = new Date(debt.createdAt); // Changed created_at to createdAt
      if (timeRange === 'day') {
        return debtDate.toDateString() === now.toDateString();
      } else {
        return debtDate.getMonth() === now.getMonth() && 
               debtDate.getFullYear() === now.getFullYear();
      }
    });

    const uniqueCustomers = new Set(filteredSales.map(sale => sale.customer_id)).size;
    
    // Calculate total, pending and overdue debts
    const totalDebts = filteredDebts.reduce((sum, debt) => sum + (debt.settled ? 0 : debt.amount), 0);
    const totalOverdueDebts = filteredDebts.reduce((sum, debt) => {
      if (!debt.settled && new Date(debt.dueDate) < now) { // Changed due_date to dueDate
        return sum + debt.amount;
      }
      return sum;
    }, 0);

    // Get payment method distribution
    const paymentMethods = filteredSales.reduce((acc: Record<string, number>, sale) => {
      acc[sale.payment_method] = (acc[sale.payment_method] || 0) + sale.total;
      return acc;
    }, {});

    // Get previous period stats for comparison
    const previousPeriodSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      if (timeRange === 'day') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return saleDate.toDateString() === yesterday.toDateString();
      } else {
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return saleDate.getMonth() === lastMonth.getMonth() &&
               saleDate.getFullYear() === lastMonth.getFullYear();
      }
    });

    const previousTotal = previousPeriodSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalChange = previousTotal ? ((totalSales - previousTotal) / previousTotal) * 100 : 0;

    return {
      totalSales,
      numberOfSales: filteredSales.length,
      itemsSold,
      uniqueCustomers,
      totalDebts,
      overdueDebts: totalOverdueDebts,
      totalChange,
      paymentMethods,
      recentSales: [...filteredSales].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 5),
      totalCustomers // Ensure totalCustomers is included in the stats
    };
  }, [sales, timeRange, debts, itemsSold, totalSales, totalCustomers]);

  const chartData = useMemo(() => {
    const groupedSales = sales.reduce((acc: Record<string, number>, sale) => {
      const date = new Date(sale.date);
      const key = timeRange === 'day' 
        ? `${date.getHours()}:00`
        : `${date.getDate()}/${date.getMonth() + 1}`;
      acc[key] = (acc[key] || 0) + sale.total;
      return acc;
    }, {});

    return Object.entries(groupedSales).map(([label, value]) => ({
      label,
      value
    }));
  }, [sales, timeRange]);

  const productStockData = useMemo(() => {
    return products.map(product => ({
      name: product.name,
      stock: product.stock
    }));
  }, [products]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              timeRange === 'day'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Jour
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              timeRange === 'month'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mois
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventes totales</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {formatAmount(stats.totalSales)}
              </h3>
            </div>
          </div>
          <div className="mt-4">
            <TrendingUp className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Articles vendus</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.itemsSold}
              </h3>
            </div>
          </div>
          <div className="mt-4">
            <Package className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Dettes à recouvrer</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {formatAmount(stats.totalDebts)}
              </h3>
              <p className="text-sm text-red-600 mt-1">
                {formatAmount(stats.overdueDebts)} en retard
              </p>
            </div>
          </div>
          <div className="mt-4">
            <BanknoteIcon className="w-8 h-8 text-red-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalCustomers}
              </h3>
            </div>
          </div>
          <div className="mt-4">
            <Users className="w-8 h-8 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Evolution des ventes
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => formatAmount(value as number)} />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Stock des produits
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productStockData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}