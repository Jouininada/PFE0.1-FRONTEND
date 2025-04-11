import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';

// Interface de base pour un article
export interface Article extends DatabaseEntity {
  id: number;
  title: string;
  description: string;
  category: string;
  subCategory: string;
  purchasePrice: number;
  salePrice: number;
  quantityInStock: number;
  status?: string;
  version?: number;
  history?: Array<{
    version: number;
    changes: Record<string, { oldValue: any; newValue: any }>;
    date: Date;
  }>;
  barcode?: string;
  qrCode?: string;
  isDeletionRestricted?: boolean;
}

// DTO pour la création d'un article
export interface CreateArticleDto extends Omit<Article, 'id' | 'history'> {}

// DTO pour la réponse d'un article
export interface ResponseArticleDto extends Omit<Article, 'description'> {
  id: number;
}

export interface UpdateArticleDto extends Partial<Article> {}

// Représentation paginée des articles
export interface PagedArticle extends PagedResponse<Article> {}

// Interfaces pour la recherche
export interface QrCodeSearchResponse {
  article?: Article;
  message?: string;
}

export interface BarcodeSearchResponse {
  article?: Article;
  message?: string;
}

// Interfaces pour l'extraction et la comparaison
export interface ArticleExtractedData {
  title: string;
  description?: string;
  category: string;
  subCategory?: string;
  purchasePrice?: number;
  salePrice?: number;
  quantityInStock?: number;
  status?: string;
  rawText?: string;
  confidenceScores?: {
    title: number;
    category: number;
    prices: number;
    [key: string]: number;
  };
}

export interface FieldComparisonResult {
  field: string;
  match: boolean;
  articleValue: any;
  extractedValue: any;
  confidence?: number;
}

export interface ArticleComparisonResult {
  article: Article;
  sourceType: 'pdf' | 'image';
  sourceName: string;
  matches: Record<string, boolean>;
  differences: Record<string, {
    articleValue: any;
    extractedValue: any;
  }>;
  similarityScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  processingTimeMs?: number;
  fieldResults: FieldComparisonResult[];
  extractedData?: ArticleExtractedData;
}

export interface ArticleCompareResponseDto {
  success: boolean;
  comparison?: ArticleComparisonResult;
  error?: string;
}

// Interfaces pour l'OCR et extraction PDF
export interface OcrProcessingResult {
  text: string;
  confidence: number;
  imageMetrics?: {
    sharpness: number;
    contrast: number;
  };
}

export interface PdfExtractionResult extends ArticleExtractedData {
  pagesProcessed: number;
  extractionMethod: string;
}

// Interface pour les suggestions de catégories
export interface CategorySuggestion {
  name: string;
  similarity: number;
  existing?: boolean;
}

export interface SubCategorySuggestion extends CategorySuggestion {}

// Validation des catégories
export interface CategoryValidationResult {
  valid: boolean;
  suggestedCategories?: CategorySuggestion[];
  exactMatch?: boolean;
}

export interface SubCategoryValidationResult extends CategoryValidationResult {}

// Historique des versions
export interface ArticleVersionInfo {
  version: number;
  date: Date;
  changesSummary: string[];
  changedBy?: string;
}

export interface ArticleVersionsResponse {
  currentVersion: number;
  availableVersions: ArticleVersionInfo[];
}