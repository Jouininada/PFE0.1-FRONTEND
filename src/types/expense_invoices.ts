import { Article } from './article';
import { Cabinet } from './cabinet';
import { Currency } from './currency';
import { DISCOUNT_TYPE } from './enums/discount-types';
import { ExpenseQuotation } from './expensequotation';
import { Firm } from './firm';
import { Interlocutor } from './interlocutor';
import { PaymentInvoiceEntry } from './payment';
import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';
import { Tax } from './tax';
import { TaxWithholding } from './tax-withholding';
import { Upload } from './upload';

export enum EXPENSE_INVOICE_STATUS {
  Nonexistent = 'expense_invoice.status.non_existent',
  Draft = 'expense_invoice.status.draft',
  Validated = 'expense_invoice.status.validated',
  Sent = 'expense_invoice.status.sent',
  Paid = 'expense_invoice.status.paid',
  PartiallyPaid = 'expense_invoice.status.partially_paid',
  Unpaid = 'expense_invoice.status.unpaid',
  Expired = 'expense_invoice.status.expired'
}

export interface ExpenseInvoiceTaxEntry extends DatabaseEntity {
  id?: number;
  expenseArticleInvoiceEntryId?: number;
  tax?: Tax;
  taxId?: number;
}

export interface ExpenseArticleInvoiceEntry extends DatabaseEntity {
  id?: number;
  expenseInvoiceId?: number;
  article?: Article;
  articleId?: number;
  unit_price?: number;
  quantity?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  expenseArticleInvoiceEntryTaxes?: ExpenseInvoiceTaxEntry[];
  subTotal?: number;
  total?: number;
}

export interface ExpenseCreateArticleInvoiceEntry
  extends Omit<
  ExpenseArticleInvoiceEntry,
    | 'id'
    | 'expenseInvoiceId'
    | 'subTotal'
    | 'total'
    | 'updatedAt'
    | 'createdAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'expenseArticleInvoiceEntryTaxes'
  > {
  taxes?: number[];
}

export interface ExpenseInvoiceMetaData extends DatabaseEntity {
  id?: number;
  showInvoiceAddress?: boolean;
  showDeliveryAddress?: boolean;
  showArticleDescription?: boolean;
  hasBankingDetails?: boolean;
  hasGeneralConditions?: boolean;
  hasTaxStamp?: boolean;
  taxSummary?: { taxId: number; amount: number }[];
  hasTaxWithholding?: boolean;
}

export interface ExpenseInvoiceUpload extends DatabaseEntity {
  id?: number;
  expenseInvoiceId?: number;
  invoice?: ExpenseInvoice;
  uploadId?: number;
  upload?: Upload;
}

export interface ExpenseInvoice extends DatabaseEntity {
  id?: number;
  sequential?: string;
  sequentialNumbr?: string;
  object?: string;
  date?: string;
  dueDate?: string;
  status?: EXPENSE_INVOICE_STATUS;
  generalConditions?: string;
  defaultCondition?: boolean;
  total?: number;
  amountPaid?: number;
  subTotal?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  currencyId?: number;
  currency?: Currency;
  bankAccountId?: number;
  bankAccount?: Currency;
  firmId?: number;
  firm?: Firm;
  cabinet?: Cabinet;
  cabinetId?: number;
  interlocutorId?: number;
  interlocutor?: Interlocutor;
  notes?: string;
  quotationId?: number;
  quotation?: ExpenseQuotation;
  articleExpenseEntries?: ExpenseArticleInvoiceEntry[];
  expenseInvoiceMetaData?: ExpenseInvoiceMetaData;
  uploads?: ExpenseInvoiceUpload[];
  payments?: PaymentInvoiceEntry[];
  taxStamp?: Tax;
  taxStampId?: number;
  taxWithholding?: TaxWithholding;
  taxWithholdingId?: number;
  taxWithholdingAmount?: number;

}

export interface ExpenseCreateInvoiceDto
  extends Omit<
    ExpenseInvoice,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'articles'
    | 'firm'
    | 'interlocutor'
    | 'sequential'
    | 'bankAccount'
  > {
  articleInvoiceEntries?: ExpenseCreateArticleInvoiceEntry[];
  files?: File[];
  sequential:string,
}

export interface ExpenseUpdateInvoiceDto extends ExpenseCreateInvoiceDto {
  id?: number;
}

export interface ExpenseDuplicateInvoiceDto {
  id?: number;
  includeFiles?: boolean;
}

export interface ExpensePagedInvoice extends PagedResponse<ExpenseInvoice> {}

export interface ExpenseInvoiceUploadedFile {
  upload: ExpenseInvoiceUpload;
  file: File;
}

export interface ExpenseResponseInvoiceRangeDto {
  next?: ExpenseInvoice;
  previous?: ExpenseInvoice;
}
