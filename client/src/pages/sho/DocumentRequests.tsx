import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/api.types';
import { documentRequestsApi } from '../../api/documentRequests.api';
import { DocumentRequest } from '../../types/api.types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const DocumentRequests: React.FC = () => {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(false); // kept for future UX improvements (disable buttons)
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const res = await documentRequestsApi.getPendingForSho();
      setRequests(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    setLoading(true);
    try {
      await documentRequestsApi.approve(id);
      await load();
    } finally { setLoading(false); }
  };

  const reject = async (id: string) => {
    const reason = prompt('Reason for rejection');
    if (!reason) return;
    setLoading(true);
    try {
      await documentRequestsApi.reject(id, reason);
      await load();
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Document Requests - Pending Approval</h2>
      <Card>
        {requests.length === 0 && <div>No pending requests</div>}
        {requests.map((r) => (
          <div key={r.id} className="flex justify-between items-center py-2 border-b">
            <div>
              <div className="font-medium">{r.documentType} — Case {r.caseId}</div>
              <div className="text-sm text-gray-600">{r.requestReason} — Requested by {r.requester?.name}</div>
            </div>
            <div className="space-x-2">
              <Button variant="ghost" onClick={() => {
                const base = (user?.role === UserRole.SHO) ? '/sho' : (user?.role === UserRole.POLICE) ? '/police' : (user?.role === UserRole.COURT_CLERK) ? '/court' : '/judge';
                window.open(`${base}/cases/${r.caseId}`, '_blank');
              }}>View Case</Button>
              <Button variant="secondary" onClick={() => approve(r.id)} disabled={loading}>Approve</Button>
              <Button variant="danger" onClick={() => reject(r.id)} disabled={loading}>Reject</Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};