
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingBag, Coffee, Bus, Film, Gift, Tv, Home, BadgeDollarSign } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().min(1, 'Icon is required'),
  transaction_type: z.enum(['income', 'expense']),
});

const icons = [
  { name: 'shopping-bag', icon: ShoppingBag },
  { name: 'coffee', icon: Coffee },
  { name: 'bus', icon: Bus },
  { name: 'film', icon: Film },
  { name: 'gift', icon: Gift },
  { name: 'tv', icon: Tv },
  { name: 'home', icon: Home },
  { name: 'badge-dollar-sign', icon: BadgeDollarSign },
];

interface CategoryFormProps {
  initialData?: {
    id?: string;
    name: string;
    icon: string;
    transaction_type: 'income' | 'expense';
  };
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
  onCancel: () => void;
}

export function CategoryForm({ initialData, onSubmit, onCancel }: CategoryFormProps) {
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon || 'shopping-bag');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      icon: initialData?.icon || 'shopping-bag',
      transaction_type: initialData?.transaction_type || 'expense',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="transaction_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Categoría</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa nombre de la categoría" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <div className="grid grid-cols-4 gap-2">
                  {icons.map(({ name, icon: Icon }) => (
                    <Button
                      key={name}
                      type="button"
                      variant={selectedIcon === name ? 'default' : 'outline'}
                      className="p-2"
                      onClick={() => {
                        setSelectedIcon(name);
                        field.onChange(name);
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Crear'} Categoría
          </Button>
        </div>
      </form>
    </Form>
  );
}
