import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataPoint {
    name: string;
    value: number;
}

interface WorkloadBarChartProps {
    data: DataPoint[];
    title?: string;
    barColor?: string;
    dataKey?: string;
}

export const WorkloadBarChart: React.FC<WorkloadBarChartProps> = ({
    data,
    title,
    barColor = '#8884d8',
    dataKey = 'value',
}) => {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <p>No data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {title && <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>}
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={dataKey} fill={barColor} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
