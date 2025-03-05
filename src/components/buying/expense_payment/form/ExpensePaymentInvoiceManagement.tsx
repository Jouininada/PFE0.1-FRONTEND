import React from 'react';
import { cn } from '@/lib/utils';
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  DndContext,
  closestCenter
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import SortableLinks from '@/components/ui/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Currency } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { PackageOpen } from 'lucide-react';
import { useExpensePaymentManager } from '../hooks/useExpensePaymentManager';
import { useExpensePaymentInvoiceManager } from '../hooks/useExpensePaymentInvoiceManager';
import { ExpensePaymentInvoiceItem } from './ExpensePaymentInvoiceItem';

interface ExpensePaymentInvoiceManagementProps {
  className?: string;
  loading?: boolean;
}
export const ExpensePaymentInvoiceManagement: React.FC<ExpensePaymentInvoiceManagementProps> = ({
  className,
  loading
}) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const paymentManager = useExpensePaymentManager();
  const invoiceManager = useExpensePaymentInvoiceManager();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = invoiceManager.invoices.findIndex((item) => item.id === active.id);
      const newIndex = invoiceManager.invoices.findIndex((item) => item.id === over.id);
      invoiceManager.setInvoices(
        arrayMove(
          invoiceManager.invoices.map((item) => item.invoice),
          oldIndex,
          newIndex
        ),
        paymentManager.currency || ({} as Currency),
        paymentManager.convertionRate
      );
    }
  }
  if (invoiceManager.invoices.length == 0)
    return (
      <div className="flex items-center justify-center gap-2 font-bold h-24 text-center ">
        {tInvoicing('payment.no_invoices')} <PackageOpen />
      </div>
    );
  return (
    <div className="border-b">
      <Card className={cn('w-full border-0 shadow-none', className)}>
        <CardHeader className="space-y-1 w-full">
          <div className="flex flex-row items-center">
            <div>
              <CardTitle className="text-2xl flex justify-between">
                {tInvoicing('invoice.plural')}
              </CardTitle>
              <CardDescription>{tInvoicing('article.manager-statement')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
            <SortableContext items={invoiceManager.invoices} strategy={verticalListSortingStrategy}>
              {loading && <Skeleton className="h-24 mr-2 my-5" />}
              {!loading &&
                invoiceManager.invoices.map((item) => (
                  <SortableLinks key={item.id} id={item}>
                    <ExpensePaymentInvoiceItem
                      invoiceEntry={item.invoice}
                      onChange={(invoice) => invoiceManager.update(item.id, invoice)}
                      currency={paymentManager.currency}
                      convertionRate={paymentManager.convertionRate}
                    />
                  </SortableLinks>
                ))}
            </SortableContext>
          </DndContext>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
    </div>
  );
};
