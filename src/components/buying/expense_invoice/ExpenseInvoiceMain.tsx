import React from 'react';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './data-table/data-table';
import { getInvoiceColumns } from './data-table/columns';
import { useExpenseInvoiceManager } from './hooks/useExpenseInvoiceManager';
import { ExpenseInvoiceDeleteDialog } from './dialogs/ExpenseInvoiceDeleteDialog';
import { ExpenseInvoiceDuplicateDialog } from './dialogs/ExpenseInvoiceDuplicateDialog';
import { ExpenseInvoiceActionsContext } from './data-table/ActionsContext';
import { ExpenseDuplicateInvoiceDto } from '@/types/expense_invoices';
import { EXPENSE_INVOICE_STATUS } from '@/types/expense_invoices';

interface ExpenseInvoiceMainProps {
  className?: string;
}

export const ExpenseInvoiceMain: React.FC<ExpenseInvoiceMainProps> = ({ className }) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes([
      { title: tCommon('menu.buying'), href: '/buying' },
      { title: tCommon('submenu.expense_invoices') }
    ]);
  }, [router.locale]);

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
        ['firm', 'interlocutor', 'currency', 'payments']
      )
  });

  // Fonction pour vérifier si une facture est expirée
  const isInvoiceExpired = (dueDate: string | undefined): boolean => {
    if (!dueDate) {
      console.error("Due Date is undefined or empty.");
      return false;
    }

    try {
      const dueDateObj = new Date(dueDate); // Convertit la chaîne en objet Date
      const currentDate = new Date();
      currentDate.setUTCHours(0, 0, 0, 0); // Réinitialise l'heure pour une comparaison précise

      return dueDateObj < currentDate; // Retourne true si la date d'échéance est dépassée
    } catch (error) {
      console.error("Error parsing dueDate:", error);
      return false;
    }
  };

  // Mettre à jour le statut des factures lors de l'affichage
  const invoices = React.useMemo(() => {
    if (!invoicesResp?.data) return [];

    return invoicesResp.data.map((invoice) => {
      if (invoice.dueDate && isInvoiceExpired(invoice.dueDate)) {
        return { ...invoice, status: EXPENSE_INVOICE_STATUS.Expired }; // Met à jour le statut à "Expired"
      }
      return invoice;
    });
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
      toast.success(tInvoicing('expense_invoice.action_remove_success'));
      refetchInvoices();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage('invoicing', error, tInvoicing('expense_invoice.action_remove_failure')));
    }
  });

  //Duplicate Invoice
  const { mutate: duplicateInvoice, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateInvoiceDto: ExpenseDuplicateInvoiceDto) =>
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
    <>
      <ExpenseInvoiceDeleteDialog
        id={invoiceManager?.id}
        sequential={invoiceManager?.sequentialNumbr || ''}
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
        <Card className={className}>
          <CardHeader>
            <CardTitle>{tInvoicing('invoice.singular')}</CardTitle>
            <CardDescription>{tInvoicing('invoice.card_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              className="my-5"
              data={invoices}
              columns={getInvoiceColumns(tInvoicing, router)}
              isPending={isPending}
            />
          </CardContent>
        </Card>
      </ExpenseInvoiceActionsContext.Provider>
    </>
  );
};