import { EXPENSE_PAYMENT_CONDITION_FILTER_ATTRIBUTES } from '@/constants/expense-payment-condition.filter-attributes';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';
import { ExpensePaymentCondition } from '@/types/expense-payment-condition';



export const getPayementConditionColumns = (t: Function): ColumnDef<ExpensePaymentCondition>[] => {
  const translationNamespace = 'settings';
  const translate = (value: string, namespace: string = '') => {
    return t(value, { ns: namespace || translationNamespace });
  };

  return [
    {
      accessorKey: 'label',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('payment_condition.attributes.label')}
          attribute={EXPENSE_PAYMENT_CONDITION_FILTER_ATTRIBUTES.LABEL}
        />
      ),
      cell: ({ row }) => <div>{row.original.label}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('payment_condition.attributes.description')}
          attribute={EXPENSE_PAYMENT_CONDITION_FILTER_ATTRIBUTES.DESCRIPTION}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original.description || <span className="text-slate-400">Aucune Description</span>}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },

    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DataTableRowActions row={row} />
        </div>
      )
    }
  ];
};
