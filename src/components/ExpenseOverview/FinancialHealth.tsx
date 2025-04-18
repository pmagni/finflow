
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { calculateFinancialHealth } from '@/utils/financialHealthCalculator';
import { supabase } from '@/integrations/supabase/client';

const FinancialHealth = () => {
  const [healthData, setHealthData] = useState({
    score: 50,
    status: 'fair',
    goals: [
      { name: 'Loading...', progress: 0 }
    ],
    achievements: [
      { name: 'Loading...', unlocked: false, description: 'Loading...' }
    ],
    breakdown: {
      savingsScore: 0,
      spendingScore: 0,
      budgetScore: 0,
      debtScore: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const data = await calculateFinancialHealth();
        setHealthData(data);
      } catch (error) {
        console.error('Error fetching financial health data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHealthData();
    
    // Subscribe to changes in transactions
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' }, 
        () => {
          fetchHealthData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Get color based on status
  const getStatusColor = () => {
    switch (healthData.status) {
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
          {healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)}
        </Badge>
      </div>
      
      <div className="flex items-center mb-6">
        <div className="relative w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mr-4">
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#7EEBC6 ${healthData.score}%, transparent ${healthData.score}%)`,
              clipPath: 'circle(50% at 50% 50%)'
            }}
          />
          <div className="bg-finflow-card rounded-full w-16 h-16 flex items-center justify-center z-10">
            <span className="text-xl font-bold">{healthData.score}</span>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-md font-medium mb-1">Your Financial Score</h3>
          <p className="text-gray-400 text-sm">Based on your spending habits and savings</p>
        </div>
      </div>
      
      {/* Score Breakdown */}
      <div className="mb-5">
        <h3 className="text-md font-medium mb-3">Score Breakdown</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-800 p-2 rounded-lg">
            <p className="text-xs text-gray-400">Savings</p>
            <p className="text-sm font-medium">{healthData.breakdown.savingsScore}/100</p>
          </div>
          <div className="bg-gray-800 p-2 rounded-lg">
            <p className="text-xs text-gray-400">Spending</p>
            <p className="text-sm font-medium">{healthData.breakdown.spendingScore}/100</p>
          </div>
          <div className="bg-gray-800 p-2 rounded-lg">
            <p className="text-xs text-gray-400">Budget</p>
            <p className="text-sm font-medium">{healthData.breakdown.budgetScore}/100</p>
          </div>
          <div className="bg-gray-800 p-2 rounded-lg">
            <p className="text-xs text-gray-400">Debt Management</p>
            <p className="text-sm font-medium">{healthData.breakdown.debtScore}/100</p>
          </div>
        </div>
      </div>
      
      {/* Financial Goals */}
      <div className="mb-5">
        <h3 className="text-md font-medium mb-3">Financial Goals</h3>
        <div className="space-y-3">
          {healthData.goals.map((goal, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{goal.name}</span>
                <span>{Math.round(goal.progress * 100)}%</span>
              </div>
              <div className="finance-score-progress bg-gray-800 h-2 rounded">
                <div 
                  className="finance-score-progress-bar bg-finflow-mint h-full rounded"
                  style={{ width: `${goal.progress * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Achievements */}
      <div>
        <h3 className="text-md font-medium mb-3">Achievements</h3>
        <div className="grid grid-cols-1 gap-2">
          {healthData.achievements.map((achievement, index) => (
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
