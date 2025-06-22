
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Category, Transaction } from '@/types';
import { formatCurrency } from '@/utils/formatters';

const BudgetPlanner = () => {
  const [income, setIncome] = useState<number>(0);
  const [fixedExpenses, setFixedExpenses] = useState<number>(0);
  const [variableExpenses, setVariableExpenses] = useState<number>(0);
  const [savingsGoal, setSavingsGoal] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(name, icon)
        `)
        .order('transaction_date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      // Format transactions data
      const formattedTransactions = (transactionsData || []).map(transaction => ({
        ...transaction,
        type: transaction.type as 'income' | 'expense',
        category: transaction.category || transaction.category_name || 'Sin categoría'
      })) as Transaction[];

      setTransactions(formattedTransactions);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudget = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes iniciar sesión para guardar el presupuesto');
        return;
      }

      const { error } = await supabase
        .from('budgets')
        .upsert({
          user_id: user.id,
          income,
          fixed_expenses: fixedExpenses,
          variable_expenses: variableExpenses,
          savings_goal: savingsGoal,
          month: new Date().toISOString().slice(0, 7)
        });

      if (error) throw error;
      toast.success('Presupuesto guardado exitosamente');
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Error al guardar el presupuesto');
    }
  };

  const calculateByCategory = () => {
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        let categoryName: string;
        
        if (typeof transaction.category === 'object') {
          categoryName = transaction.category.name;
        } else {
          categoryName = transaction.category || transaction.category_name || 'Sin categoría';
        }
        
        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName] += transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount
    }));
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const remainingBudget = income - fixedExpenses - variableExpenses - savingsGoal;
  const expensesByCategory = calculateByCategory();

  if (isLoading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Planificador de Presupuesto</h1>
        <p className="text-gray-400">Planifica y controla tus finanzas personales</p>
      </div>

      <Tabs defaultValue="planner" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="planner">Planificador</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="planner" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Presupuesto</CardTitle>
                <CardDescription>
                  Define tus ingresos y gastos planificados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="income">Ingresos Mensuales</Label>
                  <Input
                    id="income"
                    type="number"
                    value={income || ''}
                    onChange={(e) => setIncome(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fixed">Gastos Fijos</Label>
                  <Input
                    id="fixed"
                    type="number"
                    value={fixedExpenses || ''}
                    onChange={(e) => setFixedExpenses(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variable">Gastos Variables</Label>
                  <Input
                    id="variable"
                    type="number"
                    value={variableExpenses || ''}
                    onChange={(e) => setVariableExpenses(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="savings">Meta de Ahorro</Label>
                  <Input
                    id="savings"
                    type="number"
                    value={savingsGoal || ''}
                    onChange={(e) => setSavingsGoal(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <Button onClick={saveBudget} className="w-full">
                  Guardar Presupuesto
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen del Presupuesto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Ingresos:</span>
                  <span className="font-semibold text-green-500">
                    {formatCurrency(income)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Gastos Fijos:</span>
                  <span className="font-semibold text-red-500">
                    -{formatCurrency(fixedExpenses)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Gastos Variables:</span>
                  <span className="font-semibold text-red-500">
                    -{formatCurrency(variableExpenses)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Meta de Ahorro:</span>
                  <span className="font-semibold text-blue-500">
                    -{formatCurrency(savingsGoal)}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Disponible:</span>
                  <span className={remainingBudget >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {formatCurrency(remainingBudget)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gastos por Categoría</CardTitle>
                <CardDescription>
                  Análisis de tus gastos reales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expensesByCategory.map(({ category, amount }) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm">{category}</span>
                      <Badge variant="destructive">
                        {formatCurrency(amount)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparación Real vs Planificado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Ingresos Reales:</span>
                  <span className="font-semibold text-green-500">
                    {formatCurrency(totalIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Gastos Reales:</span>
                  <span className="font-semibold text-red-500">
                    {formatCurrency(totalExpenses)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Balance Real:</span>
                  <span className={totalIncome - totalExpenses >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {formatCurrency(totalIncome - totalExpenses)}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Diferencia vs Plan:</span>
                  <span className={(totalIncome - totalExpenses) - remainingBudget >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {formatCurrency((totalIncome - totalExpenses) - remainingBudget)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BudgetPlanner;
