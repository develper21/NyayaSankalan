import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { caseApi } from '../api/case.api';
import { timelineApi } from '../api/timeline.api';
import type { Notification, AuditLog } from '../types/api.types';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const LOCAL_KEY = 'nyaya_notifications_read';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const auditLogsEnabled = (import.meta.env.VITE_FEATURE_AUDIT_LOG_NOTIFICATIONS ?? 'false') === 'true';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readMap, setReadMap] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });
  const forbiddenCaseIdsRef = useRef<Set<string>>(new Set());

  const saveReadMap = (m: Record<string, boolean>) => {
    setReadMap(m);
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(m)); } catch (e) { }
  };

  const mapAuditToNotification = (log: AuditLog, caseId: string): Notification | null => {
    const createdAt = log.timestamp;
    const baseCaseLabel = `Case ${caseId}`;

    switch (log.action) {
      case 'DOCUMENT_REQUEST_APPROVED':
        return { id: log.id, title: 'Document Request Approved', message: `SHO approved a document request for ${baseCaseLabel}`, relatedCaseId: caseId, type: 'ACTION', isRead: !!readMap[log.id], createdAt };
      case 'DOCUMENT_REQUEST_ISSUED':
        return { id: log.id, title: 'Document Issued by Court', message: `Court issued a requested document for ${baseCaseLabel}. Check downloads.`, relatedCaseId: caseId, type: 'ACTION', isRead: !!readMap[log.id], createdAt };
      case 'COURT_ACTION_CREATED':
        return { id: log.id, title: 'Court Action Added', message: `A court action (hearing/order) was added for ${baseCaseLabel}`, relatedCaseId: caseId, type: 'INFO', isRead: !!readMap[log.id], createdAt };
      case 'SUBMITTED_TO_COURT':
        return { id: log.id, title: 'Case Submitted to Court', message: `${baseCaseLabel} was submitted to court`, relatedCaseId: caseId, type: 'INFO', isRead: !!readMap[log.id], createdAt };
      case 'CASE_REOPENED':
      case 'CASE_REOPEN_APPROVED':
        return { id: log.id, title: 'Case Re-opened by Court', message: `${baseCaseLabel} was re-opened by judicial order`, relatedCaseId: caseId, type: 'WARNING', isRead: !!readMap[log.id], createdAt };
      default:
        return null;
    }
  };

  const fetchNotificationsForCases = async (caseIds: string[]) => {
    if (!auditLogsEnabled) return;
    const items: Notification[] = [];
    await Promise.all(caseIds.map(async (caseId) => {
      if (forbiddenCaseIdsRef.current.has(caseId)) {
        return;
      }
      try {
        const result = await timelineApi.getAuditLogs(caseId);
        if (result.forbidden) {
          forbiddenCaseIdsRef.current.add(caseId);
          return;
        }
        result.logs.forEach((l) => {
          const n = mapAuditToNotification(l, caseId);
          if (n) items.push(n);
        });
      } catch (e) {
        // ignore fetch errors per-case
      }
    }));

    // De-duplicate by id and sort desc
    const dedupMap: Record<string, Notification> = {};
    items.forEach((it) => { dedupMap[it.id] = it; });
    const arr = Object.values(dedupMap).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setNotifications(arr);
  };

  const refresh = async () => {
    if (!user || !user.id) return;

    try {
      // Determine relevant cases based on role
      let cases: { id: string }[] = [];
      if (user.role === 'POLICE') {
        cases = await caseApi.getMyCases();
      } else if (user.role === 'JUDGE' || user.role === 'COURT_CLERK') {
        // fetch first page of cases for court
        const res = await caseApi.getCases(user.organizationId, user.role as any, 1, 20);
        cases = res.cases || [];
      } else if (user.role === 'SHO') {
        // SHO: fetch cases in station
        const res = await caseApi.getCases(user.organizationId, user.role as any, 1, 20);
        cases = res.cases || [];
      }

      const caseIds = (cases || []).slice(0, 30).map(c => c.id);
      if (caseIds.length > 0) {
        await fetchNotificationsForCases(caseIds);
      }
    } catch (e) {
      // ignore - don't crash on fetch errors
      console.warn('Notification refresh failed:', e);
    }
  };

  useEffect(() => {
    refresh();
    const iv = setInterval(() => { refresh(); }, 30 * 1000); // 30s poll

    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(iv);
      window.removeEventListener('focus', onFocus);
    };
  }, [user]);

  useEffect(() => {
    // Update isRead flags on notifications when readMap changes
    setNotifications((prev) => prev.map(n => ({ ...n, isRead: !!readMap[n.id] })));
  }, [readMap]);

  const markAsRead = (id: string) => {
    const nm = { ...readMap, [id]: true };
    saveReadMap(nm);
  };

  const markAllRead = () => {
    const m: Record<string, boolean> = {};
    notifications.forEach(n => { m[n.id] = true; });
    saveReadMap(m);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export default NotificationContext;