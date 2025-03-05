import React, { useEffect, useState, useRef } from 'react';
import { Article } from '@/types';
import { article } from '@/api';
import Quagga from 'quagga';
import { useRouter } from 'next/router';
import { Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ArticleList: React.FC = () => {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scannedArticle, setScannedArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [sortKey, setSortKey] = useState<string>('title');
  const [scanMode, setScanMode] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Récupérer la liste des articles avec pagination et tri
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await article.findPaginated(page, pageSize, sortOrder, sortKey, searchTerm);
        setArticles(response.data);
      } catch (error) {
        setError('Impossible de récupérer les articles. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [page, pageSize, sortOrder, sortKey, searchTerm]);

  // Supprimer un article
  const handleDeleteArticle = async (id: number) => {
    try {
      await article.remove(id);
      toast.success('Article supprimé avec succès.');
      setArticles((prevArticles) => prevArticles.filter((article) => article.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'article:', error);
      toast.error('Erreur lors de la suppression de l\'article.');
    }
  };

  // Rediriger vers les détails de l'article
  const handleArticleClick = (id: number) => {
    router.push(`/article/article-details/${id}`); // Redirige vers la page de détails de l'article
  };

  // Initialiser le scanner de code-barres pour la caméra
  useEffect(() => {
    if (scanMode && videoRef.current) {
      const video = videoRef.current;

      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          console.log('Caméra accessible');
          video.srcObject = stream;
          video.play();
          requestAnimationFrame(scanBarcode);
        })
        .catch((err) => {
          console.error('Erreur d\'accès à la caméra:', err);
          setError('Impossible d\'accéder à la caméra.');
        });
    }
  }, [scanMode]);

  // Fonction pour scanner le code-barres
  const scanBarcode = () => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanBarcode);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    Quagga.decodeSingle(
      {
        src: canvas.toDataURL(),
        numOfWorkers: 0,
        inputStream: {
          size: canvas.width,
        },
        decoder: {
          readers: ['code_128_reader', 'ean_reader', 'upc_reader'],
        },
      },
      (result) => {
        if (result?.codeResult) {
          const code = result.codeResult.code;
          const digits = code.replace(/\D/g, '');
          setScannedData(digits);
          setSearchTerm(digits);
          setScanMode(false);
        } else {
          requestAnimationFrame(scanBarcode);
        }
      }
    );
  };

  // Gérer le tri
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortKey(key);
      setSortOrder('ASC');
    }
  };

  // Gérer la pagination
  const handleNextPage = () => {
    setPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    setPage((prev) => (prev > 1 ? prev - 1 : 1));
  };

  return (
    <div className="p-3 bg-white shadow-md rounded-lg">
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Liste des articles</h1>

      {/* Barre de recherche avec bouton de scan */}
      <div className="flex items-center border border-gray-300 rounded-lg p-2 mb-4">
        <Search className="text-gray-500 mr-2" size={20} />
        <input
          type="text"
          placeholder="Rechercher un article par code-barres..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full outline-none"
        />
        <div className="relative">
          <button
            onClick={() => setScanMode(!scanMode)}
            className="p-2 text-gray-500 hover:text-gray-700 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
              />
            </svg>
          </button>

          {/* Cadre de scan plus grand avec carré bleu */}
          {scanMode && (
            <div className="absolute top-10 right-0 w-64 h-80 bg-gray-100 border border-gray-300 rounded-lg shadow-lg z-10 overflow-hidden">
              <video ref={videoRef} className="w-full h-full rounded-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-blue-500 rounded-lg"></div>
              </div>
              <p className="absolute bottom-2 left-2 text-sm text-gray-500">Scannez un code-barres.</p>
            </div>
          )}
        </div>
      </div>

      {/* Tableau des articles */}
      <div className="overflow-hidden rounded-lg border-2 border-gray-300">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th
                className="px-3 py-2 text-gray-700 font-medium cursor-pointer"
                onClick={() => handleSort('title')}
              >
                Titre {sortKey === 'title' && (sortOrder === 'ASC' ? '▲' : '▼')}
              </th>
              <th
                className="px-3 py-2 text-gray-700 font-medium cursor-pointer"
                onClick={() => handleSort('description')}
              >
                Description {sortKey === 'description' && (sortOrder === 'ASC' ? '▲' : '▼')}
              </th>
              <th className="px-3 py-2 text-gray-700 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-2 text-gray-500 text-sm">
                  Aucun article disponible.
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr
                  key={article.id}
                  onClick={() => handleArticleClick(article.id)} // Redirige vers les détails de l'article
                  className="border-b hover:bg-gray-50 transition cursor-pointer" // Curseur pointer pour indiquer que la ligne est cliquable
                >
                  <td className="px-3 py-2 text-gray-800">{article.title}</td>
                  <td className="px-3 py-2 text-gray-600 truncate max-w-xs">{article.description}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Empêche la redirection lors du clic sur le bouton de suppression
                        handleDeleteArticle(article.id);
                      }}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handlePrevPage}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm text-gray-700">
          Page {page}
        </span>
        <button
          onClick={handleNextPage}
          disabled={articles.length < pageSize}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ArticleList;