
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { formatCurrency } from '@/utils/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Debt {
  id: string;
  name: string | null;
  balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  user_id: string;
  created_at: string | null;
}

const DebtPage = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    balance: 0,
    interest_rate: 0,
    minimum_payment: 0
  });

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDebts(data || []);
    } catch (error) {
      console.error('Error fetching debts:', error);
      toast.error('Error al cargar las deudas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes iniciar sesión');
        return;
      }

      if (editingDebt) {
        const { error } = await supabase
          .from('debts')
          .update({
            name: formData.name,
            balance: formData.balance,
            interest_rate: formData.interest_rate,
            minimum_payment: formData.minimum_payment
          })
          .eq('id', editingDebt.id);

        if (error) throw error;
        toast.success('Deuda actualizada exitosamente');
      } else {
        const { error } = await supabase
          .from('debts')
          .insert({
            name: formData.name,
            balance: formData.balance,
            interest_rate: formData.interest_rate,
            minimum_payment: formData.minimum_payment,
            user_id: user.id
          });

        if (error) throw error;
        toast.success('Deuda agregada exitosamente');
      }

      setIsDialogOpen(false);
      setEditingDebt(null);
      setFormData({ name: '', balance: 0, interest_rate: 0, minimum_payment: 0 });
      fetchDebts();
    } catch (error) {
      console.error('Error saving debt:', error);
      toast.error('Error al guardar la deuda');
    }
  };

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name || '',
      balance: debt.balance,
      interest_rate: debt.interest_rate || 0,
      minimum_payment: debt.minimum_payment || 0
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Deuda eliminada exitosamente');
      fetchDebts();
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast.error('Error al eliminar la deuda');
    }
  };

  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalMinimumPayment = debts.reduce((sum, debt) => sum + (debt.minimum_payment || 0), 0);

  if (isLoading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Deudas</h1>
          <p className="text-gray-400">Controla y planifica el pago de tus deudas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-finflow-mint hover:bg-finflow-mint-dark text-black">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Deuda
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDebt ? 'Editar Deuda' : 'Agregar Nueva Deuda'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Deuda</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Tarjeta de Crédito"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance">Saldo Actual</Label>
                <Input
                  id="balance"
                  type="number"
                  value={formData.balance || ''}
                  onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest_rate">Tasa de Interés (%)</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  value={formData.interest_rate || ''}
                  onChange={(e) => setFormData({ ...formData, interest_rate: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum_payment">Pago Mínimo</Label>
                <Input
                  id="minimum_payment"
                  type="number"
                  value={formData.minimum_payment || ''}
                  onChange={(e) => setFormData({ ...formData, minimum_payment: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingDebt ? 'Actualizar' : 'Agregar'} Deuda
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(totalDebt)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pago Mínimo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalMinimumPayment)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Número de Deudas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {debts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Deudas</CardTitle>
          <CardDescription>
            Gestiona todas tus deudas desde un solo lugar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No tienes deudas registradas</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Agregar Primera Deuda
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {debts.map((debt) => (
                <div key={debt.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{debt.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-400">
                      <span>Saldo: {formatCurrency(debt.balance)}</span>
                      {debt.interest_rate && (
                        <span>Interés: {debt.interest_rate}%</span>
                      )}
                      {debt.minimum_payment && (
                        <span>Pago mínimo: {formatCurrency(debt.minimum_payment)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(debt)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(debt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DebtPage;
