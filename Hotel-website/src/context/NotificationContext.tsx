import React, { createContext, useContext, useEffect, useState } from "react";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "offer" | "booking" | "alert";
  link?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (notification: Omit<NotificationItem, "id" | "time" | "read">) => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Welcome to Hotel Luxury Stay!",
    message: "Thank you for visiting. Explore our premier rooms and world-class luxury amenities.",
    time: "10 mins ago",
    read: false,
    type: "info",
    link: "/about",
  },
  {
    id: "notif-2",
    title: "Special Weekend Offer: 20% Off",
    message: "Book any Executive Suite or Deluxe Lake View room this weekend and get complimentary spa access.",
    time: "2 hours ago",
    read: false,
    type: "offer",
    link: "/offers",
  },
  {
    id: "notif-3",
    title: "Gourmet Dining Reservation Open",
    message: "Reserve a table at our Michelin-inspired restaurant for an unforgettable evening.",
    time: "1 day ago",
    read: true,
    type: "booking",
    link: "/services",
  },
];

const STORAGE_KEY = "hotel_notifications_items";

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = (notif: Omit<NotificationItem, "id" | "time" | "read">) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      time: "Just now",
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
