import React, { ReactNode } from 'react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
    showCloseButton?: boolean;
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
    footer?: ReactNode;
    headerClassName?: string;
    bodyClassName?: string;
    footerClassName?: string;
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-full mx-4',
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnBackdropClick = true,
    closeOnEscape = true,
    footer,
    headerClassName = '',
    bodyClassName = '',
    footerClassName = '',
}) => {
    // Handle ESC key press
    useEscapeKey(onClose, isOpen && closeOnEscape);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
        >
            <div
                className={`w-full ${sizeClasses[size]} rounded-lg bg-white shadow-2xl overflow-hidden animate-fadeIn`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b ${headerClassName}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                {title && (
                                    <h3 id="modal-title" className="text-xl font-semibold text-gray-900">
                                        {title}
                                    </h3>
                                )}
                                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
                            </div>
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="ml-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-full p-1"
                                    aria-label="Close modal"
                                    title="Close (ESC)"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className={`p-6 ${bodyClassName}`}>{children}</div>

                {/* Footer */}
                {footer && (
                    <div className={`bg-gray-50 px-6 py-4 border-t ${footerClassName}`}>
                        {footer}
                    </div>
                )}
            </div>

            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
        </div>
    );
};
