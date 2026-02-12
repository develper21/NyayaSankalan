import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/common/Loader';
import { caseReopenApi } from '../../api/caseReopen.api';
import { CaseReopenRequest } from '../../types/api.types';

export const ReopenRequests: React.FC = () => {
  const [requests, setRequests] = useState<CaseReopenRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await caseReopenApi.getPendingForJudge();
      setRequests(res);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const note = prompt('Judicial note (required)');
    if (!note) return;
    if (!window.confirm('Approving will re-open the case and assign it back to the officer. Proceed?')) return;

    try {
      setActionLoading(true);
      await caseReopenApi.approve(id, note);
      toast.success('Request approved');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async (id: string) => {
    const reason = prompt('Reason for rejection (required)');
    if (!reason) return;
    try {
      setActionLoading(true);
      await caseReopenApi.reject(id, reason);
      toast.success('Request rejected');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6">
      <Header title="Case Re-open Requests" subtitle="Requests pending judicial decision" />

      <Card>
        {requests.length === 0 && <div>No pending requests</div>}
        {requests.map((r) => (
          <div key={r.id} className="flex justify-between items-center py-3 border-b">
            <div>
              <div className="font-medium">Case {r.caseId}</div>
              <div className="text-sm text-gray-600">Requested by: {r.requester?.name}</div>
              <div className="text-sm text-gray-600 mt-1">Reason: {r.policeReason}</div>
            </div>
            <div className="space-x-2">
              <Button variant="ghost" onClick={() => window.open(`/judge/cases/${r.caseId}`, '_blank')}>View Case</Button>
              <Button onClick={() => approve(r.id)} disabled={actionLoading}>Approve</Button>
              <Button variant="danger" onClick={() => reject(r.id)} disabled={actionLoading}>Reject</Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};
