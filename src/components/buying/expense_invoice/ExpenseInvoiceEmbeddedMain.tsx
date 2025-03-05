import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/other/useDebounce';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DataTable } from './data-table/data-table';
import { DuplicateInvoiceDto } from '@/types';
import ContentSection from '@/components/common/ContentSection';
import { cn } from '@/lib/utils';
import { BreadcrumbRoute, useBreadcrumb } from '@/components/layout/BreadcrumbContext';

import { getInvoiceColumns } from './data-table/columns';
import { useExpenseInvoiceManager } from './hooks/useExpenseInvoiceManager';
import { ExpenseInvoiceDeleteDialog } from './dialogs/ExpenseInvoiceDeleteDialog';
import { ExpenseInvoiceDuplicateDialog } from './dialogs/ExpenseInvoiceDuplicateDialog';
import { ExpenseInvoiceActionsContext } from './data-table/ActionsContext';

interface ExpenseInvoiceEmbeddedMainProps {
  className?: string;
  firmId?: number;
  interlocutorId?: number;
  routes?: BreadcrumbRoute[];
}

export const ExpenseInvoiceEmbeddedMain: React.FC<ExpenseInvoiceEmbeddedMainProps> = ({
  className,
  firmId,
  interlocutorId,
  routes
}) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');

  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    if (routes && (firmId || interlocutorId))
      setRoutes([...routes, { title: tCommon('submenu.invoices') }]);
  }, [router.locale, firmId, interlocutorId, routes]);

  const invoiceManager = useExpenseInvoiceManager();

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
  const [duplicateDialog, setDuplicateDialog] = React.useState(false);
  const [downloadDialog, setDownloadDialog] = React.useState(false);

  const {
    isPending: isFetchPending,
    error,
    data: invoicesResp,
    refetch: refetchInvoices
  } = useQuery({
    queryKey: [
      'invoices',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.expense_invoice.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm,
        ['firm', 'interlocutor', 'currency', 'payments'],
        firmId,
        interlocutorId
      )
  });

  const invoices = React.useMemo(() => {
    return invoicesResp?.data || [];
  }, [invoicesResp]);

  const context = {
    //dialogs
    openDeleteDialog: () => setDeleteDialog(true),
    openDuplicateDialog: () => setDuplicateDialog(true),
    openDownloadDialog: () => setDownloadDialog(true),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: invoicesResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey })
  };

  //Remove Invoice
  const { mutate: removeInvoice, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.expense_invoice.remove(id),
    onSuccess: () => {
      if (invoices?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing('invoice.action_remove_success'));
      refetchInvoices();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage('invoicing', error, tInvoicing('expense_invoice.action_remove_failure')));
    }
  });

  //Duplicate Invoice
  const { mutate: duplicateInvoice, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateInvoiceDto: DuplicateInvoiceDto) =>
      api.expense_invoice.duplicate(duplicateInvoiceDto),
    onSuccess: async (data) => {
      toast.success(tInvoicing('expense_invoice.action_duplicate_success'));
      await router.push('/buying/expense_invoice/' + data.id);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('expense_invoice.action_duplicate_failure'))
      );
    }
  });

  //Download Invoice

  const isPending = isFetchPending || isDeletePending || paging || resizing || searching || sorting;

  if (error) return 'An error has occurred: ' + error.message;
  return (
    <ContentSection
      title={tInvoicing('invoice.singular')}
      desc={tInvoicing('invoice.card_description')}
      className="w-full"
      childrenClassName={cn('overflow-hidden', className)}>
      <>
        <ExpenseInvoiceDeleteDialog
          id={invoiceManager?.id}
          sequential={invoiceManager?.sequential || ''}
          open={deleteDialog}
          deleteInvoice={() => {
            invoiceManager?.id && removeInvoice(invoiceManager?.id);
          }}
          isDeletionPending={isDeletePending}
          onClose={() => setDeleteDialog(false)}
        />
    <ExpenseInvoiceDuplicateDialog
  id={invoiceManager?.id || 0}
  open={duplicateDialog}
  duplicateInvoice={(includeFiles: boolean) => {
    invoiceManager?.id &&
      duplicateInvoice({
        id: invoiceManager?.id,
        includeFiles: includeFiles
      });
  }}
  isDuplicationPending={isDuplicationPending}
  onClose={() => setDuplicateDialog(false)}
/>

        <ExpenseInvoiceActionsContext.Provider value={context}>
          <DataTable
            className="flex flex-col flex-1 overflow-hidden p-1"
            containerClassName="overflow-auto"
            data={invoices}
            columns={getInvoiceColumns(tInvoicing, router, firmId, interlocutorId)}
            isPending={isPending}
          />
        </ExpenseInvoiceActionsContext.Provider>
      </>
    </ContentSection>
  );
};
