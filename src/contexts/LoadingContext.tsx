import { createContext, useContext, useState } from 'react';

const LoadingContext = createContext<{
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}>({
  isLoading: false,
  setIsLoading: () => {}
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export const useLoading = () => useContext(LoadingContext); 