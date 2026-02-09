'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label?: string };
  variant?: 'default' | 'green' | 'blue' | 'orange' | 'red' | 'earth';
  className?: string;
}

const variantStyles = {
  default: { bg: 'bg-primary/10', icon: 'text-primary', ring: 'ring-primary/20' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
  blue: { bg: 'bg-sky-50', icon: 'text-sky-600', ring: 'ring-sky-100' },
  orange: { bg: 'bg-harvest-50', icon: 'text-harvest-600', ring: 'ring-harvest-100' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', ring: 'ring-red-100' },
  earth: { bg: 'bg-earth-50', icon: 'text-earth-500', ring: 'ring-earth-100' },
};

function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', className }: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card p-5 shadow-xs transition-all duration-250',
        'hover:shadow-elevation hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground animate-counter">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center ring-1', styles.bg, styles.ring)}>
          <Icon className={cn('h-5 w-5', styles.icon)} />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend.value >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={cn('text-xs font-semibold', trend.value >= 0 ? 'text-emerald-600' : 'text-red-600')}>
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
          {trend.label && (
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}

export { StatCard };
