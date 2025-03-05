import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';

// Interface de base pour un article
export interface Article extends DatabaseEntity {
  id: number; // L'ID est obligatoire pour les articles existants
  title: string;
  description: string;
  sku: string;
  category: string;
  subCategory: string;
  purchasePrice: number;
  salePrice: number;
  quantityInStock: number;
  qrCode?: string; // Ajout du champ QR Code
}

// DTO pour la création d'un article (sans ID)
export interface CreateArticleDto extends Omit<Article, 'id'> {}

// DTO pour la réponse d'un article (avec ID et sans description optionnelle)
export interface ResponseArticleDto extends Omit<Article, 'description'> {
  id: number; // L'ID est obligatoire pour les articles dans la réponse
}

// Représentation paginée des articles
export interface PagedArticle extends PagedResponse<Article> {}

// Interface pour la recherche par QR Code
export interface QrCodeSearchResponse {
  article?: Article;
  message?: string;
}

export interface BarcodeSearchResponse {
  article?: Article;
  message?: string;
}