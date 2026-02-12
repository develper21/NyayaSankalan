import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import toast from 'react-hot-toast';

interface NotificationToastProps {
    enabled?: boolean;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
    enabled = true,
}) => {
    const { notifications, unreadCount } = useNotifications();
    const previousUnreadCountRef = useRef(unreadCount);
    const shownNotificationsRef = useRef(new Set<string>());

    useEffect(() => {
        if (!enabled) return;

        // Check for new notifications
        const newNotifications = notifications.filter(
            (n) => !n.isRead && !shownNotificationsRef.current.has(n.id)
        );

        // Show toast for new notifications
        newNotifications.forEach((notification) => {
            shownNotificationsRef.current.add(notification.id);

            const getIcon = (type: string) => {
                switch (type) {
                    case 'WARNING':
                        return '⚠️';
                    case 'ACTION':
                        return '📋';
                    case 'INFO':
                    default:
                        return 'ℹ️';
                }
            };

            const getToastType = (type: string) => {
                switch (type) {
                    case 'WARNING':
                        return 'error';
                    case 'ACTION':
                        return 'success';
                    case 'INFO':
                    default:
                        return 'default';
                }
            };

            // Show toast notification
            const toastType = getToastType(notification.type);
            const message = (
                <div className="flex items-start gap-3">
                    <span className="text-2xl">{getIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                    </div>
                </div>
            );

            if (toastType === 'error') {
                toast.error(message, {
                    duration: 6000,
                    position: 'top-right',
                    style: {
                        maxWidth: '400px',
                    },
                });
            } else if (toastType === 'success') {
                toast.success(message, {
                    duration: 5000,
                    position: 'top-right',
                    style: {
                        maxWidth: '400px',
                    },
                });
            } else {
                toast(message, {
                    duration: 4000,
                    position: 'top-right',
                    icon: getIcon(notification.type),
                    style: {
                        maxWidth: '400px',
                    },
                });
            }
        });

        // Update previous count
        previousUnreadCountRef.current = unreadCount;
    }, [notifications, unreadCount, enabled]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            shownNotificationsRef.current.clear();
        };
    }, []);

    return null; // This component doesn't render anything
};
