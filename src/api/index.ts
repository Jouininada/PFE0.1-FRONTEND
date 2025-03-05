import { admin } from './admin';
export * from './admin';
import { auth } from './auth';
export * from './auth';
import { activity } from './activity';
export * from './activity';
import { address } from './address';
export * from './address';
import { article } from './article';
export * from './article';
import { appConfig } from './app-config';
export * from './app-config';
import { bankAccount } from './bank-account';
export * from './bank-account';
import { cabinet } from './cabinet';
export * from './cabinet';
import { country } from './country';
export * from './country';
import { currency } from './currency';
export * from './currency';
import { defaultCondition } from './default-condition';
export * from './default-condition';
import { firm } from './firm';
export * from './firm';
import { firmInterlocutorEntry } from './firm-interlocutor-entry';
export * from './firm-interlocutor-entry';
import { interlocutor } from './interlocutor';
export * from './interlocutor';
import { invoice } from './invoice';
export * from './invoice';
import { payment } from './payment';
export * from './payment';
import { paymentCondition } from './payment-condition';
export * from './payment-condition';
import { permission } from './permission';
export * from './permission';
import { quotation } from './quotation';
export * from './quotation';
import { role } from './role';
export * from './role';
import { tax } from './tax';
export * from './tax';
import { taxWithholding } from './tax-withholding';
export * from './tax-withholding';
import { upload } from './upload';
export * from './upload';
import { user } from './user';
export * from './user';
import { expense_invoice } from './expense_invoice';
export * from './expense_invoice'
import { expense_quotation } from './expense-quotation';
export * from './expense-quotation'
import { expensepayment } from './expense-payment';
export * from './expense-payment'
import { expensepaymentCondition } from './expense-payment-condition';
export * from './expense-payment-condition'

export * from '../types/response';
export * from '../types/enums';

export const api = {
  admin,
  auth,
  activity,
  address,
  article,
  appConfig,
  bankAccount,
  cabinet,
  country,
  currency,
  defaultCondition,
  firm,
  firmInterlocutorEntry,
  interlocutor,
  invoice,
  payment,
  paymentCondition,
  permission,
  quotation,
  role,
  tax,
  taxWithholding,
  upload,
  user,
  expense_invoice,
  expense_quotation,
  expensepayment,
  expensepaymentCondition

};
