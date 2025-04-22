# Documentación de API

## Interfaces Principales

### MonthlyTransactionSummary

```typescript
interface MonthlyTransactionSummary {
  income: {
    total: number;
    byCategory: Record<string, number>;
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
  };
  balance: number;
  availableMonths: Array<{
    month: number;
    year: number;
    label: string;
  }>;
}
```

**Descripción**: Representa el resumen mensual de transacciones, incluyendo ingresos, gastos y balance.

### ChartDataPoint

```typescript
interface ChartDataPoint {
  month: string;
  [key: string]: number | string;
}
```

**Descripción**: Representa un punto de datos para los gráficos, con el mes y valores asociados.

## Servicios

### TransactionService

Clase singleton que maneja todas las operaciones relacionadas con transacciones.

#### Métodos

##### getTransactionsByMonth

```typescript
async getTransactionsByMonth(month: number, year: number): Promise<MonthlyTransactionSummary>
```

**Parámetros**:
- `month`: Número del mes (1-12)
- `year`: Año

**Retorna**: Resumen mensual de transacciones

**Ejemplo**:
```typescript
const summary = await transactionService.getTransactionsByMonth(3, 2024);
console.log(summary.income.total); // Total de ingresos
console.log(summary.expenses.total); // Total de gastos
```

## Manejo de Errores

### AppError

Clase base para todos los errores de la aplicación.

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: any
  )
}
```

**Códigos de Error**:
- `VALIDATION_ERROR`: Error de validación (400)
- `AUTHENTICATION_ERROR`: Error de autenticación (401)
- `DATABASE_ERROR`: Error de base de datos (500)
- `UNKNOWN_ERROR`: Error desconocido (500)

## Internacionalización

### useTranslation

Hook para manejar traducciones.

```typescript
const { t } = useTranslation();
t('common.loading'); // "Cargando..."
```

**Estructura de Traducciones**:
```typescript
{
  common: {
    loading: string;
    error: string;
    success: string;
    // ...
  },
  dashboard: {
    title: string;
    monthlyExpenses: string;
    // ...
  },
  // ...
}
``` 