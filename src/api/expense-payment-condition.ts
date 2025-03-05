import axios from './axios';
import { isAlphabeticOrSpace } from '@/utils/validations/string.validations';
import { ToastValidation } from '@/types';
import { EXPENSE_PAYMENT_CONDITION_FILTER_ATTRIBUTES } from '@/constants/expense-payment-condition.filter-attributes';
import { ExpenseCreatePaymentConditionDto, ExpensePaymentCondition, ExpenseUpdatePaymentConditionDto, PagedPaymentCondition } from '@/types/expense-payment-condition';

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string = 'id',
  search: string = ''
): Promise<PagedPaymentCondition> => {
  const generalFilter = search
    ? Object.values(EXPENSE_PAYMENT_CONDITION_FILTER_ATTRIBUTES)
        .map((key) => `${key}||$cont||${search}`)
        .join('||$or||')
    : '';
  const response = await axios.get<PagedPaymentCondition>(
    `public/expense-payment-condition/list?sort=${sortKey},${order}&filter=${generalFilter}&limit=${size}&page=${page}`
  );
  return response.data;
};

const find = async (): Promise<ExpensePaymentCondition[]> => {
  const response = await axios.get<ExpensePaymentCondition[]>('public/expense-payment-condition/all');
  return response.data;
};

const create = async (paymentMethod: ExpenseCreatePaymentConditionDto): Promise<ExpensePaymentCondition> => {
  const response = await axios.post<ExpensePaymentCondition>('public/expense-payment-condition', paymentMethod);
  return response.data;
};

const update = async (paymentMethod: ExpenseUpdatePaymentConditionDto): Promise<ExpensePaymentCondition> => {
  const response = await axios.put<ExpensePaymentCondition>(
    `public/expense-payment-condition/${paymentMethod.id}`,
    paymentMethod
  );
  return response.data;
};

const validate = (
    expensepaymentCondition: ExpenseCreatePaymentConditionDto | ExpenseUpdatePaymentConditionDto
): ToastValidation => {
  if (
    expensepaymentCondition &&
    expensepaymentCondition?.label &&
    expensepaymentCondition?.label?.length > 3 &&
    isAlphabeticOrSpace(expensepaymentCondition?.label)
  ) {
    return { message: '' };
  }
  return { message: 'Veuillez entrer un titre valide' };
};

const remove = async (id: number) => {
  const { data, status } = await axios.delete<ExpensePaymentCondition>(`public/expense-payment-condition/${id}`);
  return { data, status };
};

export const expensepaymentCondition = { find, findPaginated, create, update, validate, remove };
