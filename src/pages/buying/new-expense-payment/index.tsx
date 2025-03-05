import React from 'react';
import { useSearchParams } from 'next/navigation';
import { ExpensePaymentCreateForm } from '@/components/buying/expense_payment/ExpensePaymentCreateForm';

export default function Page() {
  const params = useSearchParams();
  const firmId = params.get('firmId') || undefined;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ExpensePaymentCreateForm firmId={firmId} />
    </div>
  );
}
