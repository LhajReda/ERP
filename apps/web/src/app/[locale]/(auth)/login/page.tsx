'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sprout,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Leaf,
  Sun,
  Droplets,
  BarChart3,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { locale } = useParams();
  const [identifier, setIdentifier] = useState('');
  const [tenantHint, setTenantHint] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTenantHint = localStorage.getItem('fla7a_tenant_hint');
    if (savedTenantHint) {
      setTenantHint(savedTenantHint);
    }
  }, []);

  const useDemoEnterpriseAccess = () => {
    setIdentifier('+212699999991');
    setPassword('Fla7a@2025');
    setTenantHint('e2e-auth');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cleanIdentifier = identifier.trim();
      const cleanTenantHint = tenantHint.trim();
      const res = await api.post(
        '/auth/login',
        { phone: cleanIdentifier, password },
        cleanTenantHint
          ? { headers: { 'x-tenant-id': cleanTenantHint } }
          : undefined,
      );
      const payload = res.data?.data ?? res.data;
      if (cleanTenantHint) {
        localStorage.setItem('fla7a_tenant_hint', cleanTenantHint);
      }
      if (payload?.user?.tenantId) {
        localStorage.setItem('fla7a_tenant', payload.user.tenantId);
      }
      if (payload?.user) {
        localStorage.setItem('fla7a_user', JSON.stringify(payload.user));
      }
      router.push(`/${locale}/dashboard`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erreur de connexion'));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Leaf, title: 'Gestion des cultures', desc: 'Cycles culturaux, parcelles, recoltes' },
    { icon: BarChart3, title: 'Analyse financiere', desc: 'TVA, CNSS, paie marocaine' },
    { icon: Droplets, title: 'Irrigation intelligente', desc: 'Meteo et conseils IA en temps reel' },
    { icon: Sun, title: 'Agents IA specialises', desc: '8 agents pour votre exploitation' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-primary">
        {/* Mesh overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-32 right-16 h-48 w-48 rounded-full bg-harvest-500/20 blur-3xl animate-float" />
          <div className="absolute top-1/2 left-1/3 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sprout className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">FLA7A</h1>
              <p className="text-sm text-white/70">ERP Agricole Marocain</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold leading-tight">
                Gerez votre exploitation<br />
                <span className="text-harvest-300">comme un pro.</span>
              </h2>
              <p className="text-white/70 mt-3 max-w-md">
                La plateforme ERP la plus avancee pour l&apos;agriculture marocaine.
                Intelligence artificielle, conformite ONSSA, et gestion complete.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                  <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-xs text-white/60">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="flex items-center gap-8 text-sm">
            <div>
              <p className="text-2xl font-bold">3000+</p>
              <p className="text-white/60">Hectares geres</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-2xl font-bold">500+</p>
              <p className="text-white/60">Agriculteurs</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-white/60">Regions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">FLA7A</span>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-foreground">{t('login')}</h2>
            <p className="text-muted-foreground">Entrez vos identifiants pour acceder a votre espace</p>
          </div>

          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Acces demo enterprise</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Utilise un compte de test preconfigure pour verifier rapidement les modules.
                </p>
              </div>
              <BadgePill />
            </div>
            <button
              type="button"
              onClick={useDemoEnterpriseAccess}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-card px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Remplir avec le compte demo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm font-medium animate-in">
                {error}
              </div>
            )}

            <Input
              label="Tenant (optionnel)"
              type="text"
              value={tenantHint}
              onChange={(e) => setTenantHint(e.target.value)}
              placeholder="ex: e2e-auth ou id tenant"
              helperText="Utile si votre organisation utilise un tenant dedie."
              leftIcon={<Building2 className="h-4 w-4" />}
            />

            <Input
              label={t('phone')}
              type="tel"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="+212661000001"
              leftIcon={<Phone className="h-4 w-4" />}
              required
            />

            <Input
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                <span className="text-muted-foreground">Se souvenir de moi</span>
              </label>
              <button type="button" className="text-sm text-primary hover:underline font-medium">
                Mot de passe oublie?
              </button>
            </div>

            <Button
              type="submit"
              variant="success"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? 'Connexion...' : t('login')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            {t('noAccount')}{' '}
            <Link href={`/${locale}/register`} className="text-primary font-semibold hover:underline">
              {t('register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function BadgePill() {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
      <Sparkles className="h-3 w-3" />
      Demo
    </div>
  );
}
