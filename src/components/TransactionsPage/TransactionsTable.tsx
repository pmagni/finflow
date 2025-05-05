import React, { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transaction } from '@/types';
import { ArrowDown, ArrowUp, CalendarIcon, Copy, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface TransactionsTableProps {
  transactions: Transaction[];
}

// Fix the default export
const TransactionsTable = ({ transactions = [] }: TransactionsTableProps) => {
  const [sorting, setSorting] = useState<any[]>([]);
  const [columnFilters, setColumnFilters] = useState<any[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'date',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Fecha
            <ArrowUp className={cn("ml-2 h-4 w-4", column.getIsSorted() === 'asc' && 'hidden')} />
            <ArrowDown className={cn("ml-2 h-4 w-4", column.getIsSorted() === 'desc' && 'hidden')} />
          </Button>
        )
      },
      cell: ({ row }) => format(new Date(row.getValue("date")), "PPP"),
      filterFn: (row, id, value: DateRange) => {
        const date = new Date(row.getValue(id));
        if (value.from) {
          if (value.to) {
            return date >= value.from && date <= value.to
          }
          return date >= value.from
        }
        return true
      },
    },
    {
      accessorKey: 'description',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Descripción
            <ArrowUp className={cn("ml-2 h-4 w-4", column.getIsSorted() === 'asc' && 'hidden')} />
            <ArrowDown className={cn("ml-2 h-4 w-4", column.getIsSorted() === 'desc' && 'hidden')} />
          </Button>
        )
      },
    },
    {
      accessorKey: 'category.name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Categoría
            <ArrowUp className={cn("ml-2 h-4 w-4", column.getIsSorted() === 'asc' && 'hidden')} />
            <ArrowDown className={cn("ml-2 h-4 w-4", column.getIsSorted() === 'desc' && 'hidden')} />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Badge variant="secondary">
            {row.getValue('category.name')}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Monto
            <ArrowUp className={cn("ml-2 h-4 w-4", column.getIsSorted() === 'asc' && 'hidden')} />
            <ArrowDown className={cn("ml-2 h-4 w-4", column.getIsSorted() === 'desc' && 'hidden')} />
          </Button>
        )
      },
      cell: ({ row }) => formatCurrency(row.getValue("amount")),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const transaction = row.original;

        return (
          <div className="relative flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  {/* <MoreHorizontal className="h-4 w-4" /> */}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                //   onClick={() => onCopy(payment.id)}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copiar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                //   onClick={() => onDelete(payment.id)}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getCoreRowModel(),
    getSortedRowModel: getCoreRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const handleDateChange = (range: DateRange | undefined) => {
    setDateFilter(range);
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrar transacciones..."
          value={globalFilter ?? ""}
          onChange={e => setGlobalFilter(e.target.value)}
          className="mr-4"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[300px] pl-3 text-left font-normal",
                !dateFilter?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter?.from ? (
                dateFilter.to ? (
                  <>
                    {format(dateFilter.from, "PPP")} - {format(dateFilter.to, "PPP")}
                  </>
                ) : (
                  format(dateFilter.from, "PPP")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={dateFilter?.from}
              selected={dateFilter}
              onSelect={handleDateChange}
              disabled={(date) =>
                date > addDays(new Date(), 0) || date < addDays(new Date(), -365)
              }
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionsTable;
