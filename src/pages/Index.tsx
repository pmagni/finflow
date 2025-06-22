
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatters';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { FinancialOverview } from '@/components/Dashboard/FinancialOverview';

const Index = () => {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    transactionCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('type, amount');

      if (error) throw error;

      const income = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const expenses = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      setStats({
        totalIncome: income,
        totalExpenses: expenses,
        balance: income - expenses,
        transactionCount: transactions?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error al cargar las estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Financiero</h1>
        <p className="text-gray-400">
          Resumen de tu situación financiera actual
        </p>
      </div>

      {/* Integración del FinancialOverview */}
      <div className="mb-8">
        <FinancialOverview />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(stats.balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Balance actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(stats.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de ingresos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(stats.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de gastos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.transactionCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Total registradas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Gestiona tus finanzas de manera eficiente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate('/transactions')} 
              className="w-full justify-start"
              variant="outline"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Transacción
            </Button>
            <Button 
              onClick={() => navigate('/budget')} 
              className="w-full justify-start"
              variant="outline"
            >
              <Target className="mr-2 h-4 w-4" />
              Planificar Presupuesto
            </Button>
            <Button 
              onClick={() => navigate('/goals')} 
              className="w-full justify-start"
              variant="outline"
            >
              <Target className="mr-2 h-4 w-4" />
              Gestionar Metas
            </Button>
            <Button 
              onClick={() => navigate('/debt')} 
              className="w-full justify-start"
              variant="outline"
            >
              <TrendingDown className="mr-2 h-4 w-4" />
              Gestionar Deudas
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consejo Financiero</CardTitle>
            <CardDescription>
              Mejora tus hábitos financieros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 mb-4">
              {stats.balance >= 0 
                ? "¡Excelente! Mantienes un balance positivo. Considera invertir tus ahorros para hacer crecer tu dinero."
                : "Tu balance es negativo. Te recomendamos revisar tus gastos y crear un plan de ahorro."
              }
            </p>
            <Button 
              onClick={() => navigate('/assistant')} 
              className="w-full"
              variant="default"
            >
              Hablar con el Asistente IA
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
