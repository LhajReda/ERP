'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAuditLogs } from '@/hooks/use-api';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/error-message';

type AuditLogRow = {
  id: string;
  createdAt: string;
  action?: string;
  entity?: string;
  entityId?: string;
  ipAddress?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    role?: string;
  };
};

type AuditPayload = {
  data?: AuditLogRow[];
  totalPages?: number;
};

export default function SettingsPage() {
  const t = useTranslations();
  const [language, setLanguage] = useState('fr');
  const [auditPage, setAuditPage] = useState(1);
  const [auditFilters, setAuditFilters] = useState({
    action: '',
    entity: '',
    search: '',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  const languages = [
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
    { code: 'dar', label: 'الدارجة' },
  ];

  const {
    data: auditPayload,
    isLoading: isAuditLoading,
    isError: isAuditError,
    error: auditError,
    refetch: refetchAuditLogs,
  } = useAuditLogs({
    page: auditPage,
    limit: 12,
    action: auditFilters.action || undefined,
    entity: auditFilters.entity || undefined,
    search: auditFilters.search || undefined,
  });

  useEffect(() => {
    setAuditPage(1);
  }, [auditFilters.action, auditFilters.entity, auditFilters.search]);

  const typedAuditPayload = (auditPayload || null) as AuditPayload | null;
  const auditRows = Array.isArray(typedAuditPayload?.data) ? typedAuditPayload.data : [];
  const auditTotalPages = typedAuditPayload?.totalPages || 1;

  const actionBadgeVariant = (action?: string) => {
    if (action === 'CREATE') return 'success' as const;
    if (action === 'UPDATE') return 'warning' as const;
    if (action === 'DELETE') return 'danger' as const;
    return 'secondary' as const;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {t('nav.settings')}
      </h1>

      {/* Language */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Langue
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                language === lang.code
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Notifications
        </h2>
        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-700 capitalize">{key}</span>
              <button
                onClick={() =>
                  setNotifications((prev) => ({ ...prev, [key]: !value }))
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  value ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    value ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sécurité
        </h2>
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <div className="font-medium text-gray-900">Changer le mot de passe</div>
            <div className="text-sm text-gray-500">Dernière modification il y a 30 jours</div>
          </button>
          <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <div className="font-medium text-gray-900">Authentification à deux facteurs</div>
            <div className="text-sm text-gray-500">Non activée</div>
          </button>
          <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <div className="font-medium text-gray-900">Sessions actives</div>
            <div className="text-sm text-gray-500">1 session active</div>
          </button>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Traçabilité & Audit
            </h2>
            <p className="text-sm text-gray-500">
              Journal immuable des opérations critiques du tenant.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetchAuditLogs()}>
            Rafraichir
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Select
            label="Action"
            value={auditFilters.action}
            onChange={(e) =>
              setAuditFilters((prev) => ({ ...prev, action: e.target.value }))
            }
          >
            <option value="">Toutes</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </Select>
          <Input
            label="Entite"
            placeholder="Invoice, Transaction..."
            value={auditFilters.entity}
            onChange={(e) =>
              setAuditFilters((prev) => ({ ...prev, entity: e.target.value }))
            }
          />
          <Input
            label="Recherche"
            placeholder="entityId, utilisateur..."
            value={auditFilters.search}
            onChange={(e) =>
              setAuditFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
        </div>

        {isAuditLoading ? (
          <Skeleton className="h-56" />
        ) : isAuditError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            {getErrorMessage(
              auditError,
              'Acces audit non autorise ou indisponible.',
            )}
          </div>
        ) : auditRows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
            Aucune trace d audit pour les filtres selectionnes.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Action</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Entite</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Utilisateur</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {auditRows.map((log: AuditLogRow) => (
                    <tr key={log.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={actionBadgeVariant(log.action)}>{log.action}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800">{log.entity}</div>
                        <div className="text-xs text-gray-500">{log.entityId || '-'}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800">
                          {log.user?.firstName} {log.user?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{log.user?.role}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{log.ipAddress || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Page {auditPage} / {auditTotalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  disabled={auditPage <= 1}
                >
                  Precedent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuditPage((p) => p + 1)}
                  disabled={auditPage >= auditTotalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Data & Plan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Données & Plan
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Stockage utilisé</span>
            <span className="font-medium">2.4 GB / 10 GB</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '24%' }} />
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-700">Plan actuel</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Professionnel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
