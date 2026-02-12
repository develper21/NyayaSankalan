import React from 'react';

interface ErrorMessageProps {
  message: string;
  retry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, retry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-gray-900 font-semibold mb-2">Error</p>
      <p className="text-gray-600 mb-4">{message}</p>
      {retry && (
        <button onClick={retry} className="btn btn-primary">
          Retry
        </button>
      )}
    </div>
  );
};
