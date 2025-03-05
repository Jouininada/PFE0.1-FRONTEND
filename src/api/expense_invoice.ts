import axios from './axios';
import { differenceInDays, isAfter } from 'date-fns';
import { DISCOUNT_TYPE } from '../types/enums/discount-types';
import { upload } from './upload';
import { api } from '.';
import {
  DateRange,
  ToastValidation,
  UpdateInvoiceSequentialNumber
} from '@/types';
import { EXPENSE_INVOICE_STATUS, ExpenseCreateInvoiceDto, ExpenseDuplicateInvoiceDto, ExpenseInvoice, ExpenseInvoiceUploadedFile, ExpensePagedInvoice,ExpenseUpdateInvoiceDto } from '@/types/expense_invoices';
import { EXPENSE_INVOICE_FILTER_ATTRIBUTES } from '@/constants/expense_invoice.filter-attributes';

const factory = (): ExpenseCreateInvoiceDto => {
  return {
    date: '',
    dueDate: '',
    status: EXPENSE_INVOICE_STATUS.Unpaid,
    generalConditions: '',
    total: 0,
    subTotal: 0,
    discount: 0,
    discount_type: DISCOUNT_TYPE.AMOUNT,
    currencyId: 0,
    firmId: 0,
    interlocutorId: 0,
    notes: '',
    sequential:'',
    sequentialNumbr:'',
    articleInvoiceEntries: [],
    expenseInvoiceMetaData: {
      hasBankingDetails: true,
      hasGeneralConditions: true,
      showArticleDescription: true,
      taxSummary: []
    },
    files: []
  };
};

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string,
  search: string = '',
  relations: string[] = ['firm', 'interlocutor'],
  firmId?: number,
  interlocutorId?: number
): Promise<ExpensePagedInvoice> => {
  const generalFilter = search
    ? Object.values(EXPENSE_INVOICE_FILTER_ATTRIBUTES)
        .map((key) => `${key}||$cont||${search}`)
        .join('||$or||')
    : '';
  const firmCondition = firmId ? `firmId||$eq||${firmId}` : '';
  const interlocutorCondition = interlocutorId ? `interlocutorId||$cont||${interlocutorId}` : '';
  const filters = [generalFilter, firmCondition, interlocutorCondition].filter(Boolean).join(',');

  const response = await axios.get<ExpensePagedInvoice>(
    new String().concat(
      'public/expenseinvoice/list?',
      `sort=${sortKey},${order}&`,
      `filter=${filters}&`,
      `limit=${size}&page=${page}&`,
      `join=${relations.join(',')}`
    )
  );
  return response.data;
};

const findOne = async (
  id: number,
  relations: string[] = [
    'firm',
    'currency',
    'bankAccount',
    'quotation',
    'interlocutor',
    'firm.currency',
    'expenseInvoiceMetaData',
    'uploads',
    'uploads.upload',
    'payments',
    'payments.payment',
    'taxWithholding',
    'firm.deliveryAddress',
    'firm.invoicingAddress',
    'articleExpenseEntries',
    'firm.interlocutorsToFirm',
    'articleExpenseEntries.article',
    'articleExpenseEntries.expenseArticleInvoiceEntryTaxes',
    'articleExpenseEntries.expenseArticleInvoiceEntryTaxes.tax'
  ]
): Promise<ExpenseInvoice & { files: ExpenseInvoiceUploadedFile[] }> => {
  const response = await axios.get<ExpenseInvoice>(`public/expenseinvoice/${id}?join=${relations.join(',')}`);
  return { ...response.data, files: await getInvoiceUploads(response.data) };
};



const uploadInvoiceFiles = async (files: File[]): Promise<number[]> => {
  return files && files?.length > 0 ? await upload.uploadFiles(files) : [];
};

const create = async (invoice: ExpenseCreateInvoiceDto, files: File[]): Promise<ExpenseInvoice> => {
  const uploadIds = await uploadInvoiceFiles(files);
  const response = await axios.post<ExpenseInvoice>('public/expenseinvoice', {
    ...invoice,
    uploads: uploadIds.map((id) => {
      return { uploadId: id,filePath:id};
    })
  });
  return response.data;
};

const getInvoiceUploads = async (invoice: ExpenseInvoice): Promise<ExpenseInvoiceUploadedFile[]> => {
  if (!invoice?.uploads) return [];

  const uploads = await Promise.all(
    invoice.uploads.map(async (u) => {
      if (u?.upload?.slug) {
        const blob = await api.upload.fetchBlobBySlug(u.upload.slug);
        const filename = u.upload.filename || '';
        if (blob)
          return { upload: u, file: new File([blob], filename, { type: u.upload.mimetype }) };
      }
      return { upload: u, file: undefined };
    })
  );
  return uploads
    .filter((u) => !!u.file)
    .sort(
      (a, b) =>
        new Date(a.upload.createdAt ?? 0).getTime() - new Date(b.upload.createdAt ?? 0).getTime()
    ) as ExpenseInvoiceUploadedFile[];
};

const duplicate = async (duplicateInvoiceDto: ExpenseDuplicateInvoiceDto): Promise<ExpenseInvoice> => {
  const response = await axios.post<ExpenseInvoice>('public/expenseinvoice/duplicate', duplicateInvoiceDto);
  return response.data;
};

const update = async (invoice: ExpenseUpdateInvoiceDto, files: File[]): Promise<ExpenseInvoice> => {
  const uploadIds = await uploadInvoiceFiles(files);
  const response = await axios.put<ExpenseInvoice>(`public/expenseinvoice/${invoice.id}`, {
    ...invoice,
    uploads: [
      ...(invoice.uploads || []),
      ...uploadIds.map((id) => {
        return { uploadId: id,filePath:id };
      })
    ]
  });
  return response.data;
};

const remove = async (id: number): Promise<ExpenseInvoice> => {
  const response = await axios.delete<ExpenseInvoice>(`public/expenseinvoice/${id}`);
  return response.data;
};

const validate = (invoice: Partial<ExpenseInvoice>, dateRange?: DateRange): ToastValidation => {
  if (!invoice.date) return { message: 'La date est obligatoire' };
  const invoiceDate = new Date(invoice.date);
  if (
    dateRange?.from &&
    !isAfter(invoiceDate, dateRange.from) &&
    invoiceDate.getTime() !== dateRange.from.getTime()
  ) {
    return { message: `La date doit être après ou égale à ${dateRange.from.toLocaleDateString()}` };
  }
  if (
    dateRange?.to &&
    isAfter(invoiceDate, dateRange.to) &&
    invoiceDate.getTime() !== dateRange.to.getTime()
  ) {
    return { message: `La date doit être avant ou égale à ${dateRange.to.toLocaleDateString()}` };
  }
  if (!invoice.dueDate) return { message: "L'échéance est obligatoire" };
  if (!invoice.object) return { message: "L'objet est obligatoire" };
  const dueDate = new Date(invoice.dueDate);
  if (differenceInDays(invoiceDate, dueDate) > 0) {
    return { message: "L'échéance doit être supérieure ou égale à la date" };
  }
  if (!invoice.firmId || !invoice.interlocutorId) {
    return { message: 'Entreprise et interlocuteur sont obligatoire' };
  }
  return { message: '' };
};


export const expense_invoice = {
  factory,
  findPaginated,
  findOne,
  create,
  duplicate,
  update,
  remove,
  validate
};
