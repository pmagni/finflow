
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminService, AdminMetrics } from '@/services/adminService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Activity, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const AdminPage = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const adminStatus = await adminService.isAdmin();
          setIsAdmin(adminStatus);
          
          if (adminStatus) {
            const metricsData = await adminService.getAdminMetrics();
            setMetrics(metricsData);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          toast.error('Error al verificar permisos de administrador');
        } finally {
          setLoadingMetrics(false);
        }
      }
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading]);

  if (loading || loadingMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-finflow-mint"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-finflow-dark text-white flex items-center justify-center">
        <Card className="bg-finflow-card border-gray-700">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-400 mb-2">Acceso Denegado</h2>
            <p className="text-gray-300">No tienes permisos de administrador para acceder a esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-finflow-dark text-white flex items-center justify-center">
        <Card className="bg-finflow-card border-gray-700">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-yellow-400 mb-2">Error al cargar métricas</h2>
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Usuarios',
      value: metrics.totalUsers,
      icon: <Users className="h-6 w-6 text-blue-400" />,
      color: 'text-blue-400'
    },
    {
      title: 'Usuarios Activos',
      value: metrics.activeUsers,
      icon: <Activity className="h-6 w-6 text-green-400" />,
      color: 'text-green-400'
    },
    {
      title: 'Total Transacciones',
      value: metrics.totalTransactions,
      icon: <TrendingUp className="h-6 w-6 text-purple-400" />,
      color: 'text-purple-400'
    },
    {
      title: 'Ingresos Totales',
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      icon: <DollarSign className="h-6 w-6 text-finflow-mint" />,
      color: 'text-finflow-mint'
    }
  ];

  return (
    <div className="min-h-screen bg-finflow-dark text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-gray-400 mt-2">Métricas y estadísticas del sistema</p>
          </div>
          <Badge variant="secondary" className="bg-finflow-mint text-black">
            Administrador
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="bg-finflow-card border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-gray-300">{stat.title}</CardTitle>
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Categories Chart */}
          <Card className="bg-finflow-card border-gray-700">
            <CardHeader>
              <CardTitle>Top Categorías</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.topCategories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="category" 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="total" fill="#ace417" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Growth Chart */}
          <Card className="bg-finflow-card border-gray-700">
            <CardHeader>
              <CardTitle>Crecimiento de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#ace417" 
                    strokeWidth={2}
                    dot={{ fill: '#ace417' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <Card className="bg-finflow-card border-gray-700">
          <CardHeader>
            <CardTitle>Métricas Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {metrics.averageHealthScore}%
                </div>
                <div className="text-sm text-gray-400">Salud Financiera Promedio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {(metrics.totalRevenue / metrics.totalUsers).toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Ingresos por Usuario</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Tasa de Actividad</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
