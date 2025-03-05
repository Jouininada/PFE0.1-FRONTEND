import { Currency} from '@/types';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { ExpensePaymentInvoiceEntry } from '@/types/expense-payment';

type ExpensePaymentPseudoItem = { id: string; invoice: ExpensePaymentInvoiceEntry };

export type ExpensePaymentInvoiceManager = {
  invoices: ExpensePaymentPseudoItem[];
  add: (invoice?: ExpensePaymentInvoiceEntry) => void;
  update: (id: string, article: ExpensePaymentInvoiceEntry) => void;
  delete: (id: string) => void;
  setInvoices: (
    entries: ExpensePaymentInvoiceEntry[],
    currency: Currency,
    convertionRate: number,
    mode?: 'EDIT' | 'NEW'
  ) => void;
  reset: () => void;
  getInvoices: () => ExpensePaymentInvoiceEntry[];
  calculateUsedAmount: () => number;
  init: () => void;


};

export const useExpensePaymentInvoiceManager = create<ExpensePaymentInvoiceManager>()((set, get) => ({
  invoices: [],
  add: (invoice: ExpensePaymentInvoiceEntry = {} as ExpensePaymentInvoiceEntry) => {
    set((state) => ({
      invoices: [...state.invoices, { id: uuidv4(), invoice }]
    }));
  },

  update: (id: string, invoice: ExpensePaymentInvoiceEntry) => {
    set((state) => ({
      invoices: state.invoices.map((a) => (a.id === id ? { ...a, invoice } : a))
    }));
  },

  delete: (id: string) => {
    set((state) => ({
      invoices: state.invoices.filter((a) => a.id !== id)
    }));
  },

  setInvoices: (
    entries: ExpensePaymentInvoiceEntry[],
    currency: Currency,
    convertionRate: number,
    mode?: 'EDIT' | 'NEW'
  ) => {
    const actualEntries =
      mode === 'EDIT'
        ? entries.map((entry) => {
            const amountPaid = entry?.expenseInvoice?.amountPaid || 0;
            const entryAmount = entry?.amount || 0;
            return {
              ...entry,
              invoice: {
                ...entry.expenseInvoice,
                amountPaid: amountPaid - entryAmount
              },
              amount: dinero({
                amount: createDineroAmountFromFloatWithDynamicCurrency(
                  currency.id != entry.expenseInvoice?.currencyId
                    ? entryAmount / convertionRate
                    : entryAmount,
                  currency.digitAfterComma || 3
                ),
                precision: currency.digitAfterComma || 3
              }).toUnit()
            };
          })
        : entries;
    set({
      invoices: actualEntries.map((invoice) => {
        return {
          id: uuidv4(),
          invoice
        };
      })
    });
  },

  reset: () =>
    set({
      invoices: []
    }),
  init: () => {
    const updatedInvoices = get().invoices.map((i) => ({
      ...i,
      invoice: {
        ...i.invoice,
        amount: 0
      }
    }));
    set({ invoices: updatedInvoices });
  },
  getInvoices: () => {
    const invoices = get().invoices.map((item) => item.invoice);
    console.log('Liste des factures associées:', invoices);  // Ajoute cette ligne pour afficher les factures
    return invoices;
  },
  calculateUsedAmount: () => {
    const invoices = get().invoices.map((i) => i.invoice);
    return invoices.reduce((acc, invoice) => {
      return acc + (invoice?.amount || 0);
    }, 0);
  }
}));
