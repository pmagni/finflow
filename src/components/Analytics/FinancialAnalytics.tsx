
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { budgetService } from '@/services/budgetService';
import { goalService } from '@/services/goalService';
import { debtService } from '@/services/debtService';

export const FinancialAnalytics = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const [budgets, goals, debtStats] = await Promise.all([
        budgetService.getBudgetsByUser(user.id),
        goalService.getGoalsByUser(user.id),
        debtService.getDebtStatistics(user.id)
      ]);

      // Prepare budget trend data
      const budgetTrend = budgets.slice(0, 6).reverse().map(budget => ({
        month: budget.month || 'N/A',
        income: budget.income || 0,
        expenses: (budget.fixed_expenses || 0) + (budget.variable_expenses || 0),
        savings: budget.savings_goal || 0
      }));

      // Prepare goals progress data
      const goalsProgress = goals.map(goal => ({
        name: goal.name,
        progress: goal.progress || 0,
        target: goal.target,
        current: goal.current_amount || 0
      }));

      // Prepare expense distribution
      const expenseDistribution = budgets.length > 0 ? [
        { name: 'Gastos Fijos', value: budgets[0]?.fixed_expenses || 0, color: '#8884d8' },
        { name: 'Gastos Variables', value: budgets[0]?.variable_expenses || 0, color: '#82ca9d' },
        { name: 'Ahorros', value: budgets[0]?.savings_goal || 0, color: '#ffc658' },
      ] : [];

      setAnalyticsData({
        budgetTrend,
        goalsProgress,
        expenseDistribution,
        debtStats
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análisis Financiero</CardTitle>
          <CardDescription>
            Visualización detallada de tu progreso financiero
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="budget" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="budget">Presupuesto</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="distribution">Distribución</TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Presupuesto</CardTitle>
              <CardDescription>Evolución de ingresos, gastos y ahorros</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData?.budgetTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#8884d8" name="Ingresos" />
                  <Line type="monotone" dataKey="expenses" stroke="#82ca9d" name="Gastos" />
                  <Line type="monotone" dataKey="savings" stroke="#ffc658" name="Ahorros" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Progreso de Metas</CardTitle>
              <CardDescription>Estado actual de tus objetivos de ahorro</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData?.goalsProgress || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="progress" fill="#8884d8" name="Progreso %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Distribución del Presupuesto</CardTitle>
              <CardDescription>Cómo se distribuyen tus gastos actuales</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData?.expenseDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData?.expenseDistribution?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
