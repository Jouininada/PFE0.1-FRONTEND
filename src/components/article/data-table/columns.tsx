import { ColumnDef } from '@tanstack/react-table';
import { Article } from '@/types';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';


export const getArticleColumns = (
  t: Function,
  router: any
): ColumnDef<Article>[] => [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('article.attributes.title')} />
    ),
    cell: ({ row }) => <div>{row.original.title}</div>,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('article.attributes.description')} />
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