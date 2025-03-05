import React from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {  } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import _ from 'lodash';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import useInitializedState from '@/hooks/use-initialized-state';

import useFirmChoices from '@/hooks/content/useFirmChoice';
import { Textarea } from '@/components/ui/textarea';

import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import { useExpensePaymentManager } from './hooks/useExpensePaymentManager';
import { useExpensePaymentInvoiceManager } from './hooks/useExpensePaymentInvoiceManager';
import useCabinet from '@/hooks/content/useCabinet';
import { ExpensePayment, ExpensePaymentInvoiceEntry, ExpenseUpdatePaymentDto } from '@/types/expense-payment';
import { ExpensePaymentGeneralInformation } from './form/ExpensePaymentGeneralInformation';
import { ExpensePaymentInvoiceManagement } from './form/ExpensePaymentInvoiceManagement';
import { ExpensePaymentExtraOptions } from './form/ExpensePaymentExtraOptions';
import { ExpensePaymentFinancialInformation } from './form/ExpensePaymentFinancialInformation';
import { ExpensePaymentControlSection } from './form/ExpensePaymentControlSection';

interface ExpensePaymentFormProps {
  className?: string;
  paymentId: string;
}

export const ExpensePaymentUpdateForm = ({ className, paymentId }: ExpensePaymentFormProps) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const { setRoutes } = useBreadcrumb();
  const paymentManager = useExpensePaymentManager();
  const invoiceManager = useExpensePaymentInvoiceManager();

  //Fetch options
  const {
    isPending: isFetchPending,
    data: paymentResp,
    refetch: refetchInvoice
  } = useQuery({
    queryKey: ['invoice', paymentId],
    queryFn: () => api.expensepayment.findOne(parseInt(paymentId))
  });

  const payment = React.useMemo(() => {
    return paymentResp || null;
  }, [paymentResp]);

  React.useEffect(() => {
    if (payment?.id)
      setRoutes([
        { title: tCommon('menu.buying'), href: '/buying' },
        { title: tInvoicing('payment.plural'), href: '/buying/expense_payments' },
        { title: tInvoicing('payment.singular') + ' N° ' + payment?.id }
      ]);
  }, [router.locale, payment?.id]);

  // Fetch options
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { cabinet, isFetchCabinetPending } = useCabinet();

  React.useEffect(() => {
    paymentManager.set('currencyId', cabinet?.currency?.id);
  }, [cabinet]);

  const { firms, isFetchFirmsPending } = useFirmChoices([
    'currency',
    'invoices',
    'invoices.currency'
  ]);
  const fetching =
    isFetchPending || isFetchFirmsPending || isFetchCurrenciesPending || isFetchCabinetPending;

  const setPaymentData = (data: Partial<ExpensePayment>) => {
    //invoice infos
    paymentManager.setPayment({ ...data, firm: firms.find((firm) => firm.id === data.firmId) });
    //invoice article infos
    data?.invoices &&
      data.convertionRate &&
      data.currency &&
      invoiceManager.setInvoices(data?.invoices, data.currency, data.convertionRate, 'EDIT');
  };

  const { isDisabled, globalReset } = useInitializedState({
    data: payment || ({} as Partial<ExpensePayment>),
    getCurrentData: () => {
      return {
        payment: paymentManager.getPayment(),
        invoices: invoiceManager.getInvoices()
      };
    },
    setFormData: (data: Partial<ExpensePayment>) => {
      setPaymentData(data);
    },
    resetData: () => {
      paymentManager.reset();
      invoiceManager.reset();
    },
    loading: fetching
  });

  const currency = React.useMemo(() => {
    return currencies.find((c) => c.id === paymentManager.currencyId);
  }, [paymentManager.currencyId, currencies]);

  const { mutate: updatePayment, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: { payment: ExpenseUpdatePaymentDto; files: File[] }) =>
      api.expensepayment.update(data.payment, data.files),
    onSuccess: () => {
      toast.success('Paiement modifié avec succès');
      router.push('/buying/expense_payments');
    },
    onError: (error) => {
      const message = getErrorMessage('', error, 'Erreur lors de la mise à jour de paiement');
      toast.error(message);
    }
  });

  const onSubmit = () => {
    const invoices: ExpensePaymentInvoiceEntry[] = invoiceManager
      .getInvoices()
      .map((invoice: ExpensePaymentInvoiceEntry) => ({
        expenseInvoiceId: invoice.expenseInvoice?.id,
        amount: invoice.amount
      }));
    const used = invoiceManager.calculateUsedAmount();
    const paid = dinero({
      amount: createDineroAmountFromFloatWithDynamicCurrency(
        (paymentManager.amount || 0) + (paymentManager.fee || 0),
        currency?.digitAfterComma || 3
      ),
      precision: currency?.digitAfterComma || 3
    }).toUnit();

    const payment: ExpenseUpdatePaymentDto = {
      id: paymentManager.id,
      amount: paymentManager.amount,
      fee: paymentManager.fee,
      convertionRate: paymentManager.convertionRate,
      date: paymentManager.date?.toString(),
      mode: paymentManager.mode,
      notes: paymentManager.notes,
      currencyId: paymentManager.currencyId,
      firmId: paymentManager.firmId,
      invoices,
      uploads: paymentManager.uploadedFiles.filter((u) => !!u.upload).map((u) => u.upload)
    };
    const validation = api.expensepayment.validate(payment, used, paid);
    if (validation.message) {
      toast.error(validation.message);
    } else {
      updatePayment({
        payment,
        files: paymentManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
    }
  };

  return (
    <div className={cn('overflow-auto px-10 py-6', className)}>
      {/* Main Container */}
      <div className={cn('block xl:flex gap-4', false ? 'pointer-events-none' : '')}>
        {/* First Card */}
        <div className="w-full h-auto flex flex-col xl:w-9/12">
          <ScrollArea className=" max-h-[calc(100vh-120px)] border rounded-lg">
            <Card className="border-0 p-2">
              <CardContent className="p-5">
                <ExpensePaymentGeneralInformation
                  className="pb-5 border-b"
                  firms={firms}
                  currencies={currencies.filter(
                    (c) => c.id == cabinet?.currencyId || c.id == paymentManager?.firm?.currencyId
                  )}
                  loading={fetching}
                />
                {paymentManager.firmId && (
                  <ExpensePaymentInvoiceManagement className="pb-5 border-b" loading={fetching} />
                )}
                {/* Extra Options (files) */}
                <div>
                  <ExpensePaymentExtraOptions loading={fetching} />
                </div>
                <div className="flex gap-10 mt-5">
                  <Textarea
                    placeholder={tInvoicing('payment.attributes.notes')}
                    className="resize-none w-2/3"
                    rows={7}
                  />
                  <div className="w-1/3 my-auto">
                    {/* Final Financial Information */}
                    <ExpensePaymentFinancialInformation currency={currency} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollArea>
        </div>
        {/* Second Card */}
        <div className="w-full xl:mt-0 xl:w-3/12">
          <ScrollArea className=" h-fit border rounded-lg">
            <Card className="border-0">
              <CardContent className="p-5 ">
                <ExpensePaymentControlSection
                  handleSubmit={onSubmit}
                  reset={globalReset}
                  loading={false}
                />
              </CardContent>
            </Card>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
