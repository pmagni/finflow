
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getFinancialHealthScore } from '@/services/expenseService';
import { Star } from 'lucide-react';

const FinancialHealth = () => {
  const { score, status, goals, achievements } = getFinancialHealthScore();
  
  // Get color based on status
  const getStatusColor = () => {
    switch (status) {
      case 'poor': return 'bg-red-500';
      case 'fair': return 'bg-yellow-500';
      case 'good': return 'bg-finflow-mint';
      case 'excellent': return 'bg-green-400';
      default: return 'bg-finflow-mint';
    }
  };
  
  return (
    <div className="bg-finflow-card rounded-2xl p-5 mb-5 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Financial Health</h2>
        <Badge className={`${getStatusColor()} text-black`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
      
      <div className="flex items-center mb-6">
        <div className="relative w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mr-4">
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#7EEBC6 ${score}%, transparent ${score}%)`,
              clipPath: 'circle(50% at 50% 50%)'
            }}
          />
          <div className="bg-finflow-card rounded-full w-16 h-16 flex items-center justify-center z-10">
            <span className="text-xl font-bold">{score}</span>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-md font-medium mb-1">Your Financial Score</h3>
          <p className="text-gray-400 text-sm">Based on your spending habits and savings</p>
        </div>
      </div>
      
      <div className="mb-5">
        <h3 className="text-md font-medium mb-3">Financial Goals</h3>
        <div className="space-y-3">
          {goals.map((goal, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{goal.name}</span>
                <span>{Math.round(goal.progress * 100)}%</span>
              </div>
              <div className="finance-score-progress">
                <div 
                  className="finance-score-progress-bar"
                  style={{ width: `${goal.progress * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-md font-medium mb-3">Achievements</h3>
        <div className="grid grid-cols-1 gap-2">
          {achievements.map((achievement, index) => (
            <div 
              key={index} 
              className={`flex items-center p-2 rounded-lg ${achievement.unlocked ? 'bg-gray-800' : 'bg-gray-900 opacity-50'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${achievement.unlocked ? 'bg-finflow-mint text-black' : 'bg-gray-700'}`}>
                <Star size={16} />
              </div>
              <div>
                <h4 className="text-sm font-medium">{achievement.name}</h4>
                <p className="text-xs text-gray-400">{achievement.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialHealth;
