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

    // Check for duplicate notifications
    setNotifications((prev) => {
      const isDuplicate = prev.some(
        (notification) => notification.message === message && notification.type === type
      );
      if (isDuplicate) {
        return prev;
      }
      return [newNotification, ...prev];
    });

    // Supprimer la notification après 3 secondes
    setTimeout(() => {
      removeNotification(id);
    }, 3000);
  }, [removeNotification]);

  const getBgColor = (type: Notification['type']) => {
    switch(type) {
      case 'error':
        return 'bg-red-100 border border-red-400 text-red-700';
      case 'warning':
        return 'bg-yellow-100 border border-yellow-400 text-yellow-700';
      case 'success':
        return 'bg-green-100 border border-green-400 text-green-700';
      case 'info':
      default:
        return 'bg-blue-100 border border-blue-400 text-blue-700';
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      {/* Optionnel : Composant pour afficher les notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg ${getBgColor(notification.type)}`}
          >
            {notification.message}
          </div>
        ))}
      </div>
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