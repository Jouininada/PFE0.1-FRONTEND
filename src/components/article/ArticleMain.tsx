import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { DataTable } from './data-table/data-table';
import { getArticleColumns } from './data-table/columns';
import { ArticleDeleteDialog } from './dialogs/ArticleDeleteDialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ArticleActionsContext } from './data-table/ActionsContext';
import { ArticleDuplicateDialog } from './dialogs/ExpenseInvoiceDuplicateDialog';

const ArticleList: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation('article');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [sortDetails, setSortDetails] = useState({ order: true, sortKey: 'title' });
  const [searchTerm, setSearchTerm] = useState('');

  const { value: debouncedPage } = useDebounce<number>(page, 500);
  const { value: debouncedSize } = useDebounce<number>(size, 500);
  const { value: debouncedSortDetails } = useDebounce<typeof sortDetails>(sortDetails, 500);
  const { value: debouncedSearchTerm } = useDebounce<string>(searchTerm, 500);

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);

  const {
    isPending: isFetchPending,
    error,
    data: articlesResp,
    refetch: refetchArticles,
  } = useQuery({
    queryKey: [
      'articles',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm,
    ],
    queryFn: () =>
      api.article.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm
      ),
  });

  const { mutate: removeArticle, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.article.remove(id),
    onSuccess: () => {
      toast.success(t('article.action_remove_success'));
      refetchArticles();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(t('article.action_remove_failure'));
    },
  });

  

  const { mutate: duplicateArticle, isPending: isDuplicationPending } = useMutation({
    mutationFn: ({ id, includeFiles }: { id: number; includeFiles: boolean }) => {
      return api.article.duplicate(id, includeFiles);
    },
    onSuccess: async (data) => {
      toast.success(t('article.action_duplicate_success'));
      await router.push(`/inventory/article/${data.id}`);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(t('article.action_duplicate_failure'));
    },
  });

  const openDeleteDialog = (id: number) => {
    setSelectedArticle(id);
    setDeleteDialog(true);
  };

  const openDuplicateDialog = (id: number) => {
    setSelectedArticle(id);
    setDuplicateDialog(true);
  };

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const goToNextPage = () => {
    if (articlesResp?.meta?.pageCount && page < articlesResp.meta.pageCount) {
      setPage(page + 1);
    }
  };

  if (error) {
    return <div>An error has occurred: {error.message}</div>;
  }

  return (
    <ArticleActionsContext.Provider
      value={{
        openDeleteDialog,
        openDuplicateDialog,
      }}
    >
      <div className="p-6 bg-white rounded-lg shadow-sm">
        {/* En-tête de la section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">{t('Liste des articles')}</h1>
          <Button className="flex items-center gap-2" onClick={() => router.push('/article/create-article')}>
            <Plus className="h-4 w-4" />
            {t('Ajouter un article')}
          </Button>
        </div>

        {/* Barre de filtres */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Input
              placeholder={t('Rechercher un article..')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">{t('Rechercher')}</Button>
        </div>

        {/* Tableau des articles */}
        <DataTable
          data={articlesResp?.data || []}
          columns={getArticleColumns(t, router)}
          isPending={isFetchPending || isDeletePending || isDuplicationPending}
        />

        {/* Pagination avec flèches, numérotation et sélecteur de lignes par page */}
        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('Lignes par page')}</span>
            <Select
              value={size.toString()}
              onValueChange={(value) => setSize(Number(value))}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder={size.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm text-muted-foreground">
              {t('Page')} {page} {t('sur')} {articlesResp?.meta?.pageCount || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={!articlesResp?.meta?.pageCount || page >= articlesResp.meta.pageCount}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Boîtes de dialogue pour la suppression et la duplication */}
        <ArticleDeleteDialog
          id={selectedArticle}
          open={deleteDialog}
          deleteArticle={() => selectedArticle && removeArticle(selectedArticle)}
          onClose={() => setDeleteDialog(false)}
        />

        <ArticleDuplicateDialog
          id={selectedArticle || 0}
          open={duplicateDialog}
          duplicateArticle={(includeFiles: boolean) => {
            selectedArticle && duplicateArticle({ id: selectedArticle, includeFiles });
          }}
          onClose={() => setDuplicateDialog(false)}
        />
      </div>
    </ArticleActionsContext.Provider>
  );
};

export default ArticleList;