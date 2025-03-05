import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { article } from '@/api';
import { CreateArticleDto } from '@/types';

const CreateArticle: React.FC = () => {
  const [formData, setFormData] = useState<CreateArticleDto>({
    title: '',
    description: '',
    sku: '',
    category: '',
    subCategory: '',
    purchasePrice: 0,
    salePrice: 0,
    quantityInStock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null); // Pour stocker le code QR généré
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: Number(value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Générer le code QR avant de créer l'article
      const qrCodeData = JSON.stringify({
        sku: formData.sku,
        title: formData.title,
        price: formData.salePrice,
      });
      const generatedQrCode = await article.generateQrCode(qrCodeData);
      setQrCode(generatedQrCode);

      // Ajouter le code QR à l'article
      const articleWithQrCode = { ...formData, qrCode: generatedQrCode };

      // Vérifier si un article avec le même titre existe déjà
      const response = await article.createWithFilterTitle(articleWithQrCode);

      if (response === null) {
        setError('Un article avec ce titre existe déjà.');
      } else {
        router.push('/article/article-Lists');
      }
    } catch (error) {
      setError("Échec de la création de l'article. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Créer un nouvel article</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                required
              />
            </div>
          </div>

          {/* SKU et Catégorie */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                required
              />
            </div>
          </div>

          {/* Sous-catégorie et Prix d'achat */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sous-catégorie</label>
              <input
                type="text"
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix d'achat</label>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleNumberChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                required
              />
            </div>
          </div>

          {/* Prix de vente et Quantité en stock */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix de vente</label>
              <input
                type="number"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleNumberChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantité en stock</label>
              <input
                type="number"
                name="quantityInStock"
                value={formData.quantityInStock}
                onChange={handleNumberChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                required
              />
            </div>
          </div>

          {/* Code QR généré */}
          {qrCode && (
            <div className="flex justify-center mt-6">
              <img src={qrCode} alt="Code QR" className="w-48 h-48" />
            </div>
          )}

          {/* Bouton de soumission */}
          <div className="mt-6">
            <button
              type="submit"
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
              disabled={loading}
            >
              {loading ? 'Ajout en cours...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateArticle;