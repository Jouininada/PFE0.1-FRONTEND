import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { articleHistory } from '@/api/article-history';
import { ResponseArticleHistoryDto } from '@/types/article-history';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common/Spinner';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { PageHeader } from '@/components/common/PageHeader';
import { BreadcrumbCommon } from '../common';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table/data-table';
import { api } from '@/api';

interface ArticleHistoryListProps {
  articleId: number;
}

const ArticleHistoryList: React.FC<ArticleHistoryListProps> = ({ articleId }) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tArticleHistory } = useTranslation('articleHistory');
  const router = useRouter();
  const { setRoutes } = useBreadcrumb();

  const [history, setHistory] = useState<ResponseArticleHistoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRoutes([
      { title: 'menu.inventory', href: '/inventory' },
      { title: 'submenu.articles', href: '/inventory/articles' },
    ]);
  }, [router.locale]);

  const fetchArticleHistory = async () => {
    try {
      const data = await articleHistory.getArticleHistory(articleId);
      setHistory(data);
      setError(null);
    } catch (err) {
      setError(tArticleHistory('error_fetching'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (articleId: number, version: number) => {
    try {
      await articleHistory.downloadPdf(articleId, version);
      toast.success(tArticleHistory('pdf_downloaded'));
    } catch (err) {
      console.error("Erreur lors du téléchargement du PDF:", err);
      toast.error(tArticleHistory('error_downloading_pdf'));
    }
  };

  const handleRestoreVersion = async (version: number) => {
    const confirm = window.confirm(
      tArticleHistory('confirm_restore', { version })
    );
    
    if (!confirm) return;

    try {
      await api.article.restoreVersion(articleId, version); // Utilisation modifiée
      toast.success(tArticleHistory('version_restored'));
      await fetchArticleHistory();
    } catch (err) {
      console.error("Erreur lors de la restauration:", err);
      toast.error(tArticleHistory('error_restoring'));
    }
  };

  useEffect(() => {
    fetchArticleHistory();
  }, [articleId]);

  const columns: ColumnDef<ResponseArticleHistoryDto>[] = [
    {
      accessorKey: 'version',
      header: tArticleHistory('version'),
      cell: ({ row }) => (
        <div className="text-sm font-medium">Version {row.original.version}</div>
      ),
    },
    {
      accessorKey: 'date',
      header: tArticleHistory('date'),
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {new Date(row.original.date).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'changes',
      header: tArticleHistory('changes'),
      cell: ({ row }) => (
        <ul className="space-y-1">
          {Object.entries(row.original.changes).map(([field, change]) => (
            <li key={field} className="text-sm">
              <strong className="text-gray-700">{field}:</strong>{' '}
              <span className="text-gray-600">{change.oldValue}</span>{' '}
              <span className="text-gray-400">→</span>{' '}
              <span className="text-gray-600">{change.newValue}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'actions',
      header: tCommon('actions'),
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            onClick={() => handleRestoreVersion(row.original.version)}
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {tArticleHistory('restore_version')}
          </Button>
          
          <Button
            onClick={() => handleDownloadPdf(row.original.articleId, row.original.version)}
            variant="outline"
            size="sm"
          >
            {tArticleHistory('download_pdf')}
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="text-center text-gray-600 p-4">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center text-gray-600 p-4">
        {tArticleHistory('no_history_found')}
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      <PageHeader
        title={tArticleHistory('title')}
        description={tArticleHistory('description')}
        level="h1"
        className="mb-2"
      />

      <BreadcrumbCommon className="mb-2" />

      <Card>
        <CardHeader className="p-2">
          <CardTitle className="text-lg">{tArticleHistory('title')}</CardTitle>
          <CardDescription className="text-sm">
            {tArticleHistory('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          <DataTable
            data={history}
            columns={columns}
            isPending={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleHistoryList;