
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { budgetService } from '@/services/budgetService';
import { goalService } from '@/services/goalService';
import { debtService } from '@/services/debtService';

export const FinancialOverview = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<{
    monthlyBudget: any;
    goalStats: any;
    debtStats: any;
    healthScore: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOverviewData();
    }
  }, [user]);

  const fetchOverviewData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const [monthlyBudget, goalStats, debtStats] = await Promise.all([
        budgetService.getBudgetByUserAndMonth(user.id, currentMonth),
        goalService.getGoalStatistics(user.id),
        debtService.getDebtStatistics(user.id)
      ]);

      // Calculate simple health score
      let healthScore = 70; // Base score
      
      if (monthlyBudget) {
        const budgetHealth = budgetService.validateBudgetHealth(monthlyBudget);
        healthScore += budgetHealth.isHealthy ? 20 : -10;
      }
      
      if (goalStats.totalGoals > 0) {
        healthScore += goalStats.averageProgress > 50 ? 10 : 0;
      }
      
      if (debtStats.totalDebts > 0) {
        healthScore -= Math.min(debtStats.totalDebts * 5, 20);
      }

      setOverview({
        monthlyBudget,
        goalStats,
        debtStats,
        healthScore: Math.max(0, Math.min(100, healthScore))
      });
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBadge = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    return 'Necesita Atención';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Salud Financiera</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getHealthScoreColor(overview?.healthScore || 0)}`}>
            {overview?.healthScore || 0}%
          </div>
          <Badge variant={overview?.healthScore >= 60 ? 'default' : 'destructive'}>
            {getHealthScoreBadge(overview?.healthScore || 0)}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Presupuesto Mensual</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${overview?.monthlyBudget?.income?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-muted-foreground">
            Gastos: ${((overview?.monthlyBudget?.fixed_expenses || 0) + (overview?.monthlyBudget?.variable_expenses || 0)).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Metas de Ahorro</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview?.goalStats?.totalGoals || 0}</div>
          <p className="text-xs text-muted-foreground">
            Progreso promedio: {overview?.goalStats?.averageProgress?.toFixed(1) || 0}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deudas Totales</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${overview?.debtStats?.totalBalance?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-muted-foreground">
            {overview?.debtStats?.totalDebts || 0} deudas activas
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
