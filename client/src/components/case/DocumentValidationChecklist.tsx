import React from 'react';
import type { Case } from '../../types/api.types';
import { CaseState } from '../../types/api.types';

interface Props {
  caseData: Case;
  onFix?: (item: string) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  isValid: boolean;
  isCritical: boolean;
  category: 'document' | 'evidence' | 'accused' | 'witness';
}

export const DocumentValidationChecklist: React.FC<Props> = ({ caseData, onFix }) => {
  const currentState = caseData.state?.currentState;

  // Build checklist based on case data
  const buildChecklist = (): ChecklistItem[] => {
    const items: ChecklistItem[] = [];

    // Check for charge sheet (required for court submission)
    const hasChargeSheet = caseData.documents?.some(
      (d) => d.documentType === 'CHARGE_SHEET' && d.status === 'FINAL'
    );
    items.push({
      id: 'charge_sheet',
      label: 'Charge Sheet',
      description: 'Final charge sheet document required',
      isValid: !!hasChargeSheet,
      isCritical: true,
      category: 'document',
    });

    // Check for evidence list
    const hasEvidenceList = caseData.documents?.some(
      (d) => d.documentType === 'EVIDENCE_LIST'
    );
    items.push({
      id: 'evidence_list',
      label: 'Evidence List',
      description: 'List of all evidence collected',
      isValid: !!hasEvidenceList,
      isCritical: true,
      category: 'document',
    });

    // Check for witness list
    const hasWitnessList = caseData.documents?.some(
      (d) => d.documentType === 'WITNESS_LIST'
    );
    items.push({
      id: 'witness_list',
      label: 'Witness List',
      description: 'List of all witnesses',
      isValid: !!hasWitnessList,
      isCritical: true,
      category: 'document',
    });

    // Check for at least one accused
    const hasAccused = (caseData.accused?.length ?? 0) > 0;
    items.push({
      id: 'accused',
      label: 'Accused Details',
      description: 'At least one accused must be added',
      isValid: hasAccused,
      isCritical: true,
      category: 'accused',
    });

    // Check for at least one witness
    const hasWitness = (caseData.witnesses?.length ?? 0) > 0;
    items.push({
      id: 'witness',
      label: 'Witness Statements',
      description: 'At least one witness with statement',
      isValid: hasWitness,
      isCritical: true,
      category: 'witness',
    });

    // Check for at least one evidence
    const hasEvidence = (caseData.evidence?.length ?? 0) > 0;
    items.push({
      id: 'evidence',
      label: 'Evidence Uploaded',
      description: 'At least one piece of evidence',
      isValid: hasEvidence,
      isCritical: true,
      category: 'evidence',
    });

    // Optional: Check for investigation events
    const hasInvestigation = (caseData.investigationEvents?.length ?? 0) > 0;
    items.push({
      id: 'investigation',
      label: 'Investigation Events',
      description: 'Record of investigation activities',
      isValid: hasInvestigation,
      isCritical: false,
      category: 'document',
    });

    return items;
  };

  const checklist = buildChecklist();
  const criticalItems = checklist.filter((i) => i.isCritical);
  const allCriticalValid = criticalItems.every((i) => i.isValid);
  const validCount = checklist.filter((i) => i.isValid).length;
  const progress = Math.round((validCount / checklist.length) * 100);

  // Only show for states before court submission
  const showValidation = [
    CaseState.UNDER_INVESTIGATION,
    CaseState.INVESTIGATION_COMPLETED,
    CaseState.CHARGE_SHEET_PREPARED,
  ].includes(currentState as CaseState);

  if (!showValidation) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            📋 Court Submission Checklist
          </h3>
          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
            allCriticalValid 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {allCriticalValid ? '✅ Ready' : `⚠️ ${criticalItems.filter(i => !i.isValid).length} issues`}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Completion</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                progress === 100 ? 'bg-green-500' : progress >= 60 ? 'bg-blue-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="divide-y">
        {checklist.map((item) => (
          <div
            key={item.id}
            className={`p-3 flex items-center justify-between transition-colors ${
              item.isValid ? 'bg-white' : item.isCritical ? 'bg-red-50' : 'bg-yellow-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-lg ${item.isValid ? 'text-green-500' : 'text-gray-300'}`}>
                {item.isValid ? '✅' : '⬜'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${item.isValid ? 'text-gray-700' : 'text-gray-900'}`}>
                    {item.label}
                  </span>
                  {item.isCritical && !item.isValid && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </div>
            {!item.isValid && onFix && (
              <button
                onClick={() => onFix(item.id)}
                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
              >
                Add →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className={`p-3 text-sm ${allCriticalValid ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
        {allCriticalValid ? (
          <span className="flex items-center gap-2">
            <span>🎉</span> All required items complete. Ready for court submission!
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span>⚠️</span> Complete all required items before submitting to court.
          </span>
        )}
      </div>
    </div>
  );
};
