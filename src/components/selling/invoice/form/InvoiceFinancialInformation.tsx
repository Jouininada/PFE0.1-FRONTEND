import React from 'react';
import { Currency, INVOICE_STATUS, Tax, TaxWithholding } from '@/types';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectShimmer,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useInvoiceArticleManager } from '../hooks/useInvoiceArticleManager';
import { useInvoiceManager } from '../hooks/useInvoiceManager';
import { useInvoiceControlManager } from '../hooks/useInvoiceControlManager';
import { ciel } from '@/utils/number.utils';

interface InvoiceFinancialInformationProps {
  className?: string;
  status: INVOICE_STATUS;
  subTotal?: number;
  discount?: number;
  currency?: Currency;
  taxes: Tax[];
  taxWithholdings?: TaxWithholding[];
  loading?: boolean;
  edit?: boolean;
}

export const InvoiceFinancialInformation = ({
  className,
  subTotal,
  status,
  currency,
  taxes,
  taxWithholdings,
  loading,
  edit = true
}: InvoiceFinancialInformationProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');

  const invoiceArticleManager = useInvoiceArticleManager();
  const invoiceManager = useInvoiceManager();
  const controlManager = useInvoiceControlManager();

  const taxWithholdingAmount = React.useMemo(() => {
    if (invoiceManager.taxWithholdingId) {
      const taxWithholding = taxWithholdings?.find((t) => t.id === invoiceManager.taxWithholdingId);
      const taxWithholdingAmount = invoiceManager.total * ((taxWithholding?.rate || 0) / 100);
      return ciel(taxWithholdingAmount, currency?.digitAfterComma || 3);
    }
    return 0;
  }, [
    invoiceManager.taxWithholdingId,
    invoiceManager.total,
    taxWithholdings,
    currency?.digitAfterComma
  ]);

  const currencySymbol = currency?.symbol || '$';
  const digitAfterComma = currency?.digitAfterComma || 3;
  const discount = invoiceManager.discount ?? 0;
  const discountType =
    invoiceManager.discountType === DISCOUNT_TYPE.PERCENTAGE ? 'PERCENTAGE' : 'AMOUNT';
  const remaining_amount =
    (invoiceManager.total || 0) - (invoiceManager.amountPaid || 0) - taxWithholdingAmount;

  return (
    <div className={cn(className)}>
      {/* Subtotal */}
      <div className="flex flex-col w-full border-b">
        <div className="flex my-2">
          <Label className="mr-auto">{tInvoicing('invoice.attributes.sub_total')}</Label>
          <Label className="ml-auto" isPending={loading || false}>
            {subTotal?.toFixed(digitAfterComma)} {currencySymbol}
          </Label>
        </div>

        {invoiceArticleManager.taxSummary.map((ts) => {
          return (
            <div key={ts.tax.id} className="flex my-2">
              <Label className="mr-auto">{ts.tax.label}</Label>
              <Label className="ml-auto" isPending={loading || false}>
                {ts.amount?.toFixed(digitAfterComma)} {currencySymbol}
              </Label>
            </div>
          );
        })}

        {/* discount */}
        {edit && (
          <div className="flex items-center my-2">
            <Label className="mr-auto">{tInvoicing('quotation.attributes.discount')}</Label>
            <div className="flex items-center gap-2">
              <Input
                className="ml-auto w-2/5 text-right"
                type="number"
                value={discount}
                onChange={(e) => invoiceManager.set('discount', parseFloat(e.target.value))}
                isPending={loading || false}
              />
              <SelectShimmer isPending={loading || false} className="-mt-0.5 w-1/5">
                <Select
                  onValueChange={(value: string) => {
                    invoiceManager.set(
                      'discountType',
                      value === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT
                    );
                  }}
                  value={discountType}>
                  <SelectTrigger className="w-fit">
                    <SelectValue placeholder="%" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="PERCENTAGE">%</SelectItem>
                    <SelectItem value="AMOUNT">{currencySymbol} </SelectItem>
                  </SelectContent>
                </Select>
              </SelectShimmer>
            </div>
          </div>
        )}
        {!edit && discount != 0 && (
          <div className="flex flex-col w-full">
            <div className="flex my-2">
              <Label className="mr-auto">{tInvoicing('quotation.attributes.discount')}</Label>
              <Label className="ml-auto" isPending={loading || false}>
                {discount?.toFixed(digitAfterComma)}{' '}
                <span>
                  {discountType === DISCOUNT_TYPE.PERCENTAGE ? '%' : currency?.symbol || '$'}
                </span>
              </Label>
            </div>
          </div>
        )}
        {/* tax stamp */}
        {!controlManager.isTaxStampHidden && (
          <div className="flex items-center my-2">
            <Label className="w-1/3">{tInvoicing('invoice.attributes.tax_stamp')}</Label>
            {edit ? (
              <SelectShimmer isPending={loading || false} className="-mt-0.5 ">
                <Select
                  onValueChange={(value: string) => {
                    invoiceManager.set('taxStampId', parseInt(value));
                  }}
                  defaultValue={invoiceManager.taxStampId?.toString()}>
                  <SelectTrigger className="w-2/3">
                    <SelectValue
                      placeholder={`${'0.'.padEnd(digitAfterComma + 2, '0')} ${currencySymbol}`}
                    />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {taxes.map((tax) => {
                      return (
                        <SelectItem key={tax.id} value={tax?.id?.toString() || ''}>
                          {tax.label} ({tax.value?.toFixed(digitAfterComma) || 0} {currencySymbol})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </SelectShimmer>
            ) : (
              <div className="flex flex-col w-full">
                <Label className="ml-auto" isPending={loading || false}>
                  {taxes.find((t) => (t.id = invoiceManager.taxStampId))?.value}{' '}
                  <span>{currency?.symbol}</span>
                </Label>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col w-full mt-2">
        <div className="flex my-2">
          <Label className="mr-auto">{tInvoicing('invoice.attributes.total')}</Label>
          <Label className="ml-auto" isPending={loading || false}>
            {invoiceManager.total?.toFixed(digitAfterComma)} {currencySymbol}
          </Label>
        </div>
      </div>
      {!controlManager.isTaxWithholdingHidden && (
        <div className="flex flex-col w-full">
          <div className="flex my-2">
            <Label className="mr-auto">{tInvoicing('invoice.attributes.withholding')}</Label>
            <Label className="ml-auto" isPending={loading || false}>
              {taxWithholdingAmount?.toFixed(digitAfterComma)} {currencySymbol}
            </Label>
          </div>
        </div>
      )}
      {[INVOICE_STATUS.PartiallyPaid, INVOICE_STATUS.Unpaid, INVOICE_STATUS.Sent].includes(
        status
      ) && (
        <div>
          <div className="flex flex-col w-full">
            <div className="flex my-2">
              <Label className="mr-auto">{tInvoicing('invoice.attributes.amount_paid')}</Label>
              <Label className="ml-auto" isPending={loading || false}>
                {invoiceManager.amountPaid?.toFixed(digitAfterComma)} {currencySymbol}
              </Label>
            </div>
          </div>
          <div className="flex flex-col w-full">
            <div className="flex my-2">
              <Label className="mr-auto">{tInvoicing('invoice.attributes.remaining_amount')}</Label>
              <Label className="ml-auto" isPending={loading || false}>
                {remaining_amount?.toFixed(digitAfterComma)} {currencySymbol}
              </Label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
