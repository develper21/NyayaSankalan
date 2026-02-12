import React, { useEffect, useState } from 'react';
import { auditApi, AuditLog } from '../../api/audit.api';

interface Props {
  caseId: string;
}

const actionStyles = (action: string) => {
  const lower = action.toLowerCase();
  if (lower.includes('create') || lower.includes('add') || lower.includes('register')) {
    return { color: 'text-green-700', bg: 'bg-green-50', icon: '➕' };
  }
  if (lower.includes('update') || lower.includes('edit') || lower.includes('modify')) {
    return { color: 'text-blue-700', bg: 'bg-blue-50', icon: '✏️' };
  }
  if (lower.includes('delete') || lower.includes('remove')) {
    return { color: 'text-red-700', bg: 'bg-red-50', icon: '🗑️' };
  }
  if (lower.includes('submit') || lower.includes('finalize')) {
    return { color: 'text-purple-700', bg: 'bg-purple-50', icon: '📤' };
  }
  if (lower.includes('approve') || lower.includes('accept')) {
    return { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: '✅' };
  }
  if (lower.includes('reject') || lower.includes('return')) {
    return { color: 'text-orange-700', bg: 'bg-orange-50', icon: '↩️' };
  }
  return { color: 'text-gray-700', bg: 'bg-gray-50', icon: '📋' };
};

// Skeleton loader
const AuditSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-3">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-12 bg-gray-100 rounded" />
    ))}
  </div>
);

export const AuditPanel: React.FC<Props> = ({ caseId }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await auditApi.getCaseAuditLogs(caseId);
        setLogs(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [caseId]);

  if (loading) return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">🕵️ Audit Trail</h3>
      <AuditSkeleton />
    </div>
  );

  if (error) return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">🕵️ Audit Trail</h3>
      <div className="text-sm text-red-600 bg-red-50 p-3 rounded flex items-center gap-2">
        <span>⚠️</span> {error}
      </div>
    </div>
  );

  if (logs.length === 0) return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">🕵️ Audit Trail</h3>
      <div className="text-sm text-gray-500 text-center bg-gray-50 p-4 rounded">
        <span className="block text-2xl mb-2">📝</span>
        No audit logs recorded yet.
      </div>
    </div>
  );

  const displayedLogs = showAll ? logs : logs.slice(0, 10);
  const hasMore = logs.length > 10;

  return (
    <div className="bg-white rounded-lg border border-gray-100">
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🕵️ Audit Trail
        </h3>
        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
          {logs.length} entries
        </span>
      </div>
      <div className="divide-y max-h-96 overflow-y-auto">
        {displayedLogs.map((log) => {
          const style = actionStyles(log.action);
          return (
            <div key={log.id} className={`p-3 hover:bg-gray-50 transition-colors ${style.bg}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{style.icon}</span>
                  <div>
                    <span className={`text-sm font-medium ${style.color}`}>{log.action}</span>
                    <span className="text-sm text-gray-500 ml-2">on {log.entity}</span>
                    <div className="text-xs text-gray-500 mt-1">
                      👤 {log.user.name} ({log.user.role})
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <div className="p-3 text-center border-t">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:underline focus:outline-none"
          >
            {showAll ? 'Show less ▲' : `Show ${logs.length - 10} more ▼`}
          </button>
        </div>
      )}
    </div>
  );
};
