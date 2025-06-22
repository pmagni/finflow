
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { Budget } from '@/services/budgetService';

interface BudgetHealthIndicatorProps {
  budget: Budget;
  healthAnalysis: {
    isHealthy: boolean;
    warnings: string[];
    suggestions: string[];
  };
}

export const BudgetHealthIndicator = ({ budget, healthAnalysis }: BudgetHealthIndicatorProps) => {
  const { isHealthy, warnings, suggestions } = healthAnalysis;
  
  const totalExpenses = (budget.fixed_expenses || 0) + (budget.variable_expenses || 0);
  const remainingIncome = (budget.income || 0) - totalExpenses - (budget.savings_goal || 0);
  
  return (
    <Card className={`border-l-4 ${isHealthy ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isHealthy ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          )}
          Salud Financiera
          <Badge variant={isHealthy ? 'default' : 'secondary'}>
            {isHealthy ? 'Saludable' : 'Requiere Atención'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Ingresos Restantes</p>
            <p className={`font-semibold ${remainingIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${remainingIncome.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Tasa de Ahorro</p>
            <p className="font-semibold">
              {budget.income ? ((budget.savings_goal || 0) / budget.income * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Advertencias
            </h4>
            {warnings.map((warning, index) => (
              <Alert key={index} className="border-yellow-200">
                <AlertDescription className="text-sm">{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-blue-700 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Sugerencias
            </h4>
            {suggestions.map((suggestion, index) => (
              <Alert key={index} className="border-blue-200">
                <AlertDescription className="text-sm">{suggestion}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
