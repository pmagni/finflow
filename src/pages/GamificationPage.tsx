
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { gamificationService } from '@/services/gamificationService';
import AchievementCard from '@/components/Gamification/AchievementCard';
import UserStats from '@/components/Gamification/UserStats';
import { Trophy, Target, Zap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const GamificationPage = () => {
  const { user, loading } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    achievements: 0,
    healthScore: 0,
    streak: 0
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadGamificationData = async () => {
      if (user) {
        try {
          const [achievementsData, statsData] = await Promise.all([
            gamificationService.getUserAchievements(user.id),
            gamificationService.getUserStats(user.id)
          ]);
          
          setAchievements(achievementsData);
          setUserStats(statsData);
        } catch (error) {
          console.error('Error loading gamification data:', error);
          toast.error('Error al cargar datos de gamificación');
        } finally {
          setLoadingData(false);
        }
      }
    };

    if (!loading && user) {
      loadGamificationData();
    }
  }, [user, loading]);

  const calculateHealthScore = async () => {
    if (!user) return;
    
    try {
      const healthScore = await gamificationService.calculateHealthScore(user.id);
      setUserStats(prev => ({
        ...prev,
        healthScore: healthScore.score
      }));
      
      toast.success('Puntuación de salud financiera actualizada');
    } catch (error) {
      console.error('Error calculating health score:', error);
      toast.error('Error al calcular puntuación de salud');
    }
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-finflow-dark">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-finflow-mint"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-finflow-dark text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-finflow-mint" />
              Gamificación
            </h1>
            <p className="text-gray-400 mt-2">
              Sigue tu progreso y desbloquea logros financieros
            </p>
          </div>
          <Button
            onClick={calculateHealthScore}
            className="bg-finflow-mint hover:bg-finflow-mint-dark text-black"
          >
            <Zap className="h-4 w-4 mr-2" />
            Actualizar Salud Financiera
          </Button>
        </div>

        {/* User Stats */}
        <div className="mb-8">
          <UserStats stats={userStats} />
        </div>

        {/* Achievements Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-6 w-6 text-finflow-mint" />
            <h2 className="text-2xl font-bold">Mis Logros</h2>
            <span className="text-sm text-gray-400">({achievements.length} desbloqueados)</span>
          </div>
          
          {achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                />
              ))}
            </div>
          ) : (
            <Card className="bg-finflow-card border-gray-700">
              <CardContent className="p-8 text-center">
                <Trophy className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-300 mb-2">
                  Aún no tienes logros
                </h3>
                <p className="text-gray-400 mb-4">
                  Comienza a usar la aplicación para desbloquear tus primeros logros
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <h4 className="font-semibold text-finflow-mint">Primera Transacción</h4>
                    <p className="text-gray-400">Registra tu primera transacción</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <h4 className="font-semibold text-blue-400">Primer Presupuesto</h4>
                    <p className="text-gray-400">Crea tu primer presupuesto mensual</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <h4 className="font-semibold text-yellow-400">Meta Cumplida</h4>
                    <p className="text-gray-400">Completa tu primera meta financiera</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Progress Indicators */}
        <Card className="bg-finflow-card border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-finflow-mint" />
              Progreso General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">Salud Financiera</span>
                  <span className="text-sm font-semibold">{userStats.healthScore}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-finflow-mint h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(userStats.healthScore, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">Logros Desbloqueados</span>
                  <span className="text-sm font-semibold">{userStats.achievements}/10</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((userStats.achievements / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GamificationPage;
