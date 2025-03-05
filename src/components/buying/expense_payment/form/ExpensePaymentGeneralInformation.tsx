import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectShimmer,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Currency, Firm} from '@/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import React from 'react';
import { CalendarDatePicker } from '@/components/ui/calendar-day-picker';
import { useExpensePaymentManager } from '../hooks/useExpensePaymentManager';
import { EXPENSE_PAYMENT_MODE } from '@/types/expense-payment';
import { useExpensePaymentInvoiceManager } from '../hooks/useExpensePaymentInvoiceManager';
import { EXPENSE_INVOICE_STATUS, ExpenseInvoice } from '@/types/expense_invoices';

interface ExpensePaymentGeneralInformationProps {
  className?: string;
  firms: Firm[];
  currencies: Currency[];
  loading?: boolean;
}

export const ExpensePaymentGeneralInformation = ({
  className,
  firms,
  currencies,
  loading
}: ExpensePaymentGeneralInformationProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const { t: tCurrency } = useTranslation('currency');

  const paymentManager = useExpensePaymentManager();
  const invoiceManager = useExpensePaymentInvoiceManager();

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      <div className="flex flex-row gap-2">
        {/* Date */}
        <div className="flex flex-col gap-2 w-1/2">
          <Label>{tInvoicing('invoice.attributes.date')} (*)</Label>
          <CalendarDatePicker
            label={tCommon('pick_date')}
            date={
              paymentManager?.date
                ? { from: paymentManager?.date, to: undefined }
                : { from: undefined, to: undefined }
            }
            onDateSelect={({ from, to }) => {
              paymentManager.set('date', from);
            }}
            variant="outline"
            numberOfMonths={1}
            className="w-full py-4 mt-1"
            isPending={loading}
          />
        </div>
        {/* Firm */}
        <div className="flex flex-col gap-2 w-1/2">
          <Label>{tCommon('submenu.firms')} (*)</Label>
          <SelectShimmer isPending={loading}>
            <Select
              onValueChange={(e) => {
                const firm = firms?.find((firm) => firm.id === parseInt(e));
                paymentManager.set('firmId', firm?.id);
                paymentManager.set('firm', firm);
                paymentManager.set('currencyId', firm?.currency?.id);
                paymentManager.set('currency', firm?.currency);
                invoiceManager.reset();
                console.log('Firm invoices:', firm?.invoices);
                firm?.invoices?.forEach((invoice: ExpenseInvoice) => {
                  console.log('Invoice:', invoice.status); // Affiche le statut actuel
                  if (
                    invoice?.status &&
                    [
                      EXPENSE_INVOICE_STATUS.PartiallyPaid,
                      EXPENSE_INVOICE_STATUS.Validated,
                      EXPENSE_INVOICE_STATUS.Unpaid
                    ].includes(invoice.status as EXPENSE_INVOICE_STATUS)
                  ) {
                    invoiceManager.add({
                      amount: 0,
                      expenseInvoiceId: invoice.id,
                      expenseInvoice: invoice
                    });
                  }
                });                
              }}
              value={paymentManager.firmId?.toString()}>
              <SelectTrigger>
                <SelectValue placeholder={tInvoicing('invoice.associate_firm')} />
              </SelectTrigger>
              <SelectContent>
                {firms?.map((firm: Partial<Firm>) => (
                  <SelectItem key={firm.id} value={firm.id?.toString() || ''} className="mx-1">
                    {firm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SelectShimmer>
        </div>
      </div>
      <div className="flex flex-row gap-2">
        {/* Currency */}
        <div className="flex flex-col gap-2 w-1/3">
          <Label>{tInvoicing('payment.attributes.currency')}</Label>
          <SelectShimmer isPending={loading}>
            <Select
              key={paymentManager.currencyId || 'currency'}
              onValueChange={(e) => {
                const currency = currencies.find((currency) => currency.id == parseInt(e));
                paymentManager.set('currencyId', currency?.id);
                paymentManager.set('currency', currency);
                invoiceManager.init();
              }}
              disabled={currencies.length == 1}
              defaultValue={
                paymentManager?.currencyId ? paymentManager?.currencyId?.toString() : undefined
              }>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tInvoicing('controls.currency_select_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {currencies?.map((currency: Currency) => {
                  return (
                    <SelectItem key={currency.id} value={currency?.id?.toString() || ''}>
                      {currency?.code && tCurrency(currency?.code)} ({currency.symbol})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </SelectShimmer>
        </div>
        {/* Convertion Rate */}
        <div className="flex flex-col gap-2 w-1/3">
          <Label>{tInvoicing('payment.attributes.convertion_rate')}</Label>
          <Input
            type="number"
            placeholder="1"
            value={paymentManager.convertionRate}
            onChange={(e) => {
              paymentManager.set('convertionRate', parseFloat(e.target.value));
            }}
          />
        </div>
        {/* Mode */}
        <div className="flex flex-col gap-2 w-1/3">
          <Label>{tInvoicing('payment.attributes.mode')} (*)</Label>
          <SelectShimmer isPending={loading || false}>
            <Select
              onValueChange={(e) => {
                paymentManager.set('mode', e);
              }}
              value={paymentManager?.mode || ''}>
              <SelectTrigger>
                <SelectValue placeholder={tInvoicing('payment.attributes.mode')} />
              </SelectTrigger>
              <SelectContent>
                {Object.values( EXPENSE_PAYMENT_MODE).map((title) => (
                  <SelectItem key={title} value={title}>
                    {tInvoicing(title)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SelectShimmer>
        </div>
      </div>
      <div className="flex flex-row gap-2 ">
        {/* Amount */}
        <div className="flex flex-col gap-2 w-1/3">
          <Label>{tInvoicing('payment.attributes.amount')}</Label>
          <Input
            type="number"
            placeholder="0"
            value={paymentManager.amount}
            onChange={(e) => {
              paymentManager.set('amount', parseFloat(e.target.value));
            }}
          />
        </div>
        {/* Fee */}
        <div className="flex flex-col gap-2 w-1/3">
          <Label>{tInvoicing('payment.attributes.fee')}</Label>
          <Input
            type="number"
            placeholder="0"
            value={paymentManager.fee}
            onChange={(e) => {
              paymentManager.set('fee', parseFloat(e.target.value));
            }}
          />
        </div>
      </div>
    </div>
  );
};
