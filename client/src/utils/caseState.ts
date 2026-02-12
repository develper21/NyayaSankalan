import { CaseState } from '../types/api.types';

/**
 * Badge variant based on case state
 * Consistent colors across all pages
 */
export const getCaseStateBadgeVariant = (state: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  switch (state) {
    // Gray - Initial state
    case CaseState.FIR_REGISTERED:
      return 'default';
    
    // Blue - Active investigation
    case CaseState.CASE_ASSIGNED:
    case CaseState.UNDER_INVESTIGATION:
      return 'info';
    
    // Orange - Investigation complete, awaiting action
    case CaseState.INVESTIGATION_COMPLETED:
    case CaseState.INVESTIGATION_PAUSED:
    case CaseState.CHARGE_SHEET_PREPARED:
    case CaseState.CLOSURE_REPORT_PREPARED:
      return 'warning';
    
    // Purple/Info - Court submission
    case CaseState.SUBMITTED_TO_COURT:
    case CaseState.RETURNED_FOR_DEFECTS:
    case CaseState.RESUBMITTED_TO_COURT:
      return 'info';
    
    // Green - Court accepted / In trial
    case CaseState.COURT_ACCEPTED:
    case CaseState.TRIAL_ONGOING:
      return 'success';
    
    // Other court states
    case CaseState.JUDGMENT_RESERVED:
      return 'warning';
    
    case CaseState.DISPOSED:
    case CaseState.APPEALED:
    case CaseState.ARCHIVED:
      return 'default';
    
    default:
      return 'default';
  }
};

/**
 * Human-readable state label
 */
export const getCaseStateLabel = (state: string): string => {
  return state.replace(/_/g, ' ');
};

/**
 * Check if case is in an editable state for police
 */
export const isEditableByPolice = (state: string): boolean => {
  return [
    CaseState.CASE_ASSIGNED,
    CaseState.UNDER_INVESTIGATION,
  ].includes(state as CaseState);
};

/**
 * Check if case can be submitted to court (SHO action)
 * Only allowed when investigation is marked complete
 */
export const canSubmitToCourt = (state: string): boolean => {
  return [
    CaseState.INVESTIGATION_COMPLETED,
    CaseState.CHARGE_SHEET_PREPARED,
    CaseState.CLOSURE_REPORT_PREPARED,
  ].includes(state as CaseState);
};

/**
 * Check if case can be intaked by court clerk
 */
export const canIntakeCase = (state: string): boolean => {
  return [
    CaseState.SUBMITTED_TO_COURT,
    CaseState.RESUBMITTED_TO_COURT,
  ].includes(state as CaseState);
};

/**
 * Check if case is in court (for judge actions)
 */
export const isInCourt = (state: string): boolean => {
  return [
    CaseState.COURT_ACCEPTED,
    CaseState.TRIAL_ONGOING,
    CaseState.JUDGMENT_RESERVED,
  ].includes(state as CaseState);
};

/**
 * Check if police editing is locked (after court submission)
 */
export const isLockedForPolice = (state: string): boolean => {
  return [
    CaseState.SUBMITTED_TO_COURT,
    CaseState.RESUBMITTED_TO_COURT,
    CaseState.COURT_ACCEPTED,
    CaseState.TRIAL_ONGOING,
    CaseState.JUDGMENT_RESERVED,
    CaseState.DISPOSED,
    CaseState.APPEALED,
    CaseState.ARCHIVED,
  ].includes(state as CaseState);
};
