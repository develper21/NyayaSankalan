import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DataPoint {
    name: string;
    value: number;
    color: string;
}

interface CaseStatusPieChartProps {
    data: DataPoint[];
    title?: string;
}

export const CaseStatusPieChart: React.FC<CaseStatusPieChartProps> = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
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
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-gray-700">
                            {item.name}: <span className="font-semibold">{item.value}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
