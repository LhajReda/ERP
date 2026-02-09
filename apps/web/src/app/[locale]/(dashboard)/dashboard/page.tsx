'use client';

import { useTranslations } from 'next-intl';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFarms, useDashboardKPIs } from '@/hooks/use-api';
import { useEffect, useState } from 'react';
import {
  Tractor,
  Sprout,
  Package,
  Banknote,
  Users,
  TrendingUp,
  CloudSun,
  Bot,
  ArrowRight,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 45000, expenses: 32000 },
  { month: 'Fev', revenue: 52000, expenses: 28000 },
  { month: 'Mar', revenue: 61000, expenses: 35000 },
  { month: 'Avr', revenue: 58000, expenses: 30000 },
  { month: 'Mai', revenue: 72000, expenses: 38000 },
  { month: 'Jun', revenue: 85000, expenses: 42000 },
];

const cropData = [
  { name: 'Agrumes', value: 40, color: '#FF6F00' },
  { name: 'Oliviers', value: 30, color: '#1B7340' },
  { name: 'Maraichage', value: 20, color: '#0288D1' },
  { name: 'Cereales', value: 10, color: '#6D4C41' },
];

const activities = [
  { text: 'Recolte oranges - Parcelle A1', time: 'Il y a 2h', icon: CheckCircle2, color: 'text-emerald-500' },
  { text: 'Traitement phytosanitaire - Parcelle B3', time: 'Il y a 4h', icon: Activity, color: 'text-sky-500' },
  { text: 'Irrigation programmee - Ferme Souss', time: 'Il y a 6h', icon: Clock, color: 'text-primary' },
  { text: 'Alerte stock faible - Engrais NPK', time: 'Hier', icon: AlertTriangle, color: 'text-amber-500' },
];

const agents = [
  { name: 'Agro-conseil', emoji: '🌱', desc: 'Recommandations culturales' },
  { name: 'Finance', emoji: '💰', desc: 'Analyse rentabilite' },
  { name: 'Stock', emoji: '📦', desc: 'Gestion inventaire' },
  { name: 'Meteo', emoji: '🌤️', desc: 'Previsions et alertes' },
];

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [userName, setUserName] = useState('Utilisateur');

  const { data: farms, isLoading: farmsLoading } = useFarms();
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs(activeFarmId || undefined);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const farmId = localStorage.getItem('fla7a_farm');
      setActiveFarmId(farmId);

      const userRaw = localStorage.getItem('fla7a_user');
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          setUserName(user.name || user.firstName || user.username || 'Utilisateur');
        } catch (e) {}
      }
    }
  }, []);

  const totalFarms = farms?.length || 0;
  const totalArea = farms?.reduce((sum: number, f: any) => sum + (f.area || 0), 0) || 250;
  const activeCycles = kpis?.activeCycles || 7;
  const monthlyRevenue = kpis?.monthlyRevenue || 85000;
  const employees = kpis?.employees || 10;
  const presentEmployees = kpis?.presentEmployees || 8;

  return (
    <div className="space-y-6 animate-in">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bonjour, {userName}</h1>
          <p className="text-muted-foreground mt-1">Apercu de vos exploitations</p>
        </div>
        <div className="flex items-center gap-3">
          <Card hover={false} className="flex items-center gap-3 px-4 py-2.5">
            <CloudSun className="h-8 w-8 text-harvest-500" />
            <div>
              <p className="text-lg font-bold">24°C</p>
              <p className="text-xs text-muted-foreground">Souss-Massa</p>
            </div>
          </Card>
          <Card hover={false} className="flex items-center gap-3 px-4 py-2.5">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              {farmsLoading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <>
                  <p className="text-sm font-semibold">{totalFarms} Fermes</p>
                  <p className="text-xs text-muted-foreground">{totalArea} ha total</p>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpisLoading || farmsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard title={t('totalArea')} value={`${totalArea} ha`} subtitle={`${totalFarms} fermes actives`} icon={Tractor} trend={{ value: 12, label: 'vs mois dernier' }} variant="green" />
            <StatCard title={t('activeCycles')} value={activeCycles.toString()} subtitle="4 en recolte" icon={Sprout} trend={{ value: 8 }} variant="blue" />
            <StatCard title={t('monthlyRevenue')} value={`${monthlyRevenue.toLocaleString()} MAD`} subtitle="Juin 2026" icon={Banknote} trend={{ value: 18 }} variant="orange" />
            <StatCard title={t('employees')} value={employees.toString()} subtitle={`${presentEmployees} presents`} icon={Users} variant="earth" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" hover={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenus vs Depenses</CardTitle>
              <Badge variant="success" dot>+18%</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B7340" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1B7340" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6F00" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#FF6F00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 46%)" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [`${value.toLocaleString()} MAD`]} />
                <Area type="monotone" dataKey="revenue" stroke="#1B7340" strokeWidth={2} fill="url(#gRev)" name="Revenus" />
                <Area type="monotone" dataKey="expenses" stroke="#FF6F00" strokeWidth={2} fill="url(#gExp)" name="Depenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader><CardTitle>Repartition cultures</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={cropData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {cropData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {cropData.map((crop, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: crop.color }} />
                    <span className="text-muted-foreground">{crop.name}</span>
                  </div>
                  <span className="font-semibold">{crop.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card hover={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Activite recente</CardTitle>
              <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">Voir tout <ArrowRight className="h-3 w-3" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <a.icon className={`h-4 w-4 ${a.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Agents IA</CardTitle>
              <Badge variant="default">8 agents</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {agents.map((agent, i) => (
                <button key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-secondary/50 hover:shadow-xs transition-all duration-200 text-start">
                  <span className="text-2xl">{agent.emoji}</span>
                  <div>
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-harvest-50 border border-primary/10">
              <p className="text-sm font-medium text-primary flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Conseil IA du jour</p>
              <p className="text-xs text-muted-foreground mt-1">Les conditions sont ideales pour la recolte des agrumes. Temperature: 22-26°C.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
