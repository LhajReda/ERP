'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function SettingsPage() {
  const t = useTranslations();
  const [language, setLanguage] = useState('fr');
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
