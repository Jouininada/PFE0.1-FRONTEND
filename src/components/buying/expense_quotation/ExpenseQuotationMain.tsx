import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/other/useDebounce';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DataTable } from './data-table/data-table';
import { getQuotationColumns } from './data-table/columns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { DuplicateExpensQuotationDto, DuplicateQuotationDto } from '@/types';
import { useExpenseQuotationManager } from './hooks/useExpenseQuotationManager';
import { ExpenseQuotationDeleteDialog } from './dialogs/ExpenseQuotationDeleteDialog';
import { ExpenseQuotationDuplicateDialog } from './dialogs/ExpenseQuotationDuplicateDialog';
import { ExpenseQuotationInvoiceDialog } from './dialogs/ExpenseQuotationInvoiceDialog';
import { ExpenseQuotationActionsContext } from './data-table/ActionsContext';
import { EXPENSQUOTATION_STATUS } from '@/types'; // Assurez-vous d'importer le statut approprié

interface ExpenseQuotationMainProps {
  className?: string;
}

export const ExpenseQuotationMain: React.FC<ExpenseQuotationMainProps> = ({ className }) => {
  const router = useRouter();
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes([
      { title: tCommon('menu.buying'), href: '/buying' },
      { title: tCommon('submenu.quotations') }
    ]);
  }, [router.locale]);

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
        ['firm', 'interlocutor', 'currency', 'invoices']
      )
  });

  const { mutate: updateQuotationStatus } = useMutation({
      mutationFn: (quotationId: number) => api.expense_quotation.updateInvoiceStatusIfExpired(quotationId),
      onSuccess: () => {
        refetchQuotations();
      },
      onError: (error) => {
        toast.error(getErrorMessage('invoicing', error, tInvoicing('expense_invoice.status_update_failed')));
      }
    });

  
  // Mettre à jour le statut des quotations lors de l'affichage
  useEffect(() => {
      if (quotationsResp?.data) {
        quotationsResp.data.forEach((quotation) => {
          // Vérifier que l'ID de la facture est défini
          if (quotation.id && quotation.dueDate && new Date(quotation.dueDate) < new Date()) {
            updateQuotationStatus(quotation.id); // Appeler la mutation uniquement si l'ID est défini
          }
        });
      }
    }, [quotationsResp]);
  
    const quotations = React.useMemo(() => {
      if (!quotationsResp?.data) return [];
    
      return quotationsResp.data.map((quotation) => {
        return quotation; // Retourne l'invoice sans modification
      });
    }, [quotationsResp]);

  const context = {
    //dialogs
    openDeleteDialog: () => setDeleteDialog(true),
    openDuplicateDialog: () => setDuplicateDialog(true),
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
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey })
  };

  //Remove Quotation
  const { mutate: removeQuotation, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.expense_quotation.remove(id),
    onSuccess: () => {
      if (quotations?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing('quotation.action_remove_success'));
      refetchQuotations();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('quotation.action_remove_failure'))
      );
    }
  });

  const { mutate: duplicateQuotation, isPending: isDuplicationPending } = useMutation({
    mutationFn: ({ id, includeFiles }: { id: number; includeFiles: boolean }) => {
      console.log("Starting duplication...");
      const duplicateQuotationDto: DuplicateExpensQuotationDto = {
        id,
        includeFiles,
      };
      console.log("Duplicate DTO:", duplicateQuotationDto);
      return api.expense_quotation.duplicate(duplicateQuotationDto);
    },
    onSuccess: async (data) => {
      console.log("Duplication successful, redirecting...");
      console.log("Duplicated Quotation Data in onSuccess:", data);
      toast.success(tInvoicing('expensequotation.action_duplicate_success'));
      await router.push('/buying/expense_quotation/' + data.id); // Rediriger vers le nouveau devis
      setDuplicateDialog(false);
    },
    onError: (error) => {
      console.error("Duplication error:", error);
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('expensequotation.action_duplicate_failure'))
      );
    },
  });

  //Invoice quotation
  const { mutate: invoiceQuotation, isPending: isInvoicingPending } = useMutation({
    mutationFn: (data: { id?: number; createInvoice: boolean }) =>
      api.expense_quotation.invoice(data.id, data.createInvoice),
    onSuccess: (data) => {
      toast.success('Devis facturé avec succès');
      refetchQuotations();
      router.push(`/buying/invoice/${data.invoices[data?.invoices?.length - 1].id}`);
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
    <>
      <ExpenseQuotationDeleteDialog
        id={quotationManager?.id}
        sequential={quotationManager?.sequential || ''}
        open={deleteDialog}
        deleteQuotation={() => {
          quotationManager?.id && removeQuotation(quotationManager?.id);
        }}
        isDeletionPending={isDeletePending}
        onClose={() => setDeleteDialog(false)}
      />
      <ExpenseQuotationDuplicateDialog
        id={quotationManager?.id || 0}
        open={duplicateDialog}
        duplicateQuotation={(includeFiles: boolean) => {
          quotationManager?.id &&
            duplicateQuotation({
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
          invoiceQuotation({ id, createInvoice });
        }}
        onClose={() => setInvoiceDialog(false)}
      />
      <ExpenseQuotationActionsContext.Provider value={context}>
        <Card className={className}>
          <CardHeader>
            <CardTitle>{tInvoicing('quotation.singular')}</CardTitle>
            <CardDescription>{tInvoicing('quotation.card_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              className="flex flex-col flex-1 overflow-hidden p-1"
              containerClassName="overflow-auto"
              data={quotations}
              columns={getQuotationColumns(tInvoicing, router)}
              isPending={isPending}
            />
          </CardContent>
        </Card>
      </ExpenseQuotationActionsContext.Provider>
    </>
  );
};