import { Firm, Interlocutor } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectShimmer,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import React from 'react';
import { cn } from '@/lib/utils';
import { SequenceInput } from '@/components/invoicing-commons/SequenceInput';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { UneditableCalendarDayPicker } from '@/components/ui/uneditable/uneditable-calendar-day-picker';
import { UneditableInput } from '@/components/ui/uneditable/uneditable-input';
import { DatePicker } from '@/components/ui/date-picker';
import { useQuotationManager } from '../hooks/useExpenseQuotationManager';

interface ExpenseQuotationGeneralInformationProps {
  className?: string;
  firms: Firm[];
  loading?: boolean;
  edit?: boolean;
}

export const ExpenseQuotationGeneralInformation = ({
  className,
  firms,
  edit = true,
  loading
}: ExpenseQuotationGeneralInformationProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const router = useRouter();
  const quotationManager = useQuotationManager();
  const mainInterlocutor = quotationManager.firm?.interlocutorsToFirm?.find(
    (entry) => entry?.isMain
  );

  return (
    <div className={cn(className)}>
      <div className="flex gap-4 pb-5 border-b">
        <div className="w-full">
          <Label>{tInvoicing('expensequotation.attributes.date')} (*)</Label>

          {edit ? (
            <DatePicker
              className="w-full mt-2"
              value={quotationManager?.date || new Date()}
              onChange={(value: Date) => {
                quotationManager.set('date', value);
              }}
              isPending={loading}
            />
          ) : (
            <UneditableCalendarDayPicker value={quotationManager?.date} />
          )}
        </div>
        <div className="w-full">
          <Label>{tInvoicing('expensequotation.attributes.due_date')} (*)</Label>
          {edit ? (
            <DatePicker
              className="w-full mt-2"
              value={quotationManager?.dueDate || new Date()}
              onChange={(value: Date) => {
                quotationManager.set('dueDate', value);
              }}
              isPending={loading}
            />
          ) : (
            <UneditableCalendarDayPicker value={quotationManager?.dueDate} />
          )}
        </div>
      </div>
      <div className="flex gap-4 pb-5 border-b mt-5">
        <div className="w-4/6">
          <Label>{tInvoicing('expensequotation.attributes.object')} (*)</Label>
          {edit ? (
            <Input
              className="mt-1"
              placeholder="Ex. Devis pour le 1er trimestre 2024"
              value={quotationManager.object || ''}
              onChange={(e) => {
                quotationManager.set('object', e.target.value);
              }}
              isPending={loading}
            />
          ) : (
            <UneditableInput value={quotationManager.object} />
          )}
        </div>
        <div className="w-2/6">
          <Label>{tInvoicing('quotation.singular')} N°</Label>
          <SequenceInput
            prefix={quotationManager.sequentialNumber?.prefix}
            dateFormat={quotationManager.sequentialNumber?.dynamicSequence}
            value={quotationManager.sequentialNumber?.next}
            loading={loading}
          />
        </div>
      </div>
      <div>
        <div className="flex gap-4 pb-5 border-b mt-5">
          <div className="flex flex-col gap-4 w-1/2">
            <div>
              <Label>{tInvoicing('expensequotation.attributes.firm')} (*)</Label>
              {edit ? (
                <SelectShimmer isPending={loading}>
                  <Select
                    onValueChange={(e) => {
                      const firm = firms?.find((firm) => firm.id === parseInt(e));
                      quotationManager.setFirm(firm);
                      quotationManager.set('currency', firm?.currency);
                    }}
                    value={quotationManager.firm?.id?.toString()}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={tInvoicing('expensequotation.associate_firm')} />
                    </SelectTrigger>
                    <SelectContent>
                      {firms?.map((firm: Partial<Firm>) => (
                        <SelectItem
                          key={firm.id}
                          value={firm.id?.toString() || ''}
                          className="mx-1">
                          {firm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SelectShimmer>
              ) : (
                <UneditableInput value={quotationManager?.firm?.name} />
              )}
            </div>

            {edit && (
              <Label
                className="mx-1 underline cursor-pointer"
                onClick={() => router.push('/contacts/new-firm')}>
                {tInvoicing('common.firm_not_there')}
              </Label>
            )}
          </div>
          <div className="w-1/2">
            <Label>{tInvoicing('expensequotation.attributes.interlocutor')} (*)</Label>
            {edit ? (
              <SelectShimmer isPending={loading}>
                <Select
                  disabled={!quotationManager?.firm?.id}
                  onValueChange={(e) => {
                    quotationManager.setInterlocutor({ id: parseInt(e) } as Interlocutor);
                  }}
                  value={quotationManager.interlocutor?.id?.toString()}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={tInvoicing('expensequotation.associate_interlocutor')} />
                  </SelectTrigger>
                  <SelectContent>
                    {quotationManager.firm?.interlocutorsToFirm?.map((entry: any) => (
                      <SelectItem
                        key={entry.interlocutor?.id || 'interlocutor'}
                        value={entry.interlocutor?.id?.toString()}
                        className="mx-1">
                        {entry.interlocutor?.name} {entry.interlocutor?.surname}{' '}
                        {entry.isMain && (
                          <span className="font-bold">({tCommon('words.main_m')})</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SelectShimmer>
            ) : (
              <UneditableInput
                value={
                  <div>
                    {quotationManager?.interlocutor?.name} {quotationManager.interlocutor?.surname}{' '}
                    {quotationManager?.interlocutor?.id == mainInterlocutor?.interlocutor?.id && (
                      <span className="font-bold mx-1"> ({tCommon('words.main_m')})</span>
                    )}
                  </div>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
