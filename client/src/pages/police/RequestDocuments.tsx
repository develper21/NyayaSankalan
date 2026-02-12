import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { documentRequestsApi } from '../../api/documentRequests.api';
import { caseApi } from '../../api/case.api';
import type { DocumentRequest } from '../../types/api.types';
import { DocumentRequestType } from '../../types/api.types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export const RequestDocuments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [caseId, setCaseId] = useState('');
  const [cases, setCases] = useState<{ id: string; firNumber?: string }[]>([]);
  const [documentType, setDocumentType] = useState<DocumentRequestType>(DocumentRequestType.ARREST_WARRANT);
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMyRequests = async () => {
    setLoading(true);
    try {
      const res = await documentRequestsApi.getMyRequests();
      setRequests(res);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCases = async () => {
    try {
      const res = await caseApi.getMyCases();
      setCases(res.map((c) => ({ id: c.id, firNumber: c.fir?.firNumber })));

      // If caseId is present in query param, pre-select it
      const q = searchParams.get('caseId');
      if (q) setCaseId(q);
    } catch (err) {
      // ignore for now
    }
  };

  useEffect(() => {
    loadMyRequests();
    loadMyCases();
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      await documentRequestsApi.create({ caseId, documentType, requestReason: reason });
      await loadMyRequests();
      setCaseId('');
      setReason('');
    } catch (err) {
      // TODO: toast error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Judicial Document Request</h2>
      <p className="text-sm text-gray-600 mb-4">This request does not imply court submission</p>

      <Card className="mb-6">
        <div className="space-y-3">
          <Select
            label="Select Case"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            options={[{ value: '', label: 'Select case...' }, ...cases.map(c => ({ value: c.id, label: c.firNumber || c.id.slice(0,8) }))]}
            required
          />
          <Select
            label="Document Type"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentRequestType)}
            options={[
              { value: DocumentRequestType.ARREST_WARRANT, label: 'Arrest Warrant' },
              { value: DocumentRequestType.SEARCH_WARRANT, label: 'Search Warrant' },
              { value: DocumentRequestType.REMAND_ORDER, label: 'Remand Order' },
              { value: DocumentRequestType.CHARGE_SHEET_COPY, label: 'Charge Sheet Copy' },
              { value: DocumentRequestType.OTHER, label: 'Other' },
            ]}
          />
          <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex justify-end">
            <Button onClick={submit} isLoading={loading} disabled={!caseId}>Request Document</Button>
          </div>
        </div>
      </Card>

      <h3 className="text-lg font-medium mb-2">My Requests</h3>
      <Card>
        <div className="space-y-2">
          {requests.length === 0 && <div>No requests yet</div>}
          {requests.map((r) => (
            <div key={r.id} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{r.documentType}</div>
                <div className="text-sm text-gray-600">{r.requestReason}</div>
              </div>
              <div className="text-sm flex items-center space-x-3">
                <Button variant="ghost" onClick={() => window.open(`/police/cases/${r.caseId}`, '_blank')}>View Case</Button>
                <span className="px-2 py-1 bg-gray-100 rounded">{r.status}</span>
                {r.status === 'ISSUED' && (
                  <a href={r.issuedFileUrl || undefined} className="ml-3 text-blue-600" target="_blank" rel="noreferrer">Download</a>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
