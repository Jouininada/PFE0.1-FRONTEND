import { api } from '@/api';
import {
  BankAccount,
  Currency,
  EXPENSQUOTATION_STATUS,
  ExpensQuotationUploadedFile,
  ExpenseQuotation,
  Firm,
  Interlocutor,
  PaymentCondition,
  QuotationUploadedFile
} from '@/types';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { create } from 'zustand';

type ExpenseQuotationManager = {
  // data
  id?: number;
  sequential: string;
  sequentialNumbr: string;
  date: Date | undefined;
  dueDate: Date | undefined;
  object: string;
  firm?: Firm;
  interlocutor?: Interlocutor;
  subTotal: number;
  total: number;
  discount: number;
  discount_type: DISCOUNT_TYPE;
  bankAccount?: BankAccount;
  currency?: Currency;
  notes: string;
  status: EXPENSQUOTATION_STATUS;
  generalConditions: string;
  uploadedFiles: QuotationUploadedFile[];
  // utility data
  isInterlocutorInFirm: boolean;
  // methods
  setFirm: (firm?: Firm) => void;
  setInterlocutor: (interlocutor?: Interlocutor) => void;
  set: (name: keyof ExpenseQuotationManager, value: any) => void;
  getQuotation: () => Partial<ExpenseQuotationManager>;
  setQuotation: (
    quotation: Partial<ExpenseQuotation & { files: ExpensQuotationUploadedFile[] }>,
    firms?: Firm[],
    bankAccounts?: BankAccount[]
  ) => void;
  reset: () => void;
};

const getDateRangeAccordingToPaymentConditions = (paymentCondition: PaymentCondition) => {
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

const initialState: Omit<
  ExpenseQuotationManager,
  'set' | 'reset' | 'setFirm' | 'setInterlocutor' | 'getQuotation' | 'setQuotation'
> = {
  id: -1,
  sequential: '',
  sequentialNumbr:'',
  date: undefined,
  dueDate: undefined,
  object: '',
  firm: api?.firm?.factory() || undefined,
  interlocutor: api?.interlocutor?.factory() || undefined,
  subTotal: 0,
  total: 0,
  discount: 0,
  discount_type: DISCOUNT_TYPE.PERCENTAGE,
  bankAccount: api?.bankAccount?.factory() || undefined,
  currency: api?.currency?.factory() || undefined,
  notes: '',
  status: EXPENSQUOTATION_STATUS.Draft,
  generalConditions: '',
  isInterlocutorInFirm: false,
  uploadedFiles: []
};

export const useExpenseQuotationManager = create<ExpenseQuotationManager>((set, get) => ({
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
    set: (name: keyof ExpenseQuotationManager, value: any) => {
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
  getQuotation: () => {
    const {
      id,
      sequentialNumbr,
      date,
      dueDate,
      object,
      firm,
      interlocutor,
      discount,
      discount_type,
      notes,
      generalConditions,
      bankAccount,
      currency,
      uploadedFiles,
      ...rest
    } = get();

    return {
      id,
      sequentialNumbr,
      date,
      dueDate,
      object,
      firmId: firm?.id,
      interlocutorId: interlocutor?.id,
      discount,
      discount_type,
      notes,
      generalConditions,
      bankAccountId: bankAccount?.id,
      currencyId: currency?.id,
      uploadedFiles
    };
  },
  setQuotation: (
    quotation: Partial<ExpenseQuotation & { files: ExpensQuotationUploadedFile[] }>,
    firms?: Firm[],
    bankAccounts?: BankAccount[]
  ) => {
    set((state) => ({
      ...state,
      id: quotation?.id,
      sequentialNumbr: quotation?.sequentialNumbr,
      date: quotation?.date ? new Date(quotation?.date) : undefined,
      dueDate: quotation?.dueDate ? new Date(quotation?.dueDate) : undefined,
      object: quotation?.object,
      firm: firms?.find((firm) => quotation?.firm?.id === firm.id),
      interlocutor: quotation?.interlocutor,
      discount: quotation?.discount,
      discount_type: quotation?.discount_type,
      bankAccount: quotation?.bankAccount,
      currency: quotation?.currency || quotation?.firm?.currency,
      notes: quotation?.notes,
      generalConditions: quotation?.generalConditions,
      status: quotation?.status,
      uploadedFiles: quotation?.files || []
    }));
  },
  reset: () => set({ ...initialState })
}));
