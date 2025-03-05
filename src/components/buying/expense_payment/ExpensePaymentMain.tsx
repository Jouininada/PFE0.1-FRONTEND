import { api } from '@/api';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from './data-table/data-table';
import { getPaymentColumns } from './data-table/columns';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errors';
import { useExpensePaymentManager } from './hooks/useExpensePaymentManager';
import { ExpensePaymentDeleteDialog } from './dialogs/ExpensePaymentDeleteDialog';
import { ExpensePaymentActionsContext } from './data-table/ActionsContext';

interface ExpensePaymentMainProps {
  className?: string;
  firmId?: number;
  interlocutorId?: number;
}

export const ExpensePaymentMain: React.FC<ExpensePaymentMainProps> = ({ className, firmId, interlocutorId }) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const { t: tCurrency } = useTranslation('currency');

  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    if (!firmId && !interlocutorId)
      setRoutes([
        { title: tCommon('menu.buying'), href: '/buying' },
        { title: tCommon('submenu.payments') }
      ]);
  }, [router.locale, firmId, interlocutorId]);

  const paymentManager = useExpensePaymentManager();

  const [page, setPage] = React.useState(1);
  const { value: debouncedPage, loading: paging } = useDebounce<number>(page, 500);

  const [size, setSize] = React.useState(5);
  const { value: debouncedSize, loading: resizing } = useDebounce<number>(size, 500);

  const [sortDetails, setSortDetails] = React.useState({ order: true, sortKey: 'id' });
  const { value: debouncedSortDetails, loading: sorting } = useDebounce<typeof sortDetails>(
    sortDetails,
    500
  );

  const [searchTerm, setSearchTerm] = React.useState('');
  const { value: debouncedSearchTerm, loading: searching } = useDebounce<string>(searchTerm, 500);

  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [downloadDialog, setDownloadDialog] = React.useState(false);

  const {
    isPending: isFetchPending,
    error,
    data: paymentsResp,
    refetch: refetchPayments
  } = useQuery({
    queryKey: [
      'payments',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.expensepayment.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm,
        ['currency'],
        firmId,
        interlocutorId
      )
  });

  const payments = React.useMemo(() => {
    return paymentsResp?.data || [];
  }, [paymentsResp]);

  const context = {
    //dialogs
    openDeleteDialog: () => setDeleteDialog(true),
    openDownloadDialog: () => setDownloadDialog(true),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: paymentsResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey })
  };

  //Remove Invoice
  const { mutate: removePayment, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.expensepayment.remove(id),
    onSuccess: () => {
      if (payments?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing('payment.action_remove_success'));
      refetchPayments();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage('invoicing', error, tInvoicing('payment.action_remove_failure')));
    }
  });

  const isPending = isFetchPending || paging || resizing || searching || sorting;

  return (
    <>
      <ExpensePaymentDeleteDialog
        id={paymentManager?.id}
        open={deleteDialog}
        deletePayment={() => {
          paymentManager?.id && removePayment(paymentManager?.id);
        }}
        isDeletionPending={isDeletePending}
        onClose={() => setDeleteDialog(false)}
      />
      <ExpensePaymentActionsContext.Provider value={context}>
        <Card className={className}>
          <CardHeader>
            <CardTitle>{tInvoicing('payment.singular')}</CardTitle>
            <CardDescription>{tInvoicing('payment.card_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              className="my-5"
              data={payments}
              columns={getPaymentColumns(tInvoicing, tCurrency)}
              isPending={isPending}
            />
          </CardContent>
        </Card>
      </ExpensePaymentActionsContext.Provider>
    </>
  );
};
