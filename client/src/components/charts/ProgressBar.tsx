import React from 'react';

interface ProgressBarProps {
    label: string;
    value: number;
    max: number;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    showPercentage?: boolean;
}

const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
    label,
    value,
    max,
    color = 'blue',
    showPercentage = true,
}) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                {showPercentage && (
                    <span className="text-sm text-gray-600">
                        {value} / {max} ({percentage.toFixed(0)}%)
                    </span>
                )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                    className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out rounded-full`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};
