'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sprout, User, Phone, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { locale } = useParams();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      router.push(`/${locale}/login`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-primary">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-32 right-16 h-48 w-48 rounded-full bg-harvest-500/20 blur-3xl animate-float" />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sprout className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">FLA7A</h1>
              <p className="text-sm text-white/70">ERP Agricole Marocain</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Rejoignez la revolution<br />
            <span className="text-harvest-300">agricole digitale.</span>
          </h2>
          <p className="text-white/70 max-w-md">
            Creez votre compte et commencez a gerer votre exploitation avec les outils les plus avances du marche.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">FLA7A</span>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-foreground">{t('register')}</h2>
            <p className="text-muted-foreground">Creez votre compte exploitant</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm font-medium animate-in">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input label={t('firstName')} value={form.firstName} onChange={(e) => update('firstName', e.target.value)} leftIcon={<User className="h-4 w-4" />} required />
              <Input label={t('lastName')} value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
            </div>

            <Input label={t('phone')} type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+212612345678" leftIcon={<Phone className="h-4 w-4" />} required />

            <Input label={t('email')} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="nom@exemple.ma" leftIcon={<Mail className="h-4 w-4" />} required />

            <Input
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="Min. 8 caracteres"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
            />

            <Button type="submit" variant="success" size="lg" loading={loading} className="w-full">
              {t('register')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Deja un compte?{' '}
            <Link href={`/${locale}/login`} className="text-primary font-semibold hover:underline">{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
