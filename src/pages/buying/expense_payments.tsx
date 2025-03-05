import { ExpensePaymentMain } from '@/components/buying/expense_payment/ExpensePaymentMain';
import React from 'react';

export default function InvoicesPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden p-8">
      <ExpensePaymentMain className="p-5 my-10" />
    </div>
  );
}
