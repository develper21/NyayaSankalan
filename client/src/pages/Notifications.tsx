import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { useNotifications } from '../context/NotificationContext';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/common/Loader';

export const Notifications: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllRead, refresh } = useNotifications();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const getRoleBasePath = () => {
    switch (user?.role) {
      case 'JUDGE':
        return '/judge';
      case 'COURT_CLERK':
        return '/court';
      case 'SHO':
        return '/sho';
      case 'POLICE':
      default:
        return '/police';
    }
  };

  const handleNotificationClick = (n: any) => {
    markAsRead(n.id);
    const basePath = getRoleBasePath();
    nav(`${basePath}/cases/${n.relatedCaseId}`);
  };

  const list = filter === 'ALL' ? notifications : notifications.filter((n) => !n.isRead);

  const getNotificationIcon = (type: string) => {
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

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACTION':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'INFO':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Header
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setFilter(filter === 'ALL' ? 'UNREAD' : 'ALL')}
              className="flex items-center gap-2"
            >
              {filter === 'ALL' ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Show Unread Only
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Show All
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{list.length}</span> notification{list.length !== 1 ? 's' : ''}
            </div>
            {filter === 'UNREAD' && list.length === 0 && (
              <div className="text-sm text-green-600 font-medium">
                ✓ All caught up!
              </div>
            )}
          </div>
          {notifications.length > 0 && unreadCount > 0 && (
            <Button variant="ghost" onClick={markAllRead} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark all as read
            </Button>
          )}
        </div>

        {isRefreshing ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {filter === 'UNREAD' ? '✅' : '🔔'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-sm text-gray-600">
              {filter === 'UNREAD'
                ? "You're all caught up! Check back later for updates."
                : 'Notifications will appear here when there are updates to your cases.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((n) => (
              <div
                key={n.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${n.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{getNotificationIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{n.title}</h4>
                      <div className="flex items-center gap-2">
                        {!n.isRead && (
                          <span className="flex-shrink-0 w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                        )}
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getNotificationBadgeColor(
                            n.type
                          )}`}
                        >
                          {n.type}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{n.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(n.createdAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Case ID: {n.relatedCaseId.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
