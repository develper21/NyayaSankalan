import React from 'react';
import toast, { Toast } from 'react-hot-toast';

export interface CustomToastProps {
    t: Toast;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    action?: {
        label: string;
        onClick: () => void;
    };
}

const getIcon = (type: string) => {
    switch (type) {
        case 'success':
            return (
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
            );
        case 'error':
            return (
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                    />
                </svg>
            );
        case 'warning':
            return (
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                    />
                </svg>
            );
        case 'info':
        default:
            return (
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                    />
                </svg>
            );
    }
};

const getBgColor = (type: string) => {
    switch (type) {
        case 'success':
            return 'bg-green-50 border-green-200';
        case 'error':
            return 'bg-red-50 border-red-200';
        case 'warning':
            return 'bg-yellow-50 border-yellow-200';
        case 'info':
        default:
            return 'bg-blue-50 border-blue-200';
    }
};

export const CustomToast: React.FC<CustomToastProps> = ({
    t,
    title,
    message,
    type = 'info',
    action,
}) => {
    return (
        <div
            className={`${t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full ${getBgColor(type)} border shadow-lg rounded-lg pointer-events-auto flex`}
        >
            <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">{getIcon(type)}</div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold text-gray-900">{title}</p>
                        <p className="mt-1 text-sm text-gray-600">{message}</p>
                        {action && (
                            <button
                                onClick={() => {
                                    action.onClick();
                                    toast.dismiss(t.id);
                                }}
                                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                                {action.label} →
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex border-l border-gray-200">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <style>{`
        @keyframes enter {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes leave {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .animate-enter {
          animation: enter 0.3s ease-out;
        }
        .animate-leave {
          animation: leave 0.2s ease-in forwards;
        }
      `}</style>
        </div>
    );
};

// Helper function to show custom toasts
export const showNotificationToast = {
    success: (title: string, message: string, action?: { label: string; onClick: () => void }) => {
        toast.custom((t) => <CustomToast t={t} title={title} message={message} type="success" action={action} />, {
            duration: 5000,
            position: 'top-right',
        });
    },
    error: (title: string, message: string, action?: { label: string; onClick: () => void }) => {
        toast.custom((t) => <CustomToast t={t} title={title} message={message} type="error" action={action} />, {
            duration: 6000,
            position: 'top-right',
        });
    },
    warning: (title: string, message: string, action?: { label: string; onClick: () => void }) => {
        toast.custom((t) => <CustomToast t={t} title={title} message={message} type="warning" action={action} />, {
            duration: 5000,
            position: 'top-right',
        });
    },
    info: (title: string, message: string, action?: { label: string; onClick: () => void }) => {
        toast.custom((t) => <CustomToast t={t} title={title} message={message} type="info" action={action} />, {
            duration: 4000,
            position: 'top-right',
        });
    },
};
