
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, TrendingUp, Flame } from 'lucide-react';

interface UserStatsProps {
  stats: {
    totalPoints: number;
    achievements: number;
    healthScore: number;
    streak: number;
  };
}

const UserStats = ({ stats }: UserStatsProps) => {
  const statItems = [
    {
      icon: <Trophy className="h-6 w-6 text-yellow-400" />,
      label: 'Puntos Totales',
      value: stats.totalPoints.toLocaleString(),
      color: 'text-yellow-400'
    },
    {
      icon: <Target className="h-6 w-6 text-finflow-mint" />,
      label: 'Logros',
      value: stats.achievements,
      color: 'text-finflow-mint'
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-blue-400" />,
      label: 'Salud Financiera',
      value: `${stats.healthScore}%`,
      color: 'text-blue-400'
    },
    {
      icon: <Flame className="h-6 w-6 text-red-400" />,
      label: 'Racha',
      value: `${stats.streak} días`,
      color: 'text-red-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index} className="bg-finflow-card border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {item.icon}
              <CardTitle className="text-sm text-gray-300">{item.label}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl font-bold ${item.color}`}>
              {item.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UserStats;
