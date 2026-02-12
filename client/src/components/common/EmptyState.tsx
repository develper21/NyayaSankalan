import React, { ReactNode } from 'react';

export interface EmptyStateProps {
  title?: string;
  message: string;
  action?: ReactNode | {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, action }) => {
  const renderAction = () => {
    if (!action) return null;
    
    // If action is a ReactNode (JSX element), render it directly
    if (React.isValidElement(action)) {
      return action;
    }
    
    // Otherwise, it's the { label, onClick } format
    const actionObj = action as { label: string; onClick: () => void };
    return (
      <button onClick={actionObj.onClick} className="btn btn-primary">
        {actionObj.label}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-gray-400 mb-4">
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      {title && <p className="text-gray-900 font-semibold mb-2">{title}</p>}
      <p className="text-gray-600 mb-4 text-center max-w-md">{message}</p>
      {renderAction()}
    </div>
  );
};
