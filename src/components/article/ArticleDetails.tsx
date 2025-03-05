import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router'; // Utilisez useRouter de Next.js
import { article } from '@/api';
import { Article } from '@/types';

const ArticleDetails: React.FC = () => {
  const router = useRouter();
  const { id } = router.query; // Récupérer l'ID de l'article depuis l'URL
  const [articleDetails, setArticleDetails] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false); // État pour le bouton de défilement

  // Récupérer les détails de l'article
  useEffect(() => {
    if (!id) return; // Attendre que l'ID soit disponible

    const fetchArticleDetails = async () => {
      try {
        const response = await article.findOne(Number(id)); // Utilisez l'ID pour récupérer l'article
        setArticleDetails(response);
      } catch (error) {
        setError('Impossible de récupérer les détails de l\'article.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticleDetails();
  }, [id]);

  // Gérer l'affichage du bouton "Retour en haut"
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fonction pour remonter en haut de la page
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!articleDetails) return <p>Aucun article trouvé.</p>;

  return (
    <div className="p-3 bg-white shadow-md rounded-lg overflow-y-auto h-screen">
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Détails de l'article</h1>
      <form className="space-y-4">
        {/* Champ Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Titre</label>
          <input
            type="text"
            value={articleDetails.title}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Champ Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={articleDetails.description}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Champ SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700">SKU</label>
          <input
            type="text"
            value={articleDetails.sku}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Champ Catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Catégorie</label>
          <input
            type="text"
            value={articleDetails.category}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Champ Sous-catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Sous-catégorie</label>
          <input
            type="text"
            value={articleDetails.subCategory}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Champ Prix d'achat */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Prix d'achat</label>
          <input
            type="number"
            value={articleDetails.purchasePrice}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Champ Prix de vente */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Prix de vente</label>
          <input
            type="number"
            value={articleDetails.salePrice}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Champ Quantité en stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantité en stock</label>
          <input
            type="number"
            value={articleDetails.quantityInStock}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Champ Code-barres (lecture seule) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Code-barres</label>
          <input
            type="text"
            value={articleDetails.barcode}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
          />
        </div>

        {/* Champ QR Code (lecture seule) */}
        {articleDetails.qrCode && (
          <div>
            <label className="block text-sm font-medium text-gray-700">QR Code</label>
            <img src={articleDetails.qrCode} alt="QR Code" className="mt-1 w-32 h-32" />
          </div>
        )}
      </form>

      {/* Bouton "Retour en haut" */}
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default ArticleDetails;