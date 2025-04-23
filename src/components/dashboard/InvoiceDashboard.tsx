import React, { useEffect, useState } from 'react';
import { expense_invoice } from '@/api/expense_invoice';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const InvoiceDashboard = ({ firmId }: { firmId: number }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date()
  });
  const [stats, setStats] = useState<{
    financial?: any;
    discountsTaxes?: any;
    articles?: any;
    misc?: any;
    summary?: any;
    status?: any;
    monthly?: any;
    interlocutors?: any;
    payments?: any;
    yearly?: any;
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Utilisez Promise.allSettled pour gérer les erreurs partielles
        const results = await Promise.allSettled([
          expense_invoice.getFinancialStats(firmId),
          expense_invoice.getDiscountsTaxesStats(firmId),
          expense_invoice.getArticlesStats(firmId),
          expense_invoice.getMiscStats(firmId),
          expense_invoice.getInvoiceSummary(firmId),
          expense_invoice.getStatusDistribution(firmId),
          expense_invoice.getMonthlyTrends(firmId),
          expense_invoice.getTopInterlocutors(firmId, 5),
          expense_invoice.getPaymentAnalysis(firmId),
          expense_invoice.getYearlySummary(firmId)
        ]);

        setStats({
          financial: results[0].status === 'fulfilled' ? results[0].value : null,
          discountsTaxes: results[1].status === 'fulfilled' ? results[1].value : null,
          articles: results[2].status === 'fulfilled' ? results[2].value : null,
          misc: results[3].status === 'fulfilled' ? results[3].value : null,
          summary: results[4].status === 'fulfilled' ? results[4].value : null,
          status: results[5].status === 'fulfilled' ? results[5].value : null,
          monthly: results[6].status === 'fulfilled' ? results[6].value : null,
          interlocutors: results[7].status === 'fulfilled' ? results[7].value : null,
          payments: results[8].status === 'fulfilled' ? results[8].value : null,
          yearly: results[9].status === 'fulfilled' ? results[9].value : null
        });

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [firmId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Préparation des données pour les graphiques
  const monthlyData = stats.monthly?.map((month: any) => ({
    name: month.month,
    amount: month.totalAmount,
    count: month.count
  }));

  const statusData = stats.status
    ? Object.entries(stats.status).map(([name, value]: [string, any]) => ({
        name,
        count: value.count,
        amount: value.totalAmount
      }))
    : [];

  const currencyData = stats.financial?.currencyDistribution
    ? Object.entries(stats.financial.currencyDistribution).map(([name, value]) => ({
        name,
        value
      }))
    : [];

  const topArticles = stats.articles?.topArticles?.slice(0, 5) || [];
  const topInterlocutors = stats.interlocutors?.slice(0, 5) || [];

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tableau de bord des factures</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="financial">Financier</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="interlocutors">Interlocuteurs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Cartes de résumé */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Total des dépenses"
              value={stats.financial?.totalExpenses}
              change={stats.yearly?.change}
              icon={<CalendarIcon className="h-4 w-4" />}
            />
            <SummaryCard
              title="Factures payées"
              value={stats.payments?.paid}
              change={stats.payments?.paidChange}
              icon={<CalendarIcon className="h-4 w-4" />}
            />
            <SummaryCard
              title="Factures impayées"
              value={stats.payments?.unpaid}
              change={stats.payments?.unpaidChange}
              icon={<CalendarIcon className="h-4 w-4" />}
            />
            <SummaryCard
              title="Moyenne par facture"
              value={stats.yearly?.average}
              change={stats.yearly?.averageChange}
              icon={<CalendarIcon className="h-4 w-4" />}
            />
          </div>

          {/* Graphiques principaux */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Tendance mensuelle</h3>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" name="Nombre" fill="#8884d8" />
                    <Line yAxisId="right" type="monotone" dataKey="amount" name="Montant" stroke="#82ca9d" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">Répartition par statut</h3>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={statusData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis />
                    <Radar
                      name="Montant"
                      dataKey="amount"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Répartition des devises</h3>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currencyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {currencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">Remises et taxes</h3>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: 'Remises',
                        value: stats.discountsTaxes?.discountStats?.totalDiscounts
                      },
                      {
                        name: 'Retenue à la source',
                        value: stats.discountsTaxes?.totalTaxWithholding
                      },
                      {
                        name: 'Timbre fiscal',
                        value: stats.discountsTaxes?.taxStampStats?.totalTaxStamp
                      }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" name="Montant" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="articles" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Top 5 articles</h3>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topArticles.map((article: any) => ({
                      name: article.articleName,
                      amount: article.totalAmount,
                      quantity: article.totalQuantity
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" name="Montant total" fill="#8884d8" />
                    <Bar dataKey="quantity" name="Quantité" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">Revenus par article</h3>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{
                      top: 20,
                      right: 20,
                      bottom: 20,
                      left: 20
                    }}
                  >
                    <CartesianGrid />
                    <XAxis
                      type="number"
                      dataKey="totalQuantity"
                      name="Quantité"
                      unit="unités"
                    />
                    <YAxis
                      type="number"
                      dataKey="totalAmount"
                      name="Montant"
                      unit="€"
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter
                      name="Articles"
                      data={stats.articles?.articlesRevenue}
                      fill="#8884d8"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interlocutors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Top 5 interlocuteurs</h3>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topInterlocutors}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="interlocutorName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalAmount" name="Montant total" fill="#8884d8" />
                    <Bar dataKey="invoiceCount" name="Nombre de factures" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">Analyse des paiements</h3>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      {
                        name: 'Payé',
                        value: stats.payments?.paid
                      },
                      {
                        name: 'Impayé',
                        value: stats.payments?.unpaid
                      },
                      {
                        name: 'En retard',
                        value: stats.payments?.overdue
                      }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  change,
  icon
}: {
  title: string;
  value: number;
  change?: number;
  icon?: React.ReactNode;
}) => {
  const formattedValue = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value || 0);

  const isPositive = change && change >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {change !== undefined && (
          <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}
            {change}% par rapport à l'année dernière
          </p>
        )}
      </CardContent>
    </Card>
  );
};