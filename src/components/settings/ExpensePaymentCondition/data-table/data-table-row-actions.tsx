import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Settings2, Trash2 } from 'lucide-react';
import { ExpensePaymentCondition } from '@/types/expense-payment-condition';
import { useExpensePaymentConditionActions } from './ActionsContext';
import { useExpensePaymentConditionManager } from '../hooks/usePaymentConditionManager';

interface DataTableRowActionsProps {
  row: Row<ExpensePaymentCondition>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const condition = row.original;
  const { t: tCommon } = useTranslation('common');
  const paymentConditionManager = useExpensePaymentConditionManager();
  const { openUpdateDialog, openDeleteDialog } = useExpensePaymentConditionActions();

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
        <DropdownMenuItem
          onClick={() => {
            paymentConditionManager.setPaymentCondition(condition);
            openUpdateDialog();
          }}>
          <Settings2 className="h-5 w-5 mr-2" /> {tCommon('commands.modify')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            paymentConditionManager.setPaymentCondition(condition);
            openDeleteDialog();
          }}>
          <Trash2 className="h-5 w-5 mr-2" /> {tCommon('commands.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
