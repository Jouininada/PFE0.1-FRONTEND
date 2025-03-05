import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/other/useDebounce';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { DuplicateExpensQuotationDto } from '@/types';
import ContentSection from '@/components/common/ContentSection';
import { cn } from '@/lib/utils';
import { BreadcrumbRoute, useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { ExpenseQuotationDeleteDialog } from './dialogs/ExpenseQuotationDeleteDialog';
import { ExpenseQuotationDuplicateDialog } from './dialogs/ExpenseQuotationDuplicateDialog';
import { ExpenseQuotationInvoiceDialog } from './dialogs/ExpenseQuotationInvoiceDialog';
import { ExpenseQuotationActionsContext } from './data-table/ActionsContext';
import { DataTable } from './data-table/data-table';
import { getQuotationColumns } from './data-table/columns';
import { useExpenseQuotationManager } from './hooks/useExpenseQuotationManager';


interface ExpenseQuotationEmbeddedMainProps {
  className?: string;
  firmId?: number;
  interlocutorId?: number;
  routes?: BreadcrumbRoute[];
}

export const QuotationEmbeddedMain: React.FC<ExpenseQuotationEmbeddedMainProps> = ({
  className,
  firmId,
  interlocutorId,
  routes
}) => {
  const router = useRouter();

  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');

  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    if (routes && (firmId || interlocutorId))
      setRoutes([...routes, { title: tCommon('submenu.expensequotations') }]);
  }, [router.locale, firmId, interlocutorId, routes]);

  const quotationManager = useExpenseQuotationManager();

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
  const [invoiceDialog, setInvoiceDialog] = React.useState(false);

  const {
    isPending: isFetchPending,
    error,
    data: quotationsResp,
    refetch: refetchQuotations
  } = useQuery({
    queryKey: [
      'quotations',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.expense_quotation.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm,
        ['firm', 'interlocutor', 'currency', 'invoices'],
        firmId,
        interlocutorId
      )
  });

  const quotations = React.useMemo(() => {
    return quotationsResp?.data || [];
  }, [quotationsResp]);

  const context = {
    //dialogs
    openDeleteDialog: () => setDeleteDialog(true),
    openDuplicateDialog: () => setDuplicateDialog(true),
    openDownloadDialog: () => setDownloadDialog(true),
    openInvoiceDialog: () => setInvoiceDialog(true),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: quotationsResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey }),
    firmId,
    interlocutorId
  };

  //Remove Quotation
  const { mutate: removeExpenseQuotation, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.expense_quotation.remove(id),
    onSuccess: () => {
      if (quotations?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing('expensequotation.action_remove_success'));
      refetchQuotations();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('expensequotation.action_remove_failure'))
      );
    }
  });

  //Duplicate Quotation
  const { mutate: duplicateExpenseQuotation, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateQuotationDto: DuplicateExpensQuotationDto) =>
      api.expense_quotation.duplicate(duplicateQuotationDto),
    onSuccess: async (data) => {
      toast.success(tInvoicing('expensequotation.action_duplicate_success'));
      await router.push('/buying/expense-quotations/' + data.id);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('expensequotation.action_duplicate_failure'))
      );
    }
  });

  //Download Quotation
  const { mutate: downloadExpenseQuotation, isPending: isDownloadPending } = useMutation({
    mutationFn: (data: { id: number; template: string }) =>
      api.expense_quotation.download(data.id, data.template),
    onSuccess: () => {
      toast.success(tInvoicing('expensequotation.action_download_success'));
      setDownloadDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('expensequotation.action_download_failure'))
      );
    }
  });

  //Invoice quotation
  const { mutate: invoiceExpenseQuotation, isPending: isInvoicingPending } = useMutation({
    mutationFn: (data: { id?: number; createInvoice: boolean }) =>
      api.expense_quotation.invoice(data.id, data.createInvoice),
    onSuccess: (data) => {
      toast.success('Devis facturé avec succès');
      refetchQuotations();
      router.push(`/Buying/invoice/${data.invoices[data?.invoices?.length - 1].id}`);
    },
    onError: (error) => {
      const message = getErrorMessage('contacts', error, 'Erreur lors de la facturation de devis');
      toast.error(message);
    }
  });

  const isPending =
    isFetchPending ||
    isDeletePending ||
    paging ||
    resizing ||
    searching ||
    sorting ||
    !commonReady ||
    !invoicingReady;

  if (error) return 'An error has occurred: ' + error.message;
  return (
    <ContentSection
      title={tInvoicing('expensequotation.singular')}
      desc={tInvoicing('expensequotation.card_description')}
      className="w-full"
      childrenClassName={cn('overflow-hidden', className)}>
      <>
        <ExpenseQuotationDeleteDialog
          id={quotationManager?.id}
          sequential={quotationManager?.sequential || ''}
          open={deleteDialog}
          deleteQuotation={() => {
            quotationManager?.id && removeExpenseQuotation(quotationManager?.id);
          }}
          isDeletionPending={isDeletePending}
          onClose={() => setDeleteDialog(false)}
        />
        <ExpenseQuotationDuplicateDialog
          id={quotationManager?.id || 0}
          open={duplicateDialog}
          duplicateQuotation={(includeFiles: boolean) => {
            quotationManager?.id &&
              duplicateExpenseQuotation({
                id: quotationManager?.id,
                includeFiles: includeFiles
              });
          }}
          isDuplicationPending={isDuplicationPending}
          onClose={() => setDuplicateDialog(false)}
        />
        
        <ExpenseQuotationInvoiceDialog
          id={quotationManager?.id || 0}
          status={quotationManager?.status}
          sequential={quotationManager?.sequential}
          open={invoiceDialog}
          isInvoicePending={isInvoicingPending}
          invoice={(id: number, createInvoice: boolean) => {
            invoiceExpenseQuotation({ id, createInvoice });
          }}
          onClose={() => setInvoiceDialog(false)}
        />
        <ExpenseQuotationActionsContext.Provider value={context}>
          <DataTable
            className="flex flex-col flex-1 overflow-hidden p-1"
            containerClassName="overflow-auto"
            data={quotations}
            columns={getQuotationColumns(tInvoicing, router, firmId, interlocutorId)}
            isPending={isPending}
          />
        </ExpenseQuotationActionsContext.Provider>
      </>
    </ContentSection>
  );
};
