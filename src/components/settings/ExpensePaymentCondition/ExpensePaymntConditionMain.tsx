import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/utils/errors';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useTranslation } from 'react-i18next';

import { api } from '@/api';
import { DataTable } from './data-table/data-table';
import { getPayementConditionColumns } from './data-table/columns';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import ContentSection from '@/components/common/ContentSection';
import { cn } from '@/lib/utils';
import { useExpensePaymentConditionManager } from './hooks/usePaymentConditionManager';
import { ExpensePaymentCondition } from '@/types/expense-payment-condition';
import { ExpensePaymentConditionActionsContext } from './data-table/ActionsContext';
import { ExpensePaymentConditionCreateDialog } from './dialogs/ExpensePaymentConditionCreateDialog';
import { ExpensePaymentConditionUpdateDialog } from './dialogs/ExpensePaymentConditionUpdateDialog';
import { ExpensePaymentConditionDeleteDialog } from './dialogs/ExpensePaymentConditionDeleteDialog';

interface ExpensePaymentConditionMainProps {
  className?: string;
}
const ExpensePaymentConditionMain: React.FC<ExpensePaymentConditionMainProps> = ({ className }) => {
  //next-router
  const router = useRouter();
  const { t: tSettings } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes([
      { title: tCommon('menu.settings') },
      { title: tCommon('submenu.system') },
      { title: tCommon('settings.system.payment_condition') }
    ]);
  }, [router.locale]);

  const paymentConditionManager = useExpensePaymentConditionManager();

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

  const [createDialog, setCreateDialog] = React.useState(false);
  const [updateDialog, setUpdateDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);

  const {
    isPending: isFetchPending,
    error,
    data: paymentConditionsResp,
    refetch: refetchPaymentConditions
  } = useQuery({
    queryKey: [
      'payment-conditions',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.expensepaymentCondition.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm
      )
  });

  const paymentConditions = React.useMemo(() => {
    return paymentConditionsResp?.data || [];
  }, [paymentConditionsResp]);

  const context = {
    //dialogs
    openCreateDialog: () => setCreateDialog(true),
    openUpdateDialog: () => setUpdateDialog(true),
    openDeleteDialog: () => setDeleteDialog(true),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: paymentConditionsResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey })
  };

  //create payment condition
  const { mutate: createPaymentCondition, isPending: isCreatePending } = useMutation({
    mutationFn: (data: ExpensePaymentCondition) => api.expensepaymentCondition.create(data),
    onSuccess: () => {
      toast.success('Condition de Paiement ajoutée avec succès');
      refetchPaymentConditions();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('', error, 'Erreur lors de la création de la méthode de Paiement')
      );
    }
  });

  //update payment condition
  const { mutate: updatePaymentCondition, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: ExpensePaymentCondition) => api.expensepaymentCondition.update(data),
    onSuccess: () => {
      toast.success('Condition de Paiement modifiée avec succès');
      refetchPaymentConditions();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('', error, 'Erreur lors de la modification de la méthode de Paiement')
      );
    }
  });

  //remove payment condition
  const { mutate: removePaymentCondition, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.expensepaymentCondition.remove(id),
    onSuccess: () => {
      if (paymentConditions?.length == 1 && page > 1) setPage(page - 1);
      toast.success('Condition de Paiement supprimée avec succès');
      refetchPaymentConditions();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage('', error, "Erreur lors de la suppression de l'activité"));
    }
  });

  const handlePaymentConditionSubmit = (
    paymentCondition: ExpensePaymentCondition,
    callback: (paymentCondition: ExpensePaymentCondition) => void
  ): boolean => {
    const validation = api.expensepaymentCondition.validate(paymentCondition);
    if (validation.message) {
      toast.error(validation.message);
      return false;
    } else {
      callback(paymentCondition);
      paymentConditionManager.reset();
      return true;
    }
  };

  const isPending =
    isFetchPending ||
    isCreatePending ||
    isUpdatePending ||
    isDeletePending ||
    paging ||
    resizing ||
    searching ||
    sorting;

  if (error) return 'An error has occurred: ' + error.message;
  return (
    <ExpensePaymentConditionActionsContext.Provider value={context}>
      <ExpensePaymentConditionCreateDialog
        open={createDialog}
        isCreatePending={isCreatePending}
        createPaymentCondition={() => {
          handlePaymentConditionSubmit(
            paymentConditionManager.getPaymentCondition(),
            createPaymentCondition
          ) && setCreateDialog(false);
        }}
        onClose={() => {
          setCreateDialog(false);
        }}
      />
      <ExpensePaymentConditionUpdateDialog
        open={updateDialog}
        updatePaymentCondition={() => {
          handlePaymentConditionSubmit(
            paymentConditionManager.getPaymentCondition(),
            updatePaymentCondition
          ) && setUpdateDialog(false);
        }}
        isUpdatePending={isUpdatePending}
        onClose={() => {
          setUpdateDialog(false);
        }}
      />
      <ExpensePaymentConditionDeleteDialog
        open={deleteDialog}
        deletePaymentCondition={() => {
          paymentConditionManager?.id && removePaymentCondition(paymentConditionManager?.id);
        }}
        isDeletionPending={isDeletePending}
        label={paymentConditionManager?.label}
        onClose={() => {
          setDeleteDialog(false);
        }}
      />
      <ContentSection
        title={tSettings('payment_condition.singular')}
        desc={tSettings('payment_condition.card_description')}
        className="w-full"
        childrenClassName={cn('overflow-hidden', className)}>
        <DataTable
          className="flex flex-col flex-1 overflow-hidden p-1"
          containerClassName="overflow-auto"
          data={paymentConditions}
          columns={getPayementConditionColumns(tSettings)}
          isPending={isPending}
        />
      </ContentSection>
    </ExpensePaymentConditionActionsContext.Provider>
  );
};

export default ExpensePaymentConditionMain;
