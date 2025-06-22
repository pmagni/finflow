
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Target } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  achieved_at: string;
}

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard = ({ achievement }: AchievementCardProps) => {
  const getIcon = (title: string) => {
    if (title.includes('Primera')) return <Award className="h-6 w-6 text-finflow-mint" />;
    if (title.includes('Meta')) return <Target className="h-6 w-6 text-blue-400" />;
    return <Trophy className="h-6 w-6 text-yellow-400" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card className="bg-finflow-card border-gray-700 hover:border-finflow-mint transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getIcon(achievement.title)}
            <CardTitle className="text-lg">{achievement.title}</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-finflow-mint text-black">
            {formatDate(achievement.achieved_at)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300">{achievement.description}</p>
      </CardContent>
    </Card>
  );
};

export default AchievementCard;
