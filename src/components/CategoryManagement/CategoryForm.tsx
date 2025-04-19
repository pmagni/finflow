
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
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  icon: z.string().min(1, 'Icon is required'),
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
    color: string;
    icon: string;
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
      color: initialData?.color || '#9b87f5',
      icon: initialData?.icon || 'shopping-bag',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter category name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <Input type="color" {...field} />
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
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'} Category
          </Button>
        </div>
      </form>
    </Form>
  );
}
