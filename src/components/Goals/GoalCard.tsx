
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Goal } from '@/services/goalService';
import { CheckCircle, Target, TrendingUp } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onAddProgress: (id: string) => void;
}

export const GoalCard = ({ goal, onEdit, onDelete, onAddProgress }: GoalCardProps) => {
  const progressPercentage = Math.min(goal.progress, 100);
  const remainingAmount = Math.max(goal.target - goal.current_amount, 0);

  return (
    <Card className={`relative ${goal.completed ? 'border-green-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {goal.completed ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Target className="w-5 h-5 text-blue-500" />
            )}
            {goal.name}
          </CardTitle>
          {goal.completed && (
            <div className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
              ¡Completado!
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Actual</p>
            <p className="font-semibold">${goal.current_amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Meta</p>
            <p className="font-semibold">${goal.target.toLocaleString()}</p>
          </div>
        </div>

        {!goal.completed && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Falta</p>
              <p className="font-semibold text-orange-600">${remainingAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Mensual</p>
              <p className="font-semibold">${goal.monthly_contribution.toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {!goal.completed && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddProgress(goal.id)}
              className="flex-1"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Agregar Progreso
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(goal)}
            className="flex-1"
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(goal.id)}
          >
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
