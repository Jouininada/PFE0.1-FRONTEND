import { create } from 'zustand';

export type ExpenseInvoiceControlManager = {
  isBankAccountDetailsHidden: boolean;
  isGeneralConditionsHidden: boolean;
  isArticleDescriptionHidden: boolean;
  isTaxStampHidden: boolean;
  isTaxWithholdingHidden: boolean;
  toggle: (field: keyof ExpenseInvoiceControlManager) => void;
  set: (field: keyof ExpenseInvoiceControlManager, value: boolean) => void;
  setControls: (
    data: Omit<ExpenseInvoiceControlManager, 'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'>
  ) => void;
  getControls: () => Omit<ExpenseInvoiceControlManager, 'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'>;
  reset: () => void;
};


export const useExpenseInvoiceControlManager = create<ExpenseInvoiceControlManager>()((set, get) => ({
  isBankAccountDetailsHidden: false,
  isGeneralConditionsHidden: false,
  isArticleDescriptionHidden: false,
  isTaxStampHidden: false,
  isTaxWithholdingHidden: true,
  toggle: (field: keyof ExpenseInvoiceControlManager) =>
    set((state) => ({ ...state, [field]: !state[field] })),
  set: (field: keyof ExpenseInvoiceControlManager, value: boolean) =>
    set((state) => ({ ...state, [field]: value })),
  setControls: (data: any) => {
    set((state) => {
      // Vérification avant mise à jour pour éviter un re-render infini
      if (JSON.stringify(state) === JSON.stringify({ ...state, ...data })) {
        return state; // Ne pas modifier l'état si rien ne change
      }
      return { ...state, ...data };
    });
  },
  getControls: () => {
    return get();
  },
  reset: () =>
    set({
      isBankAccountDetailsHidden: false,
      isGeneralConditionsHidden: false,
      isArticleDescriptionHidden: false,
      isTaxStampHidden: false,
      isTaxWithholdingHidden: true,
    })
}));
