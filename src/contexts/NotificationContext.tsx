// NotificationContext.tsx

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is installed and imported

export interface Notification {
  id: string;
  message: string;
  type: 'warning' | 'error' | 'success' | 'info';
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: Notification['type']) => void;
  removeNotification: (id: string) => void;
  isMobile: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((message: string, type: Notification['type']) => {
    const id = uuidv4();
    const newNotification: Notification = {
      id,
      message,
      type,
      createdAt: new Date(),
    };

    setNotifications((prev) => {
      const isDuplicate = prev.some(
        (notification) => 
          notification.message === message && 
          notification.type === type &&
          new Date().getTime() - notification.createdAt.getTime() < 2000
      );

      if (isDuplicate) return prev;
      
      // Limiter le nombre de notifications sur mobile
      const maxNotifications = isMobile ? 3 : 5;
      const updatedNotifications = [newNotification, ...prev];
      return updatedNotifications.slice(0, maxNotifications);
    });

    // Durée plus courte sur mobile
    const duration = isMobile ? 3000 : 5000;
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }, [removeNotification, isMobile]);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        addNotification, 
        removeNotification,
        isMobile 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}