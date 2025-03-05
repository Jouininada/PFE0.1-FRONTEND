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
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { UneditableCalendarDayPicker } from '@/components/ui/uneditable/uneditable-calendar-day-picker';
import { UneditableInput } from '@/components/ui/uneditable/uneditable-input';
import { DatePicker } from '@/components/ui/date-picker';
import { useExpenseInvoiceManager } from '../hooks/useExpenseInvoiceManager';
import { FileUploader } from '@/components/ui/file-uploader';
import { Card } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid'; // Installer uuid avec npm install uuid


interface ExpenseInvoiceGeneralInformationProps {
  className?: string;
  firms: Firm[];
  isInvoicingAddressHidden?: boolean;
  isDeliveryAddressHidden?: boolean;
  edit?: boolean;
  loading?: boolean;
}

export const ExpenseInvoiceGeneralInformation = ({
  className,
  firms,
  edit = true,
  loading
}: ExpenseInvoiceGeneralInformationProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const router = useRouter();
  const invoiceManager = useExpenseInvoiceManager();
  const mainInterlocutor = invoiceManager.firm?.interlocutorsToFirm?.find((entry) => entry?.isMain);

  const handleFilesChange = (files: File[]) => {
    if (files.length > invoiceManager.uploadedFiles.length) {
      const newFiles = files.filter(
        (file) => !invoiceManager.uploadedFiles.some((uploadedFile) => uploadedFile.file === file)
      );
      invoiceManager.set('uploadedFiles', [
        ...invoiceManager.uploadedFiles,
        ...newFiles.map((file) => ({
          file,
          filePath: URL.createObjectURL(file),
          id: uuidv4(), // Ajouter un identifiant unique
        })),
      ]);
    } else {
      const updatedFiles = invoiceManager.uploadedFiles.filter((uploadedFile) =>
        files.some((file) => file === uploadedFile.file)
      );
      invoiceManager.set('uploadedFiles', updatedFiles);
    }
  };
  const compressAndDownloadFile = (file: File) => {
    if (file.type.startsWith('image')) {
      const img = new Image();
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        img.src = reader.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 800;
        const scaleSize = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, { type: file.type });
            downloadFile(compressedFile);
          }
        }, file.type);
      };
    } else {
      downloadFile(file);
    }
  };

  const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };


  
  return (
    <div className={cn(className)}>
      <div className="flex gap-4 pb-5 border-b">
        <div className="w-full">
          <Label className="text-lg font-semibold mb-3">{tInvoicing('invoice.attributes.files')}</Label>
          
          <Card className="p-4 border-2 border-dashed border-blue-400 bg-gray-50 my-3 rounded-lg">
            <div className="flex flex-col items-center p-4 bg-white rounded-md border-dashed border-2 border-blue-300">
              <UploadCloud className="text-blue-500 mb-2" size={36} />
              <p className="text-gray-300 mb-2 text-sm">
                {tInvoicing('invoice.attributes.dragAndDrop')}
              </p>
              <p className="text-xs text-gray-400">
                Supported formats: XLS, XLSX, PDF, DOCX, PNG, JPG
              </p>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".xls,.xlsx,.pdf,.docx,.png,.jpg"
                multiple
                onChange={(e) => handleFilesChange(Array.from(e.target.files || []))}
              />
              <label
                htmlFor="file-upload"
                className="text-blue-600 cursor-pointer mt-3 text-sm"
              >
                {tCommon('chooseFile')}
              </label>
            </div>

            {/* Affichage des fichiers téléchargés avec vignettes et options */}
            <div className="mt-4 grid grid-cols-1 gap-3">
              {invoiceManager.uploadedFiles?.map((uploadedFile, index) => {
                const file = uploadedFile.file;
                const fileURL = URL.createObjectURL(file);

                return (
                  <div key={index} className="flex flex-col items-center p-3 border rounded-lg bg-white max-w-[250px]">
                    <div className="w-full h-20 overflow-hidden mb-2">
                      {file.type.startsWith('image') ? (
                        <img src={fileURL} alt={file.name} className="object-cover w-full h-full" />
                      ) : (
                        <div className="flex justify-center items-center w-full h-full bg-gray-200 text-gray-500 text-xs">
                          <p>{file.name.split('.').pop()?.toUpperCase()}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-center text-gray-600">{file.name}</p>
                    <div className="mt-2 flex justify-between gap-1 w-full">
                      <Button
                        variant="outline"
                        className="text-gray-500 border-gray-300 text-xs"
                        onClick={() => {
                          const updatedFiles = invoiceManager.uploadedFiles.filter((item) => item.file !== file);
                          invoiceManager.set('uploadedFiles', updatedFiles);
                        }}
                      >
                        Remove
                      </Button>
                      <Button
                        className="bg-blue-600 text-white text-xs"
                        onClick={() => compressAndDownloadFile(file)}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
  
      {/* Section Date et Due Date */}
      <div className="flex gap-4 pb-5 border-b mt-5">
        <div className="w-full">
          <Label>{tInvoicing('invoice.attributes.date')} (*)</Label>
          {edit ? (
            <DatePicker
              className="w-full mt-2"
              value={invoiceManager?.date || new Date()}
              onChange={(value: Date) => {
                invoiceManager.set('date', value);
              }}
              isPending={loading}
            />
          ) : (
            <UneditableCalendarDayPicker value={invoiceManager?.date} />
          )}
        </div>
        <div className="w-full">
          <Label>{tInvoicing('invoice.attributes.due_date')} (*)</Label>
          {edit ? (
            <DatePicker
              className="w-full mt-2"
              value={invoiceManager?.dueDate || undefined}
              onChange={(value: Date) => {
                invoiceManager.set('dueDate', value);
              }}
              isPending={loading}
            />
          ) : (
            <UneditableCalendarDayPicker value={invoiceManager?.date} />
          )}
        </div>
      </div>
  
      {/* Section Object et Sequence Number */}
      <div className="flex gap-4 pb-5 border-b mt-5">
  <div className="w-4/6">
    <Label>{tInvoicing('invoice.attributes.object')} (*)</Label>
    {edit ? (
      <Input
        className="mt-1"
        placeholder="Ex. Facture pour le 1er trimestre 2024"
        value={invoiceManager.object || ''}
        onChange={(e) => {
          invoiceManager.set('object', e.target.value);
        }}
        isPending={loading}
      />
    ) : (
      <UneditableInput value={invoiceManager.object} />
    )}
  </div>
  <div className="w-2/6">
  <Label>{tInvoicing('invoice.singular')} N°</Label>
  {edit ? (
    <Input
      className="mt-1"
      placeholder="Numéro de Facture"
      value={invoiceManager.sequentialNumbr || ''}  // Affichage de la valeur actuelle de sequentialNumbr
      onChange={(e) => {
        const newValue = e.target.value;
        console.log("Nouvelle valeur du numéro saisi:", newValue);

        // Ne mettre à jour sequentialNumbr que si l'utilisateur veut vraiment le modifier
        if (invoiceManager.sequential !== newValue) {
          invoiceManager.set('sequentialNumbr', newValue);  // Met à jour sequentialNumbr avec la valeur saisie
        }
      }}
      isPending={loading}
    />
  ) : (
    <UneditableInput value={invoiceManager.sequentialNumbr || ''} />
  )}
</div>
</div>
      {/* Section Firm et Interlocutor */}
      <div className="flex gap-4 pb-5 border-b mt-5">
        <div className="flex flex-col gap-4 w-1/2">
          <div>
            <Label>{tInvoicing('invoice.attributes.firm')} (*)</Label>
            {edit ? (
              <SelectShimmer isPending={loading}>
                <Select
                  onValueChange={(e) => {
                    const firm = firms?.find((firm) => firm.id === parseInt(e));
                    invoiceManager.setFirm(firm);
                    invoiceManager.set('currency', firm?.currency);
                  }}
                  value={invoiceManager.firm?.id?.toString()}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={tInvoicing('invoice.associate_firm')} />
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
              <UneditableInput value={invoiceManager?.firm?.name} />
            )}
          </div>
  
          {/* Shortcut to access firm form */}
          {edit && (
            <Label
              className="mx-1 underline cursor-pointer"
              onClick={() => router.push('/contacts/new-firm')}>
              {tInvoicing('common.firm_not_there')}
            </Label>
          )}
        </div>
        <div className="w-1/2">
          <Label>{tInvoicing('invoice.attributes.interlocutor')} (*)</Label>
          {edit ? (
            <SelectShimmer isPending={loading}>
              <Select
                disabled={!invoiceManager?.firm?.id}
                onValueChange={(e) => {
                  invoiceManager.setInterlocutor({ id: parseInt(e) } as Interlocutor);
                }}
                value={invoiceManager.interlocutor?.id?.toString()}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={tInvoicing('invoice.associate_interlocutor')} />
                </SelectTrigger>
                <SelectContent>
                  {invoiceManager.firm?.interlocutorsToFirm?.map((entry: any) => (
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
                  {invoiceManager?.interlocutor?.name} {invoiceManager.interlocutor?.surname}
                  {invoiceManager?.interlocutor?.id == mainInterlocutor?.interlocutor?.id && (
                    <span className="font-bold mx-1"> ({tCommon('words.main_m')})</span>
                  )}
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );  
};
