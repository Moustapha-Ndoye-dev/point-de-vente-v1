// NotificationContext.tsx

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Mémoïser la fonction de suppression pour stabilité
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Mémoïser la fonction d'ajout pour stabilité et gestion des timers
  const addNotification = useCallback((message: string, type: Notification['type']) => {
    const id = uuidv4();
    const newNotification: Notification = {
      id,
      message,
      type,
      createdAt: new Date(),
    };

    // Vérification plus stricte des doublons
    setNotifications((prev) => {
      // Vérifier si une notification identique existe déjà et a moins de 2 secondes
      const isDuplicate = prev.some(
        (notification) => 
          notification.message === message && 
          notification.type === type &&
          new Date().getTime() - notification.createdAt.getTime() < 2000
      );

      if (isDuplicate) {
        return prev;
      }
      return [newNotification, ...prev];
    });

    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
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