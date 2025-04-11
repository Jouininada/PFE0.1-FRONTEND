import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { api, article } from '@/api';
import { Article, ArticleCompareResponseDto, UpdateArticleDto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/Spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Edit, Save, X, FileText, Image } from 'lucide-react';

const CompareModal: React.FC<{
  file: File;
  fileType: 'image' | 'pdf';
  articleData: Article;
  onClose: () => void;
  open: boolean;
}> = ({ file, fileType, articleData, onClose, open }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileContent, setFileContent] = useState<string>('');
  const [filePreview, setFilePreview] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<ArticleCompareResponseDto | null>(null);
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
      reader.readAsDataURL(file);
    } else {
      setFilePreview('/pdf-icon.png');
    }
  }, [file, fileType]);

  useEffect(() => {
    contentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [fileContent]);

  const compareData = async () => {
    try {
      setIsProcessing(true);
      setFileContent('');
      setComparisonResult(null);
      
      const simulateTyping = async (text: string) => {
        for (let i = 0; i < text.length; i++) {
          setFileContent(prev => prev + text[i]);
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      };

      await simulateTyping(`Début de la comparaison avec ${fileType === 'image' ? 'une image' : 'un PDF'}...\n\n`);

      const response = fileType === 'image' 
        ? await article.compareWithImage(articleData.id, file)
        : await article.compareWithPdf(articleData.id, file);
      
      setComparisonResult(response);

      await simulateTyping(`Résultats de la comparaison :\n\n`);
      
      // Affichage des différences pour chaque champ
      await simulateTyping(`Titre:\n`);
      await simulateTyping(`- Article: ${articleData.title}\n`);
      await simulateTyping(`- ${fileType === 'image' ? 'Image' : 'PDF'}: ${response.extractedData?.title || 'Non trouvé'}\n`);
      await simulateTyping(`→ ${response.titleMatch ? '✓ Correspond' : '✗ Différent'}\n\n`);
      
      await simulateTyping(`Description:\n`);
      await simulateTyping(`- Article: ${articleData.description}\n`);
      await simulateTyping(`- ${fileType === 'image' ? 'Image' : 'PDF'}: ${response.extractedData?.description || 'Non trouvé'}\n`);
      await simulateTyping(`→ ${response.descriptionMatch ? '✓ Correspond' : '✗ Différent'}\n\n`);
      
      await simulateTyping(`Catégorie:\n`);
      await simulateTyping(`- Article: ${articleData.category}\n`);
      await simulateTyping(`- ${fileType === 'image' ? 'Image' : 'PDF'}: ${response.extractedData?.category || 'Non trouvé'}\n`);
      await simulateTyping(`→ ${response.categoryMatch ? '✓ Correspond' : '✗ Différent'}\n\n`);
      
      await simulateTyping(`Sous-catégorie:\n`);
      await simulateTyping(`- Article: ${articleData.subCategory}\n`);
      await simulateTyping(`- ${fileType === 'image' ? 'Image' : 'PDF'}: ${response.extractedData?.subCategory || 'Non trouvé'}\n`);
      await simulateTyping(`→ ${response.subCategoryMatch ? '✓ Correspond' : '✗ Différent'}\n\n`);
      
      await simulateTyping(`Prix d'achat:\n`);
      await simulateTyping(`- Article: ${articleData.purchasePrice}\n`);
      await simulateTyping(`- ${fileType === 'image' ? 'Image' : 'PDF'}: ${response.extractedData?.purchasePrice || 'Non trouvé'}\n`);
      await simulateTyping(`→ ${response.purchasePriceMatch ? '✓ Correspond' : '✗ Différent'}\n\n`);
      
      await simulateTyping(`Prix de vente:\n`);
      await simulateTyping(`- Article: ${articleData.salePrice}\n`);
      await simulateTyping(`- ${fileType === 'image' ? 'Image' : 'PDF'}: ${response.extractedData?.salePrice || 'Non trouvé'}\n`);
      await simulateTyping(`→ ${response.salePriceMatch ? '✓ Correspond' : '✗ Différent'}\n\n`);
      
      await simulateTyping(`Quantité en stock:\n`);
      await simulateTyping(`- Article: ${articleData.quantityInStock}\n`);
      await simulateTyping(`- ${fileType === 'image' ? 'Image' : 'PDF'}: ${response.extractedData?.quantityInStock || 'Non trouvé'}\n`);
      await simulateTyping(`→ ${response.quantityInStockMatch ? '✓ Correspond' : '✗ Différent'}\n\n`);
      
      if (response.differences && response.differences.length > 0) {
        await simulateTyping(`Détails des différences :\n`);
        for (const diff of response.differences) {
          await simulateTyping(`- ${diff.field}:\n`);
          await simulateTyping(`  Article: ${diff.expected}\n`);
          await simulateTyping(`  ${fileType === 'image' ? 'Image' : 'PDF'}: ${diff.actual}\n\n`);
        }
      }
      
      await simulateTyping(`Comparaison terminée.\n`);
      
    } catch (error) {
      console.error('Erreur de comparaison:', error);
      setFileContent('Erreur lors de la comparaison');
      toast.error('Erreur lors de la comparaison');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()} className="max-w-6xl">
      <DialogContent className="max-w-[90vw] h-[80vh] flex p-0">
        <div className="flex-1 flex flex-col p-6 border-r">
          <DialogHeader className="mb-4">
            <DialogTitle>
              {fileType === 'image' ? 'Aperçu de l\'image' : 'Aperçu du PDF'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
            {filePreview ? (
              fileType === 'image' ? (
                <img 
                  src={filePreview} 
                  alt="Fichier uploadé" 
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
              onClick={compareData} 
              disabled={isProcessing}
              className="min-w-32"
            >
              {isProcessing ? (
                <>
                  <Spinner size="small" show={true} className="mr-2" />
                  Traitement...
                </>
              ) : (
                'Comparer'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Annuler
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col p-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Résultats de la comparaison</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-y-auto whitespace-pre-wrap font-mono">
            {fileContent || (
              <div className="text-gray-400 italic">
                {isProcessing ? 'Comparaison en cours...' : 'Aucune donnée à afficher'}
              </div>
            )}
            <div ref={contentEndRef} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ArticleDetails: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [articleDetails, setArticleDetails] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<UpdateArticleDto>({
    title: '',
    description: '',
    category: '',
    subCategory: '',
    purchasePrice: 0,
    salePrice: 0,
    quantityInStock: 0,
    status: 'active',
  });
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareFile, setCompareFile] = useState<File | null>(null);
  const [compareFileType, setCompareFileType] = useState<'image' | 'pdf'>('image');

  useEffect(() => {
    if (!id) return;

    const fetchArticleDetails = async () => {
      try {
        const response = await article.findOne(Number(id));
        setArticleDetails(response);
        setFormData({
          title: response.title,
          description: response.description,
          category: response.category,
          subCategory: response.subCategory,
          purchasePrice: response.purchasePrice,
          salePrice: response.salePrice,
          quantityInStock: response.quantityInStock,
          status: response.status,
        });
      } catch (error) {
        setError('Impossible de récupérer les détails de l\'article.');
        toast.error('Erreur lors de la récupération des détails de l\'article.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticleDetails();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === 'purchasePrice' || name === 'salePrice' || name === 'quantityInStock'
        ? Number(value)
        : value,
    }));
  };

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
    if (isEditing) {
      setFormData({
        title: articleDetails?.title || '',
        description: articleDetails?.description || '',
        category: articleDetails?.category || '',
        subCategory: articleDetails?.subCategory || '',
        purchasePrice: articleDetails?.purchasePrice || 0,
        salePrice: articleDetails?.salePrice || 0,
        quantityInStock: articleDetails?.quantityInStock || 0,
        status: articleDetails?.status || 'active',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        salePrice: Number(formData.salePrice),
        quantityInStock: Number(formData.quantityInStock),
      };

      const updatedArticle = await api.article.update(Number(id), payload);
      setArticleDetails(updatedArticle);
      setFormData({
        title: updatedArticle.title,
        description: updatedArticle.description,
        category: updatedArticle.category,
        subCategory: updatedArticle.subCategory,
        purchasePrice: updatedArticle.purchasePrice,
        salePrice: updatedArticle.salePrice,
        quantityInStock: updatedArticle.quantityInStock,
        status: updatedArticle.status,
      });
      setIsEditing(false);
      toast.success('Article mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article:', error);
      toast.error('Erreur lors de la mise à jour de l\'article.');
    }
  };

  const handleCompareWithImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setCompareFile(file);
        setCompareFileType('image');
        setCompareModalOpen(true);
      }
    };
    input.click();
  };

  const handleCompareWithPdf = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setCompareFile(file);
        setCompareFileType('pdf');
        setCompareModalOpen(true);
      }
    };
    input.click();
  };

  if (loading) return <Spinner size="medium" show={loading} />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!articleDetails) return <p>Aucun article trouvé.</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      {compareModalOpen && compareFile && articleDetails && (
        <CompareModal
          file={compareFile}
          fileType={compareFileType}
          articleData={articleDetails}
          onClose={() => {
            setCompareModalOpen(false);
            setCompareFile(null);
          }}
          open={compareModalOpen}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Détails de l'article</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleCompareWithPdf}
          >
            <FileText className="h-4 w-4" />
            Comparer avec PDF
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleCompareWithImage}
          >
            <Image className="h-4 w-4" />
            Comparer avec Image
          </Button>

          <Button
            variant={isEditing ? 'secondary' : 'default'}
            onClick={toggleEditMode}
            className="flex items-center gap-2"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4" />
                Annuler
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                Modifier
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={!isEditing ? 'bg-gray-100' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={!isEditing ? 'bg-gray-100' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={!isEditing ? 'bg-gray-100' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="subCategory">Sous-catégorie</Label>
                  <Input
                    id="subCategory"
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={!isEditing ? 'bg-gray-100' : ''}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="purchasePrice">Prix d'achat</Label>
                  <Input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={!isEditing ? 'bg-gray-100' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="salePrice">Prix de vente</Label>
                  <Input
                    id="salePrice"
                    name="salePrice"
                    type="number"
                    value={formData.salePrice}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={!isEditing ? 'bg-gray-100' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="quantityInStock">Quantité en stock</Label>
                  <Input
                    id="quantityInStock"
                    name="quantityInStock"
                    type="number"
                    value={formData.quantityInStock}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={!isEditing ? 'bg-gray-100' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Input
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={!isEditing ? 'bg-gray-100' : ''}
                  />
                </div>
              </div>
            </div>
            {isEditing && (
              <div className="flex justify-end">
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Valider
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleDetails;