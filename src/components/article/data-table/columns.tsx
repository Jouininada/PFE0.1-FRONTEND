import { ColumnDef } from '@tanstack/react-table';
import { Article } from '@/types';
import { DataTableRowActions } from './data-table-row-actions';
import { DataTableColumnHeader } from '@/components/administrative-tools/Logger/data-table/data-table-column-header';


export const getArticleColumns = (
  t: Function,
  router: any
): ColumnDef<Article>[] => [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Titre')} />
    ),
    cell: ({ row }) => <div>{row.original.title}</div>,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Description')} />
    ),
    cell: ({ row }) => <div className="truncate max-w-xs">{row.original.description}</div>,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DataTableRowActions row={row} />
      </div>
    ),
  },
];