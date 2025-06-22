
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';

interface GoalStatisticsProps {
  statistics: {
    totalGoals: number;
    completedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    averageProgress: number;
  };
}

export const GoalStatistics = ({ statistics }: GoalStatisticsProps) => {
  const completionRate = statistics.totalGoals > 0 
    ? (statistics.completedGoals / statistics.totalGoals) * 100 
    : 0;

  const totalProgress = statistics.totalTargetAmount > 0 
    ? (statistics.totalCurrentAmount / statistics.totalTargetAmount) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.totalGoals}</div>
          <p className="text-xs text-muted-foreground">
            {statistics.completedGoals} completadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Cumplimiento</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {statistics.completedGoals} de {statistics.totalGoals} metas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monto Total Objetivo</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${statistics.totalTargetAmount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            ${statistics.totalCurrentAmount.toLocaleString()} ahorrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progreso General</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProgress.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Promedio: {statistics.averageProgress.toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
