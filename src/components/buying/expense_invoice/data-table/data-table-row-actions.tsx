import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Copy, Settings2, Telescope, Trash2 } from 'lucide-react';
import { ExpenseInvoice } from '@/types/expense_invoices';
import { useExpenseInvoiceManager } from '../hooks/useExpenseInvoiceManager';
import { ExpenseUseInvoiceActions } from './ActionsContext';


interface DataTableRowActionsProps {
  row: Row<ExpenseInvoice>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const invoice = row.original;
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const invoiceManager = useExpenseInvoiceManager();
  const { openDeleteDialog,openDuplicateDialog } = ExpenseUseInvoiceActions();

  const targetInvoice = () => {
    invoiceManager.set('id', invoice?.id);
    invoiceManager.set('sequential', invoice?.sequential);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-[160px]">
        <DropdownMenuLabel className="text-center">{tCommon('commands.actions')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Inspect */}
        <DropdownMenuItem onClick={() => router.push('/buying/expense_invoice/' + invoice.id)}>
          <Telescope className="h-5 w-5 mr-2" /> {tCommon('commands.inspect')}
        </DropdownMenuItem>
        {/* Print */}
        {/* Duplicate */}
        <DropdownMenuItem
          onClick={() => {
            targetInvoice();
            openDuplicateDialog?.();
          }}>
          <Copy className="h-5 w-5 mr-2" /> {tCommon('commands.duplicate')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/buying/expense_invoice/' + invoice.id)}>
          <Settings2 className="h-5 w-5 mr-2" /> {tCommon('commands.modify')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            targetInvoice();
            openDeleteDialog?.();
          }}>
          <Trash2 className="h-5 w-5 mr-2" /> {tCommon('commands.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
