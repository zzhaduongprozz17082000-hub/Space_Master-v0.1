import React from 'react';

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
}

export const StatCard = ({ icon, title, value }: StatCardProps) => {
    return (
        <div className="stat-card">
            <div className="stat-card-icon">{icon}</div>
            <div className="stat-card-info">
                <h3>{title}</h3>
                <p>{value}</p>
            </div>
        </div>
    );
};
