import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArticleQuotationEntry, Currency, QuotationTaxEntry, Tax, Article } from '@/types';

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { UneditableInput } from '@/components/ui/uneditable/uneditable-input';
import { api } from '@/api';
import { Checkbox } from '@/components/ui/checkbox'; // Importez le composant Checkbox
import { ExpenseInvoiceTaxEntries } from '../../expense_invoice/form/ExpenseInvoiceTaxEntries';

interface ExpenseQuotationArticleItemProps {
  className?: string;
  article: ArticleQuotationEntry;
  onChange: (item: ArticleQuotationEntry) => void;
  showDescription?: boolean;
  currency?: Currency;
  taxes: Tax[];
  edit?: boolean;
  articles?: Article[]; // Liste des articles (optionnelle)
}

export const ExpenseQuotationArticleItem: React.FC<ExpenseQuotationArticleItemProps> = ({
  className,
  article,
  onChange,
  taxes,
  currency,
  showDescription = false,
  edit = true,
  articles: propArticles = [], // Valeur par défaut : un tableau vide
}) => {
  const { t: tInvoicing } = useTranslation('invoicing');

  // États pour gérer les articles, le chargement et les erreurs
  const [articles, setArticles] = useState<Article[]>(propArticles);
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [useExistingArticle, setUseExistingArticle] = useState<boolean>(false); // Contrôle l'affichage de la liste déroulante

  const digitAfterComma = currency?.digitAfterComma || 3;
  const currencySymbol = currency?.symbol || '$';

  // Récupérer les articles depuis l'API
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setFormError(null);
      try {
        // Mettez à jour l'état des articles
        const response = await api.article.findPaginated(1, 5, 'ASC', 'title');
        setArticles(response.data); // Mettez à jour l'état des articles
      } catch (error) {
        setFormError('Impossible de récupérer les articles. Veuillez réessayer plus tard.');
        toast.error('Erreur lors de la récupération des articles');
      } finally {
        setLoading(false);
      }
    };

    // Ne récupérez les articles que si la liste est vide (évitez les appels inutiles)
    if (articles.length === 0) {
      fetchArticles();
    }
  }, [articles]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...article,
      article: {
        id: article?.article?.id ?? 0,  // Assurez-vous que l'ID existe (vous pouvez choisir une valeur par défaut ici)
        ...article.article,
        title: e.target.value,
      },
    });
  };

  const handleSelectArticle = (value: string) => {
    const selectedArticle = articles.find((art) => art.id === parseInt(value));
    if (selectedArticle) {
      onChange({
        ...article,
        article: {
          ...article.article,
          id: article?.article?.id ?? 0,  // Assurez-vous que l'ID existe (vous pouvez choisir une valeur par défaut ici)
          title: selectedArticle.title,
          description: selectedArticle.description,
        },
      });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...article,
      article: {
        ...article.article,
        id: article?.article?.id ?? 0,  // Assurez-vous que l'ID existe (vous pouvez choisir une valeur par défaut ici)
        description: e.target.value,
      },
    });
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = e.target.value;
    const regex = new RegExp(`^\\d*(\\.\\d{0,${digitAfterComma}})?$`);
    if (quantity.match(regex)) {
      onChange({
        ...article,
        quantity: parseFloat(quantity),
      });
    }
  };

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const unit_price = e.target.value;
    const regex = new RegExp(`^\\d*(\\.\\d{0,${digitAfterComma}})?$`);
    if (unit_price.match(regex)) {
      onChange({
        ...article,
        unit_price: parseFloat(unit_price),
      });
    }
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const discount = e.target.value;
    const { discount_type } = article;

    if (discount_type === DISCOUNT_TYPE.PERCENTAGE) {
      const percentage = parseFloat(discount);
      onChange({
        ...article,
        discount: percentage,
      });

    } else if (discount_type === DISCOUNT_TYPE.AMOUNT) {
      const regex = new RegExp(`^\\d*(\\.\\d{0,${3}})?$`);
    } else if (discount_type === DISCOUNT_TYPE.AMOUNT) {
      const regex = new RegExp(`^\\d*(\\.\\d{0,${digitAfterComma}})?$`);
      if (regex.test(discount)) {
        onChange({
          ...article,
          discount: parseFloat(discount),
        });
      }
    }
  };

  const handleDiscountTypeChange = (value: string) => {
    onChange({
      ...article,

      discount_type: value === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
      discount: 0 // Reset discount to 0 when changing the typ
    });
  };

  const handleTaxChange = (value: string, index: number) => {
    const selectedTax = taxes.find((tax) => tax.id === parseInt(value));
    const updatedTaxes = [...(article.articleQuotationEntryTaxes || [])];
    if (selectedTax) {
      updatedTaxes[index] = { tax: selectedTax };
    } else {
      updatedTaxes.splice(index, 1);
    }
    onChange({ ...article, articleQuotationEntryTaxes: updatedTaxes });
  };

  const handleTaxDelete = (index: number) => {
    const updatedTaxes = article.articleQuotationEntryTaxes?.filter((_, i) => i !== index);
    onChange({ ...article, articleQuotationEntryTaxes: updatedTaxes });
  };

  const handleAddTax = () => {
    if ((article.articleQuotationEntryTaxes?.length || 0) >= taxes.length) {
      toast.warning(tInvoicing('quotation.errors.surpassed_tax_limit'));
      return;
    }
    onChange({
      ...article,
      articleQuotationEntryTaxes: [
        ...(article.articleQuotationEntryTaxes || []),
        {} as QuotationTaxEntry,
      ],
    });
  };

  const selectedTaxIds = article.articleQuotationEntryTaxes?.map((t) => t.tax?.id) || [];

  return (
    <div className={cn('flex flex-row items-center gap-6 h-full', className)}>
      <div className="w-9/12">
        <div className="flex flex-row gap-2 my-1">
          {/* Title */}
          <div className="w-3/5">
            <Label className="mx-1">{tInvoicing('article.attributes.title')}</Label>
            {edit ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="use-existing-article"
                    checked={useExistingArticle}
                    onCheckedChange={(checked) => setUseExistingArticle(!!checked)}
                  />
                  <Label htmlFor="use-existing-article">
                    {tInvoicing('Article existant')}
                  </Label>
                </div>
                {useExistingArticle ? (
                  <Select onValueChange={handleSelectArticle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un article" />
                    </SelectTrigger>
                    <SelectContent>
                    {articles.map((art) => (
  art.id !== undefined && (
    <SelectItem key={art.id} value={art.id.toString()}>
      {art.title}
    </SelectItem>
  )
))}
                      {articles.map((art) => (
                        <SelectItem key={art.id} value={art.id.toString()}>
                          {art.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Saisissez un titre"
                    value={article.article?.title}
                    onChange={handleTitleChange}
                  />
                )}
              </div>
            ) : (
              <UneditableInput value={article.article?.title} />
            )}
          </div>
          {/* Quantity */}
          <div className="w-1/5">
            <Label className="mx-1">{tInvoicing('article.attributes.quantity')}</Label>
            {edit ? (
              <Input
                type="number"
                placeholder="0"
                value={article.quantity}
                onChange={handleQuantityChange}
              />
            ) : (
              <UneditableInput value={article.quantity} />
            )}
          </div>
          {/* Price */}
          <div className="w-1/5">
            <Label className="mx-1">{tInvoicing('article.attributes.unit_price')}</Label>
            <div className="flex items-center gap-2">
              {edit ? (
                <Input
                  type="number"
                  placeholder="0"
                  value={article.unit_price}
                  onChange={handleUnitPriceChange}
                />
              ) : (
                <UneditableInput value={article.unit_price} />
              )}
              <Label className="font-bold mx-1">{currency?.symbol}</Label>
            </div>
          </div>
        </div>
        <div>
          {showDescription && (
            <div>
              {edit ? (
                <>
                  <Label className="mx-1">{tInvoicing('article.attributes.description')}</Label>
                  <Textarea
                    placeholder="Description"
                    className="resize-none"
                    value={article.article?.description}
                    onChange={handleDescriptionChange}
                    rows={3}
                  />
                </>
              ) : (
                article.article?.description && (
                  <>
                    <Label className="mx-1">{tInvoicing('article.attributes.description')}</Label>
                    <Textarea
                      disabled
                      value={article.article?.description}
                      className="resize-none"
                      rows={3 + (article?.articleQuotationEntryTaxes?.length || 0)}
                    />
                  </>
                )
              )}
            </div>
          )}
        </div>
      </div>
      <div className="w-3/12 flex flex-col h-full">
        {/* Taxes */}
        <div className="my-auto">
          <Label className="block my-3">{tInvoicing('article.attributes.taxes')}</Label>
          <ExpenseInvoiceTaxEntries
            article={article}
            taxes={taxes}
            selectedTaxIds={selectedTaxIds}
            currency={currency}
            handleTaxAdd={handleAddTax}
            handleTaxChange={handleTaxChange}
            handleTaxDelete={handleTaxDelete}
            edit={edit}
          />
        </div>

        {/* Discount */}
        <div className="my-auto py-5">
          <Label className="mx-1">{tInvoicing('quotation.attributes.discount')}</Label>
          <div className="flex items-center gap-2">
            {edit ? (
              <Input
                className="w-1/2"
                type="number"
                placeholder="0"
                value={article.discount}
                onChange={handleDiscountChange}
              />
            ) : (
              <UneditableInput className="w-1/2" value={article.discount || '0'} />
            )}
            {edit ? (
              <Select
                onValueChange={handleDiscountTypeChange}
                defaultValue={
                  article.discount_type === DISCOUNT_TYPE.PERCENTAGE ? 'PERCENTAGE' : 'AMOUNT'
                }>
                <SelectTrigger className="w-1/2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">%</SelectItem>
                  <SelectItem value="AMOUNT">{currency?.symbol || '$'}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <UneditableInput
                className="w-1/2 font-bold mx-1"
                value={
                  article.discount_type === DISCOUNT_TYPE.PERCENTAGE ? '%' : currency?.symbol || '$'
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="w-2/12 text-center flex flex-col justify-between h-full gap-12 mx-4">
        <div className="flex flex-col gap-2 my-auto">
          <Label className="font-bold mx-1">{tInvoicing('article.attributes.tax_excluded')}</Label>
          <Label>
            {article?.subTotal?.toFixed(digitAfterComma)} {currencySymbol}
          </Label>
        </div>
        <div className="flex flex-col gap-2 my-auto">
          <Label className="font-bold mx-1">{tInvoicing('article.attributes.tax_included')}</Label>
          <Label>
            {article?.total?.toFixed(digitAfterComma)} {currencySymbol}
          </Label>
        </div>
      </div>
    </div>
  );
};