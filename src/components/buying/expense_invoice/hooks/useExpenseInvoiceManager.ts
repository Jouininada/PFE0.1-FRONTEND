import { api } from '@/api';
import {
  BankAccount,
  Currency,
  Firm,
  Interlocutor,
  PaymentCondition
} from '@/types';
import { DATE_FORMAT } from '@/types/enums/date-formats';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { ExpensePaymentCondition } from '@/types/expense-payment-condition';
import { EXPENSE_INVOICE_STATUS, ExpenseInvoice, ExpenseInvoiceUploadedFile } from '@/types/expense_invoices';
import { create } from 'zustand';

type ExpenseInvoiceManager = {
  // data
  id?: number;
  sequential: string;
  sequentialNumbr:string,
  date: Date | undefined;
  dueDate: Date | undefined;
  object: string;
  firm?: Firm;
  interlocutor?: Interlocutor;
  subTotal: number;
  total: number;
  amountPaid: number;
  discount: number;
  discountType: DISCOUNT_TYPE;
  bankAccount?: BankAccount;
  currency?: Currency;
  notes: string;
  status: EXPENSE_INVOICE_STATUS;
  generalConditions: string;
  uploadedFiles: ExpenseInvoiceUploadedFile[];
  quotationId?: number;
  taxStampId?: number;
  taxWithholdingId?: number;
  // utility data
  isInterlocutorInFirm: boolean;
  // methods
  setFirm: (firm?: Firm) => void;
  setInterlocutor: (interlocutor?: Interlocutor) => void;
  set: (name: keyof ExpenseInvoiceManager, value: any) => void;
  getInvoice: () => Partial<ExpenseInvoiceManager>;
  setInvoice: (
    invoice: Partial<ExpenseInvoice & { files: ExpenseInvoiceUploadedFile[] }>,
    firms: Firm[],
    bankAccounts: BankAccount[]
  ) => void;
  reset: () => void;
};

const getDateRangeAccordingToPaymentConditions = (paymentCondition: ExpensePaymentCondition) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  if (!paymentCondition) return { date: undefined, dueDate: undefined };

  switch (paymentCondition.id) {
    case 1:
      return { date: today, dueDate: today };
    case 2:
      return { date: today, dueDate: new Date(year, month + 1, 0) }; // End of current month
    case 3:
      return { date: today, dueDate: new Date(year, month + 2, 0) }; // End of next month
    case 4:
      return { date: today, dueDate: undefined };
    default:
      return { date: undefined, dueDate: undefined };
  }
};

const initialState: Omit<ExpenseInvoiceManager, 'set' | 'reset' | 'setFirm' | 'setInterlocutor' | 'getInvoice' | 'setInvoice'> = {
  id: undefined,
  sequential: '',
  sequentialNumbr: '',  // initialisation de sequentialNumbr vide
  date: undefined,
  dueDate: undefined,
  object: '',
  firm: api?.firm?.factory() || undefined,
  interlocutor: api?.interlocutor?.factory() || undefined,
  subTotal: 0,
  total: 0,
  amountPaid: 0,
  discount: 0,
  discountType: DISCOUNT_TYPE.PERCENTAGE,
  bankAccount: api?.bankAccount?.factory() || undefined,
  currency: api?.currency?.factory() || undefined,
  notes: '',
  status: EXPENSE_INVOICE_STATUS.Nonexistent,
  generalConditions: '',
  isInterlocutorInFirm: false,
  uploadedFiles: [],
  quotationId: undefined,
  taxStampId: undefined,
  taxWithholdingId: undefined
};

// Gestionnaire d'état de `ExpenseInvoiceManager`
export const useExpenseInvoiceManager = create<ExpenseInvoiceManager>((set, get) => ({
  ...initialState,
  setFirm: (firm?: Firm) => {
    const dateRange = firm?.paymentCondition
      ? getDateRangeAccordingToPaymentConditions(firm.paymentCondition)
      : { date: undefined, dueDate: undefined };

    set((state) => ({
      ...state,
      firm,
      interlocutor:
        firm?.interlocutorsToFirm?.length === 1
          ? firm.interlocutorsToFirm[0]
          : api?.interlocutor?.factory() || undefined,
      isInterlocutorInFirm: !!firm?.interlocutorsToFirm?.length,
      date: dateRange.date,
      dueDate: dateRange.dueDate
    }));
  },
  setInterlocutor: (interlocutor?: Interlocutor) =>
    set((state) => ({
      ...state,
      interlocutor,
      isInterlocutorInFirm: true
    })),
  // Mise à jour de `sequentialNumbr` pour accepter la saisie manuelle
  set: (name: keyof ExpenseInvoiceManager, value: any) => {
    set((state) => {
      const newValue =
        name === 'date' || name === 'dueDate'
          ? typeof value === 'string'
            ? new Date(value)
            : value
          : value;

      if (state[name] === newValue) {
        return state;
      }

      return {
        ...state,
        [name]: newValue
      };
    });
  },
  getInvoice: () => {
    const {
      id,
      sequentialNumbr,  // récupérer la valeur de sequentialNumbr
      date,
      dueDate,
      object,
      firm,
      interlocutor,
      discount,
      discountType,
      notes,
      generalConditions,
      bankAccount,
      currency,
      uploadedFiles,
      taxStampId,
      taxWithholdingId,
      ...rest
    } = get();

    return {
      id,
      sequentialNumbr,  // renvoyer sequentialNumbr
      date,
      dueDate,
      object,
      firmId: firm?.id,
      interlocutorId: interlocutor?.id,
      discount,
      discountType,
      notes,
      generalConditions,
      bankAccountId: bankAccount?.id,
      currencyId: currency?.id,
      uploadedFiles,
      taxStampId,
      taxWithholdingId
    };
  },
  setInvoice: (
    invoice: Partial<ExpenseInvoice & { files: ExpenseInvoiceUploadedFile[] }> ,
    firms: Firm[],
    bankAccounts: BankAccount[]
  ) => {
    set((state) => {
      // Crée un nouvel état avec les modifications
      const newState = {
        ...state,
        id: invoice?.id,
        sequentialNumbr: invoice?.sequentialNumbr,
        date: invoice?.date ? new Date(invoice?.date) : undefined,
        dueDate: invoice?.dueDate ? new Date(invoice?.dueDate) : undefined,
        object: invoice?.object,
        firm: firms.find((firm) => invoice?.firm?.id === firm.id),
        interlocutor: invoice?.interlocutor,
        discount: invoice?.discount,
        discountType: invoice?.discount_type,
        bankAccount: invoice?.bankAccount || bankAccounts.find((a) => a.isMain),
        currency: invoice?.currency || invoice?.firm?.currency,
        notes: invoice?.notes,
        generalConditions: invoice?.generalConditions,
        status: invoice?.status,
        uploadedFiles: invoice?.files || [],
        quotationId: invoice?.quotationId,
        taxStampId: invoice?.taxStampId,
        amountPaid: invoice?.amountPaid,
        taxWithholdingId: invoice?.taxWithholdingId,
        taxWithholdingAmount: invoice?.taxWithholdingAmount
      };
    
      // Vérifie si l'état a changé avant de mettre à jour
      if (JSON.stringify(state) !== JSON.stringify(newState)) {
        return newState;
      }
    
      // Si l'état est le même, on ne fait pas de mise à jour
      return state;
    });    
  },
  reset: () => set({ ...initialState })
}));
