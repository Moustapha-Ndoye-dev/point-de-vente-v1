import { createContext, useContext, useState, useEffect } from 'react';

type Currency = {
  code: string;
  symbol: string;
  rate: number; // Exchange rate relative to EUR
};

const currencies: Currency[] = [
  { code: 'XOF', symbol: 'FCFA', rate: 655.957 },
  { code: 'EUR', symbol: '€', rate: 1 },
  { code: 'USD', symbol: '$', rate: 1.09 },
];

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (code: string) => void;
  formatAmount: (amount: number) => string;
  convertAmount: (amount: number) => number;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// FCFA is now the default currency
const DEFAULT_CURRENCY = currencies[0]; // XOF (FCFA)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency');
    if (saved) {
      const foundCurrency = currencies.find(c => c.code === saved);
      return foundCurrency || DEFAULT_CURRENCY;
    }
    return DEFAULT_CURRENCY;
  });

  useEffect(() => {
    localStorage.setItem('currency', currency.code);
  }, [currency]);

  const setCurrency = (code: string) => {
    const newCurrency = currencies.find(c => c.code === code);
    if (newCurrency) {
      setCurrencyState(newCurrency);
    }
  };

  const formatAmount = (amount: number) => {
    // Convert the amount to the target currency
    const convertedAmount = (amount * currency.rate) / DEFAULT_CURRENCY.rate;
    
    if (currency.code === 'XOF') {
      // For FCFA, show without decimal places and group thousands
      return `${Math.round(convertedAmount).toLocaleString('fr-FR')} ${currency.symbol}`;
    }
    
    // For other currencies, show with 2 decimal places
    return `${convertedAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ${currency.symbol}`;
  };

  const convertAmount = (amount: number) => {
    // Convert from FCFA (base currency) to target currency
    return (amount * currency.rate) / DEFAULT_CURRENCY.rate;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, convertAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}