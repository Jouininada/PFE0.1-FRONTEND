import axios from './axios';
import { Article, BarcodeSearchResponse, CreateArticleDto, PagedArticle, QrCodeSearchResponse } from '@/types';

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string,
  search: string = '',
  relations: string[] = []
): Promise<PagedArticle> => {
  const barcodeFilter = search ? `barcode||$cont||${search}` : ''; // Filtre de recherche par code-barres
  const filters = barcodeFilter ? `filter=${barcodeFilter}` : ''; // Ajout du filtre

  try {
    const response = await axios.get<PagedArticle>(
      `/public/article/list?sort=${sortKey},${order}&${filters}&limit=${size}&page=${page}&join=${relations.join(',')}`
    );
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des articles paginés:", error);
    throw new Error("Impossible de récupérer les articles.");
  }
};

// Récupérer un article par son ID
const findOne = async (id: number): Promise<Article> => {
  const response = await axios.get<Article>(`/public/article/${id}`);
  return response.data;
};

// Créer un article
const create = async (article: CreateArticleDto): Promise<Article> => {
  const response = await axios.post<Article>('/public/article/save', article);
  return response.data;
};

// Créer un article en vérifiant si le titre existe déjà
const createWithFilterTitle = async (article: CreateArticleDto): Promise<Article | null> => {
  try {
    const response = await axios.post<Article>('/public/article/save-with-filter-title', article);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la création de l'article avec filtre de titre:", error);
    return null; // Retourne null si l'article existe déjà
  }
};

// Supprimer un article
const remove = async (id: number): Promise<Article> => {
  const response = await axios.delete<Article>(`/public/article/delete/${id}`);
  return response.data;
};

// Importer des articles depuis un fichier Excel
const importExcel = async (file: File): Promise<Article[]> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post<Article[]>('/public/article/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'importation du fichier Excel:', error);
    throw error;
  }
};

// Générer un code QR pour un article
const generateQrCode = async (data: string): Promise<string> => {
  try {
    const response = await axios.post<{ qrCode: string }>('/public/article/generate-qr', { data });
    return response.data.qrCode;
  } catch (error) {
    console.error("Erreur lors de la génération du code QR:", error);
    throw new Error("Impossible de générer le code QR.");
  }
};

// Récupérer un code QR par ID d'article
const getQrCode = async (id: number): Promise<string> => {
  try {
    const response = await axios.get<{ qrCode: string }>(`/public/article/qr/${id}`);
    return response.data.qrCode;
  } catch (error) {
    console.error("Erreur lors de la récupération du code QR:", error);
    throw new Error("Impossible de récupérer le code QR.");
  }
};



// Rechercher un article par code QR
const searchByQrCode = async (qrCode: string): Promise<QrCodeSearchResponse> => {
  try {
    const response = await axios.post<QrCodeSearchResponse>('/public/article/search-by-qr', { qrCode });
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la recherche par code QR:", error);
    throw new Error("Impossible de trouver l'article.");
  }

  
};

// Rechercher un article par code-barres
const searchByBarcode = async (barcode: string): Promise<BarcodeSearchResponse> => {
  try {
    const response = await axios.post<BarcodeSearchResponse>('/public/article/search-by-barcode', { barcode });
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la recherche par code-barres:", error);
    throw new Error("Impossible de trouver l'article.");
  }
};

const searchByScan = async (scannedData: string): Promise<BarcodeSearchResponse> => {
  try {
    const response = await axios.post<BarcodeSearchResponse>('/public/article/search-by-scan', { scannedData });
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la recherche par scan de code-barres:", error);
    throw new Error("Impossible de trouver l'article.");
  }
};

export const article = {
  findPaginated,
  findOne,
  create,
  createWithFilterTitle,
  remove,
  importExcel,
  generateQrCode,
  getQrCode,
  searchByQrCode,
  searchByBarcode,
  searchByScan, // Ajouter la nouvelle méthode
};