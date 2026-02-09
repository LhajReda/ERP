'use client';

import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'green' | 'blue' | 'orange' | 'red' | 'earth';
}

const colorMap = {
  green: { bg: 'bg-fla7a-50', icon: 'text-fla7a-500', border: 'border-fla7a-200' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-200' },
  orange: { bg: 'bg-orange-50', icon: 'text-harvest-500', border: 'border-orange-200' },
  red: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-200' },
  earth: { bg: 'bg-earth-50', icon: 'text-earth-500', border: 'border-earth-200' },
};

export function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'green' }: StatsCardProps) {
  const colors = colorMap[color];
  return (
    <div className={cn('bg-white rounded-xl border p-5 hover:shadow-md transition', colors.border)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs font-medium mt-2', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', colors.bg)}>
          <Icon className={cn('h-6 w-6', colors.icon)} />
        </div>
      </div>
    </div>
  );
}
