import React from 'react';
import { Currency, Tax } from '@/types';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { ciel } from '@/utils/number.utils';
import { useExpensePaymentManager } from '../hooks/useExpensePaymentManager';
import { useExpensePaymentInvoiceManager } from '../hooks/useExpensePaymentInvoiceManager';

interface ExpensePaymentFinancialInformationProps {
  className?: string;
  currency?: Currency;
  loading?: boolean;
}

export const ExpensePaymentFinancialInformation = ({
  className,
  currency,
  loading
}: ExpensePaymentFinancialInformationProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const paymentManager = useExpensePaymentManager();
  const invoiceManager = useExpensePaymentInvoiceManager();

  //get currency symbol
  const currencySymbol = React.useMemo(() => currency?.symbol || '$', [currency]);

  const currencyDigitAfterComma = React.useMemo(() => currency?.digitAfterComma || 0, [currency]);
  const customCiel = React.useCallback(
    (n: number) => ciel(n, currencyDigitAfterComma + 1),
    [currencyDigitAfterComma]
  );

  const amountPaid = React.useMemo(() => {
    return paymentManager.amount || 0;
  }, [paymentManager.amount]);

  const fee = React.useMemo(() => {
    return paymentManager.fee || 0;
  }, [paymentManager.fee]);

  const available = React.useMemo(() => {
    return customCiel(amountPaid + fee);
  }, [customCiel, amountPaid, fee]);

  const used = React.useMemo(() => {
    return invoiceManager.calculateUsedAmount();
  }, [invoiceManager, currencyDigitAfterComma]);

  const remaining_amount = React.useMemo(() => {
    return customCiel(available - used);
  }, [customCiel, available, used]);

  return (
    <div className={cn(className)}>
      <div className="flex flex-col w-full">
        <div className="flex my-2">
          <Label className="mr-auto">{tInvoicing('payment.financial_status.received')}</Label>
          <Label className="ml-auto" isPending={loading || false}>
            {available?.toFixed(currencyDigitAfterComma)} {currencySymbol}
          </Label>
        </div>
      </div>
      <div className="flex flex-col w-full mt-1">
        <div className="flex my-2">
          <Label className="mr-auto">{tInvoicing('payment.financial_status.used')}</Label>
          <Label className="ml-auto" isPending={loading || false}>
            {used?.toFixed(currencyDigitAfterComma)} {currencySymbol}
          </Label>
        </div>
      </div>
      <div className="flex flex-col w-full border-t pt-1">
        <div className="flex my-2">
          <Label className="mr-auto">{tInvoicing('payment.financial_status.available')}</Label>
          <Label className="ml-auto" isPending={loading || false}>
            {remaining_amount?.toFixed(currencyDigitAfterComma)} {currencySymbol}
          </Label>
        </div>
      </div>
    </div>
  );
};
