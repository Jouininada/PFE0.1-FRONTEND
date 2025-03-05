import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';

export interface ExpensePaymentCondition extends DatabaseEntity {
  id?: number;
  label?: string;
  description?: string;
}
export interface ExpenseCreatePaymentConditionDto
  extends Pick<ExpensePaymentCondition, 'label' | 'description'> {}
export interface ExpenseUpdatePaymentConditionDto
  extends Pick<ExpensePaymentCondition, 'label' | 'description' | 'id'> {}
export interface PagedPaymentCondition extends PagedResponse<ExpensePaymentCondition> {}
