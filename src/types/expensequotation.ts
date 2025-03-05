import { Article } from './article';
import { BankAccount } from './bank-account';
import { Cabinet } from './cabinet';
import { Currency } from './currency';
import { DISCOUNT_TYPE } from './enums/discount-types';
import { ExpenseInvoice } from './expense_invoices';
import { Firm } from './firm';
import { Interlocutor } from './interlocutor';
import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';
import { Tax } from './tax';
import { Upload } from './upload';

export enum EXPENSQUOTATION_STATUS {
  Nonexistent = 'expense_quotation.status.non_existent',
  Expired = 'expense_quotation.status.expired',
  Draft = 'expense_quotation.status.draft',
  Validated = 'expense_quotation.status.validated',
  Sent = 'expense_quotation.status.sent',
  Accepted = 'expense_quotation.status.accepted',
  Rejected = 'expense_quotation.status.rejected',
  Invoiced = 'expense_quotation.status.invoiced'
}

export interface ExpenseQuotationMetaData extends DatabaseEntity {
  id?: number;
  showArticleDescription?: boolean;
  hasBankingDetails?: boolean;
  hasGeneralConditions?: boolean;
  hasTaxStamp?: boolean;
  taxSummary?: { taxId: number; amount: number }[];  // corresponds to the `taxSummary` JSON field in the database
}

export interface ExpenseQuotationTaxEntry extends DatabaseEntity {
  id?: number;
  expenseArticleEntryId?: number;  // Linking to `expense_article_quotation_entry`
  tax?: Tax;
  taxId?: number;
}

export interface ExpenseArticleQuotationEntry extends DatabaseEntity {
  id?: number;
  expenseQuotationId?: number;  // Linking to `expense_quotation`
  article?: Article;
  articleId?: number;
  unit_price?: number;
  quantity?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  articleExpensQuotationEntryTaxes?: ExpenseQuotationTaxEntry[];  // Relates to `expense_article_quotation_entry_tax`
  subTotal?: number;
  total?: number;
}

export interface CreateExpensArticleQuotationEntry extends Omit<
  ExpenseArticleQuotationEntry,
  | 'id'
  | 'expenseQuotationId'
  | 'subTotal'
  | 'total'
  | 'updatedAt'
  | 'createdAt'
  | 'deletedAt'
  | 'isDeletionRestricted'
  | 'articleExpensQuotationEntryTaxes'
> {
  taxes?: number[];  // Tax IDs
}

export interface ExpenseQuotationUpload extends DatabaseEntity {
  id?: number;
  expenseQuotationId?: number;  // Linking to `expense_quotation`
  expenseQuotation?: ExpenseQuotation;
  uploadId?: number;
  pdfFileId?:number;
  upload?: Upload;
}

export interface ExpenseQuotation extends DatabaseEntity {
  id?: number;
  sequential?: string;
  sequentialNumbr:string,
  object?: string;
  date?: string;
  dueDate?: string;
  status?: EXPENSQUOTATION_STATUS;
  generalConditions?: string;
  total?: number;
  subTotal?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  currencyId?: number | null;
  currency?: Currency;
  firmId?: number;
  firm?: Firm;
  cabinetId?: number;
  cabinet?: Cabinet;
  interlocutorId?: number;
  interlocutor?: Interlocutor;
  notes?: string;
  expensequotationMetaData?: ExpenseQuotationMetaData;  // Relates to `expense_quotation_meta_data`
  bankAccountId?: number | null;
  bankAccount?: BankAccount;
  expensearticleQuotationEntries?: ExpenseArticleQuotationEntry[];
  uploads?: ExpenseQuotationUpload[];
  invoices: ExpenseInvoice[];
}

export interface CreateExpensQuotationDto
  extends Omit<
    ExpenseQuotation,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'firm'
    | 'cabinet'
    | 'interlocutor'
    | 'sequential'
    | 'bankAccount'
    | 'invoices'
  > {
  articleQuotationEntries?: CreateExpensArticleQuotationEntry[];  // Article entries
  files?: File[];  // Files to upload
  sequentialNumbr:string,
  sequential:string
}

export interface UpdateExpensQuotationDto extends CreateExpensQuotationDto {
  id?: number;
  createInvoice?: boolean;
}

export interface DuplicateExpensQuotationDto {
  id?: number;
  includeFiles?: boolean;
}

export interface PagedExpensQuotation extends PagedResponse<ExpenseQuotation> {}

export interface ExpensQuotationUploadedFile {
  upload: ExpenseQuotationUpload;
  file: File;
}
