import React, { useEffect, useState } from 'react';
import { timelineApi } from '../../api/timeline.api';
import type { TimelineEvent } from '../../types/api.types';

interface Props {
  caseId: string;
}

const eventStyles = (type: string) => {
  switch (type) {
    case 'COURT_ACTION': return { bg: 'bg-purple-600', icon: '⚖️', label: 'Court Action' };
    case 'STATE_CHANGE': return { bg: 'bg-blue-500', icon: '🔄', label: 'State Change' };
    case 'INVESTIGATION_EVENT': return { bg: 'bg-green-600', icon: '🔍', label: 'Investigation' };
    case 'DOCUMENT': return { bg: 'bg-gray-600', icon: '📄', label: 'Document' };
    case 'COURT_SUBMISSION': return { bg: 'bg-indigo-600', icon: '📤', label: 'Court Submission' };
    case 'FIR_REGISTERED': return { bg: 'bg-emerald-700', icon: '📋', label: 'FIR Registered' };
    case 'BAIL': return { bg: 'bg-amber-600', icon: '🔓', label: 'Bail' };
    case 'EVIDENCE': return { bg: 'bg-orange-500', icon: '🗂️', label: 'Evidence' };
    case 'JUDGMENT': return { bg: 'bg-red-700', icon: '🔨', label: 'Judgment' };
    default: return { bg: 'bg-gray-400', icon: '📌', label: 'Event' };
  }
};

// Skeleton loader for timeline
const TimelineSkeleton: React.FC = () => (
  <div className="p-4 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
    <div className="relative pl-8">
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="mb-6 relative flex items-start">
          <div className="absolute -left-4 w-8 h-8 rounded-full bg-gray-200" />
          <div className="ml-6 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CaseTimeline: React.FC<Props> = ({ caseId }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await timelineApi.getCaseTimeline(caseId);
        setEvents(res);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load timeline');
      } finally { setLoading(false); }
    };
    load();
  }, [caseId]);

  if (loading) return <TimelineSkeleton />;
  
  if (error) return (
    <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg flex items-center gap-2">
      <span>⚠️</span> {error}
    </div>
  );

  if (events.length === 0) return (
    <div className="p-4 text-sm text-gray-500 text-center bg-gray-50 rounded-lg">
      <span className="block text-2xl mb-2">📅</span>
      No timeline events recorded yet.
    </div>
  );

  const displayedEvents = showAll ? events : events.slice(0, 5);
  const hasMore = events.length > 5;

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span>📊</span> Case Timeline
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {events.length} events
        </span>
      </div>
      <div className="relative pl-10">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-gray-300 to-gray-200" />
        {displayedEvents.map((e, idx) => {
          const style = eventStyles(e.type);
          return (
            <div key={`${e.type}-${idx}`} className="mb-6 relative group">
              <div className={`absolute -left-6 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md ${style.bg} transition-transform group-hover:scale-110`}>
                <span role="img" aria-label={style.label}>{style.icon}</span>
              </div>
              <div className="ml-6 bg-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                  <div>
                    <span className="inline-block text-xs font-medium text-gray-500 uppercase mb-1">{style.label}</span>
                    <div className="font-medium text-sm text-gray-800">{e.title}</div>
                    {e.description && <div className="text-sm text-gray-600 mt-1">{e.description}</div>}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</div>
                </div>
                {e.actor && (
                  <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>👤</span> {e.actor}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <div className="text-center mt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:underline focus:outline-none"
          >
            {showAll ? 'Show less ▲' : `Show ${events.length - 5} more ▼`}
          </button>
        </div>
      )}
    </div>
  );
};
