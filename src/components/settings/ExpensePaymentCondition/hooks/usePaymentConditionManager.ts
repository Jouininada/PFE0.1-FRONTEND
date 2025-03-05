import { ExpensePaymentCondition } from '@/types/expense-payment-condition';
import { create } from 'zustand';

type ExpensePaymentConditionManager = {
  // data
  id?: number;
  label?: string;
  description?: string;
  // methods
  set: (name: keyof ExpensePaymentConditionManager, value: any) => void;
  reset: () => void;
  getPaymentCondition: () => Partial<ExpensePaymentCondition>;
  setPaymentCondition: (paymentCondition: Partial<ExpensePaymentCondition>) => void;
};

const initialState: Omit<
ExpensePaymentConditionManager,
  'set' | 'reset' | 'getPaymentCondition' | 'setPaymentCondition'
> = {
  id: 0,
  label: '',
  description: ''
};

export const useExpensePaymentConditionManager = create<ExpensePaymentConditionManager>((set, get) => ({
  ...initialState,
  set: (name: keyof ExpensePaymentConditionManager, value: any) =>
    set((state) => ({
      ...state,
      [name]: value
    })),
  reset: () => set({ ...initialState }),
  getPaymentCondition: () => {
    const data = get();
    return {
      id: data.id,
      label: data.label,
      description: data.description
    };
  },
  setPaymentCondition: (paymentCondition: Partial<ExpensePaymentCondition>) => {
    set((state) => ({
      ...state,
      ...paymentCondition
    }));
  }
}));
