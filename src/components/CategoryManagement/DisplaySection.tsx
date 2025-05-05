
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CategoryList } from './CategoryList';

interface DisplaySectionProps {
  setShowForm: (show: boolean) => void;
  onEdit: (category: any) => void;
}

export function DisplaySection({ setShowForm, onEdit }: DisplaySectionProps) {
  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowForm(true)}
        className="w-full"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar Nueva Categoría
      </Button>
      <CategoryList onEdit={onEdit} />
    </div>
  );
}
