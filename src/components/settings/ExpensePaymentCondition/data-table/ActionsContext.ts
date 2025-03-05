import React from 'react';

export const ExpensePaymentConditionActionsContext = React.createContext({
  openCreateDialog: () => {},
  openUpdateDialog: () => {},
  openDeleteDialog: () => {},
  searchTerm: '',
  setSearchTerm: (value: string) => {},
  page: 1,
  totalPageCount: 1,
  setPage: (value: number) => {},
  size: 1,
  setSize: (value: number) => {},
  order: true,
  sortKey: '',
  setSortDetails: (order: boolean, sortKey: string) => {}
});

export const useExpensePaymentConditionActions = () => React.useContext(ExpensePaymentConditionActionsContext);
