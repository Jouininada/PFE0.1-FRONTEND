import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { api, article } from '@/api';
import { CreateArticleDto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/common/Spinner';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const ExtractFromFileModal: React.FC<{
  file: File;
  fileType: 'image' | 'pdf';
  onClose: () => void;
  open: boolean;
}> = ({ file, fileType, onClose, open }) => {
  const { t } = useTranslation('article');
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileContent, setFileContent] = useState<string>('');
  const [filePreview, setFilePreview] = useState<string>('');
  const [extractedData, setExtractedData] = useState<CreateArticleDto | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const contentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) return;
    
    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFilePreview(e.target.result as string);
        }
      };
      reader.onerror = () => toast.error(t('article.file_preview_error'));
      reader.readAsDataURL(file);
    } else {
      setFilePreview('/pdf-icon.png');
    }
  }, [file, fileType, t]);

  useEffect(() => {
    contentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [fileContent]);

  const extractDataFromFile = async () => {
    try {
      setIsProcessing(true);
      setFileContent('');
      setExtractedData(null);
      
      const simulateTyping = async (text: string) => {
        for (let i = 0; i < text.length; i++) {
          setFileContent(prev => prev + text[i]);
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      };

      await simulateTyping(`${t('article.extraction.starting')} ${fileType === 'image' ? t('article.extraction.from_image') : t('article.extraction.from_pdf')}\n\n`);

      const response = fileType === 'image' 
        ? await api.article.extractFromImage(file)
        : await api.article.extractFromPdf(file);
      
      if (!response?.data) {
        throw new Error(t('article.extraction.invalid_response'));
      }

      const data = response.data;
      setExtractedData(data);

      await simulateTyping(`${t('article.extraction.results')}\n\n`);
      
      await simulateTyping(`${t('article.attributes.title')}: ${data.title || '-'}\n`);
      await simulateTyping(`${t('article.attributes.description')}: ${data.description || '-'}\n`);
      await simulateTyping(`${t('article.attributes.category')}: ${data.category || '-'}\n`);
      await simulateTyping(`${t('article.attributes.sub_category')}: ${data.subCategory || '-'}\n`);
      await simulateTyping(`${t('article.attributes.purchase_price')}: ${data.purchasePrice || 0}\n`);
      await simulateTyping(`${t('article.attributes.sale_price')}: ${data.salePrice || 0}\n`);
      await simulateTyping(`${t('article.attributes.quantity_in_stock')}: ${data.quantityInStock || 0}\n`);
      await simulateTyping(`${t('article.attributes.status')}: ${data.status || 'active'}\n`);
      
      await simulateTyping(`\n${t('article.extraction.complete')}`);
      
    } catch (error) {
      console.error('Extraction error:', error);
      setFileContent(t('article.extraction.error'));
      toast.error(t('article.data_extraction_failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCreate = async () => {
    if (!extractedData) return;
    
    try {
      setIsProcessing(true);
      const result = await api.article.create(extractedData);
      
      if (result) {
        toast.success(t('article.action_create_success'));
        router.push('/article/article-Lists');
      } else {
        toast.error(t('article.action_create_failure'));
      }
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error(t('article.action_create_failure'));
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()} className="max-w-6xl">
        <DialogContent className="max-w-[90vw] h-[80vh] flex p-0">
          <div className="flex-1 flex flex-col p-6 border-r">
            <DialogHeader className="mb-4">
              <DialogTitle>
                {fileType === 'image' 
                  ? t('article.extraction.image_preview') 
                  : t('article.extraction.pdf_preview')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
              {filePreview ? (
                fileType === 'image' ? (
                  <img 
                    src={filePreview} 
                    alt={t('article.extraction.uploaded_file')} 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4">
                    <img 
                      src={filePreview} 
                      alt="PDF icon" 
                      className="h-32 w-32 object-contain mb-4"
                    />
                    <p className="text-center font-medium">{file.name}</p>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Spinner size="medium" show={true} />
                </div>
              )}
            </div>
            
            <div className="flex gap-2 justify-end mt-4">
              <Button 
                onClick={extractDataFromFile} 
                disabled={isProcessing}
                className="min-w-32"
              >
                {isProcessing ? (
                  <>
                    <Spinner size="small" show={true} className="mr-2" />
                    {t('article.extraction.processing')}
                  </>
                ) : (
                  t('article.extraction.extract_button')
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose}
              >
                {t('common.commands.cancel')}
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col p-6">
            <DialogHeader className="mb-4">
              <DialogTitle>{t('article.extraction.extracted_data')}</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-y-auto whitespace-pre-wrap font-mono">
              {fileContent || (
                <div className="text-gray-400 italic">
                  {isProcessing ? t('article.extraction.in_progress') : t('article.extraction.no_data')}
                </div>
              )}
              <div ref={contentEndRef} />
            </div>
            
            {extractedData && (
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={onClose}>
                  {t('article.extraction.dont_use')}
                </Button>
                <Button 
                  onClick={() => setShowConfirmation(true)}
                  disabled={isProcessing}
                >
                  {t('article.create_new_article')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('article.confirmation.title')}</DialogTitle>
            <DialogDescription>
              {t('article.confirmation.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              {t('common.commands.cancel')}
            </Button>
            <Button 
              onClick={handleConfirmCreate}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Spinner size="small" show={true} className="mr-2" />
                  {t('common.commands.creating')}
                </>
              ) : (
                t('common.commands.confirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const CreateArticle: React.FC = () => {
  const { t: tCommon } = useTranslation('common');
  const { t: tArticle } = useTranslation('article');
  const router = useRouter();
  const { setRoutes } = useBreadcrumb();

  const [formData, setFormData] = useState<CreateArticleDto>({
    title: '',
    description: '',
    category: '',
    subCategory: '',
    purchasePrice: 0,
    salePrice: 0,
    quantityInStock: 0,
    status: 'active',
  });

  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState<'image' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf'>('image');
  const [extractionModalOpen, setExtractionModalOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    setRoutes([
      { title: tCommon('menu.inventory'), href: '/article/article-Lists' },
      { title: tCommon('submenu.articles'), href: '/article/article-Lists' },
      { title: tCommon('commands.create') },
    ]);
  }, [router.locale, tCommon, setRoutes]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categories, subCategories] = await Promise.all([
          article.getAllCategories(),
          article.getAllSubCategories()
        ]);
        setAllCategories(categories);
        setFilteredCategories(categories);
        setAllSubCategories(subCategories);
        setFilteredSubCategories(subCategories);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error(tArticle('article.error.loading_data'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tArticle]);

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setFileLoading('image');
          setFileType('image');
          setUploadedFile(file);
          setExtractionModalOpen(true);
        } catch (error) {
          console.error('Error loading image:', error);
          toast.error(tArticle('article.image_upload_failed'));
          setFileLoading(null);
        }
      }
    };
    input.click();
  };

  const handlePdfUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setFileLoading('pdf');
          setFileType('pdf');
          setUploadedFile(file);
          setExtractionModalOpen(true);
        } catch (error) {
          console.error('Error loading PDF:', error);
          toast.error(tArticle('article.pdf_upload_failed'));
          setFileLoading(null);
        }
      }
    };
    input.click();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['purchasePrice', 'salePrice', 'quantityInStock'].includes(name) 
        ? Number(value) 
        : value
    }));

    if (name === 'category') {
      const filtered = allCategories.filter(cat =>
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
      setShowCategoryDropdown(true);
    }

    if (name === 'subCategory') {
      const filtered = allSubCategories.filter(subCat =>
        subCat.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSubCategories(filtered);
      setShowSubCategoryDropdown(true);
    }
  };

  const selectCategory = (category: string) => {
    setFormData(prev => ({ 
      ...prev, 
      category,
      subCategory: ''
    }));
    setShowCategoryDropdown(false);
    
    const filtered = allSubCategories.filter(subCat => 
      subCat.includes(' > ') 
        ? subCat.startsWith(`${category} > `) 
        : true
    );
    
    setFilteredSubCategories(filtered);
    setShowSubCategoryDropdown(filtered.length > 0);
  };

  const selectSubCategory = (subCategory: string) => {
    setFormData(prev => ({ ...prev, subCategory }));
    setShowSubCategoryDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown') && !target.closest('.subcategory-dropdown')) {
        setShowCategoryDropdown(false);
        setShowSubCategoryDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError(tArticle('article.validation.title_required'));
      return false;
    }
    if ([formData.salePrice, formData.purchasePrice, formData.quantityInStock].some(v => v < 0)) {
      setError(tArticle('article.validation.invalid_number'));
      return false;
    }
    setError(null);
    return true;
  };

  const handleConfirmCreate = async () => {
    setShowConfirmation(false);
    setLoading(true);
    
    try {
      const result = await api.article.create(formData);
      if (result) {
        toast.success(tArticle('article.action_create_success'));
        router.push('/article/article-Lists');
      } else {
        toast.error(tArticle('article.action_create_failure'));
      }
    } catch (error) {
      console.error('Error creating article:', error);
      setError(tArticle('article.action_create_failure'));
      toast.error(tArticle('article.action_create_failure'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setShowConfirmation(true);
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      subCategory: '',
      purchasePrice: 0,
      salePrice: 0,
      quantityInStock: 0,
      status: 'active',
    });
    setError(null);
    setShowCategoryDropdown(false);
    setShowSubCategoryDropdown(false);
    setFilteredCategories(allCategories);
    setFilteredSubCategories(allSubCategories);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      {extractionModalOpen && uploadedFile && (
        <ExtractFromFileModal
          file={uploadedFile}
          fileType={fileType}
          onClose={() => {
            setExtractionModalOpen(false);
            setUploadedFile(null);
            setFileLoading(null);
          }}
          open={extractionModalOpen}
        />
      )}

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tArticle('article.confirmation.title')}</DialogTitle>
            <DialogDescription>
              {tArticle('article.confirmation.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              {tCommon('commands.cancel')}
            </Button>
            <Button 
              onClick={handleConfirmCreate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="small" show={true} className="mr-2" />
                  {tCommon('commands.creating')}
                </>
              ) : (
                tCommon('commands.confirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex justify-between items-start">
          <div>
            <CardTitle>{tArticle('article.create_title')}</CardTitle>
            <CardDescription>{tArticle('article.create_description')}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleImageUpload}
              disabled={!!fileLoading}
              variant="outline"
              size="sm"
            >
              {fileLoading === 'image' && <Spinner size="small" show={true} className="mr-2" />}
              {tArticle('article.upload_image')}
            </Button>
            <Button 
              onClick={handlePdfUpload}
              disabled={!!fileLoading}
              variant="outline"
              size="sm"
            >
              {fileLoading === 'pdf' && <Spinner size="small" show={true} className="mr-2" />}
              {tArticle('article.upload_pdf')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">{tArticle('article.attributes.title')}</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={tArticle('article.attributes.title_placeholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">{tArticle('article.attributes.description')}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={tArticle('article.attributes.description_placeholder')}
                    rows={4}
                  />
                </div>

                <div className="relative">
                  <Label htmlFor="category">{tArticle('article.attributes.category')}</Label>
                  <div className="relative">
                    <Input
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCategoryDropdown(true);
                        setShowSubCategoryDropdown(false);
                      }}
                      placeholder={tArticle('article.attributes.category_placeholder')}
                    />
                    {showCategoryDropdown && (
                      <div className="category-dropdown absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredCategories.map((category, index) => (
                          <div
                            key={index}
                            className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${
                              category === formData.category ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => selectCategory(category)}
                          >
                            <span className="mr-2">📁</span>
                            <span className="font-medium">{category}</span>
                            {category === formData.category && (
                              <span className="ml-auto text-green-500">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <Label htmlFor="subCategory">{tArticle('article.attributes.sub_category')}</Label>
                  <div className="relative">
                    <Input
                      id="subCategory"
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleChange}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (formData.category) {
                          setShowSubCategoryDropdown(true);
                          setShowCategoryDropdown(false);
                        } else {
                          toast.warning(tArticle('article.select_category_first'));
                        }
                      }}
                      placeholder={
                        formData.category 
                          ? tArticle('article.attributes.sub_category_placeholder')
                          : tArticle('article.select_category_first')
                      }
                      disabled={!formData.category}
                    />
                    {showSubCategoryDropdown && formData.category && (
                      <div className="subcategory-dropdown absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredSubCategories.map((subCategory, index) => (
                          <div
                            key={index}
                            className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${
                              subCategory === formData.subCategory ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => selectSubCategory(subCategory)}
                          >
                            <span className="mr-2">📂</span>
                            <span className="font-medium">{subCategory}</span>
                            {subCategory === formData.subCategory && (
                              <span className="ml-auto text-green-500">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="purchasePrice">{tArticle('article.attributes.purchase_price')}</Label>
                  <Input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    placeholder={tArticle('article.attributes.purchase_price_placeholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="salePrice">{tArticle('article.attributes.sale_price')}</Label>
                  <Input
                    id="salePrice"
                    name="salePrice"
                    type="number"
                    min="0"
                    value={formData.salePrice}
                    onChange={handleChange}
                    placeholder={tArticle('article.attributes.sale_price_placeholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="quantityInStock">{tArticle('article.attributes.quantity_in_stock')}</Label>
                  <Input
                    id="quantityInStock"
                    name="quantityInStock"
                    type="number"
                    min="0"
                    value={formData.quantityInStock}
                    onChange={handleChange}
                    placeholder={tArticle('article.attributes.quantity_in_stock_placeholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="status">{tArticle('article.attributes.status')}</Label>
                  <Select
                    name="status"
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tArticle('article.attributes.status_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{tArticle('article.status.active')}</SelectItem>
                      <SelectItem value="inactive">{tArticle('article.status.inactive')}</SelectItem>
                      <SelectItem value="pending">{tArticle('article.status.pending')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm col-span-2">{error}</div>}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner size="small" show={true} className="mr-2" />
                    {tCommon('commands.creating')}
                  </>
                ) : (
                  tCommon('commands.create')
                )}
              </Button>
              <Button type="button" variant="secondary" onClick={handleReset}>
                {tCommon('commands.reset')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateArticle;