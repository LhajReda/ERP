import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/stores/auth.store';
import { dashboardAPI } from '../../src/services/api';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme/colors';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  emoji: string;
}

function KPICard({ title, value, subtitle, color, emoji }: KPICardProps) {
  return (
    <View style={[styles.kpiCard, { borderLeftColor: color }]}>
      <Text style={styles.kpiEmoji}>{emoji}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiTitle}>{title}</Text>
      {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function QuickAction({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Text style={styles.quickEmoji}>{emoji}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user, currentFarmId } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data: kpis, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-kpis', currentFarmId],
    queryFn: () => dashboardAPI.getKPIs(currentFarmId || ''),
    enabled: !!currentFarmId,
    select: (res) => res.data.data,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
    >
      {/* Welcome */}
      <View style={styles.welcomeBar}>
        <View>
          <Text style={styles.welcomeText}>{t('dashboard.welcome')}, {user?.firstName} 👋</Text>
          <Text style={styles.welcomeRole}>{user?.role}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
        <QuickAction emoji="📋" label={t('dashboard.markAttendance')} onPress={() => {}} />
        <QuickAction emoji="🌱" label={t('dashboard.addActivity')} onPress={() => router.push('/(tabs)/culture')} />
        <QuickAction emoji="📷" label={t('dashboard.scanQR')} onPress={() => {}} />
        <QuickAction emoji="📊" label={t('dashboard.viewReports')} onPress={() => {}} />
        <QuickAction emoji="🤖" label={t('chat.title')} onPress={() => router.push('/chat')} />
      </ScrollView>

      {/* KPIs */}
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary[500]} style={{ marginTop: spacing.xl }} />
      ) : !currentFarmId ? (
        <View style={styles.noFarm}>
          <Text style={styles.noFarmText}>Sélectionnez une exploitation</Text>
          <TouchableOpacity style={styles.selectFarmBtn} onPress={() => router.push('/(tabs)/farms')}>
            <Text style={styles.selectFarmText}>{t('tabs.farms')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.kpiGrid}>
          <KPICard
            emoji="🌍"
            title={t('dashboard.totalArea')}
            value={`${kpis?.farm?.totalArea || 0} ha`}
            subtitle={`${kpis?.farm?.cultivatedArea || 0} ha ${t('dashboard.cultivatedArea').toLowerCase()}`}
            color={colors.primary[500]}
          />
          <KPICard
            emoji="🌱"
            title={t('dashboard.activeCycles')}
            value={kpis?.cultures?.activeCycles || 0}
            color={colors.success}
          />
          <KPICard
            emoji="📦"
            title={t('dashboard.stockAlerts')}
            value={kpis?.stock?.alertsCount || 0}
            subtitle={`${kpis?.stock?.totalProducts || 0} produits`}
            color={kpis?.stock?.alertsCount > 0 ? colors.danger : colors.info}
          />
          <KPICard
            emoji="💰"
            title={t('dashboard.monthlyRevenue')}
            value={`${((kpis?.finance?.monthlyRevenue || 0) / 1000).toFixed(0)}K`}
            subtitle="MAD"
            color={colors.success}
          />
          <KPICard
            emoji="📉"
            title={t('dashboard.monthlyExpenses')}
            value={`${((kpis?.finance?.monthlyExpenses || 0) / 1000).toFixed(0)}K`}
            subtitle="MAD"
            color={colors.danger}
          />
          <KPICard
            emoji="👷"
            title={t('dashboard.employees')}
            value={kpis?.hr?.totalEmployees || 0}
            subtitle={`${kpis?.hr?.presentToday || 0} ${t('dashboard.presentToday').toLowerCase()}`}
            color={colors.sky[500]}
          />
          <KPICard
            emoji="📜"
            title={t('dashboard.certifications')}
            value={kpis?.compliance?.activeCertifications || 0}
            subtitle={kpis?.compliance?.expiringCount > 0 ? `${kpis.compliance.expiringCount} expirent bientot` : undefined}
            color={kpis?.compliance?.expiringCount > 0 ? colors.warning : colors.primary[500]}
          />
        </View>
      )}

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  welcomeBar: {
    backgroundColor: colors.primary[500], padding: spacing.lg,
    paddingTop: spacing.xl, paddingBottom: spacing.xl,
  },
  welcomeText: { color: colors.white, fontSize: fontSize.xl, fontWeight: '700' },
  welcomeRole: { color: colors.primary[200], fontSize: fontSize.sm, marginTop: 2 },
  sectionTitle: {
    fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[800],
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  quickRow: { paddingHorizontal: spacing.md },
  quickAction: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl,
    padding: spacing.md, marginHorizontal: spacing.xs,
    alignItems: 'center', width: 90,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  quickEmoji: { fontSize: 28, marginBottom: spacing.xs },
  quickLabel: { fontSize: fontSize.xs, color: colors.gray[600], textAlign: 'center', fontWeight: '500' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing.sm },
  kpiCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.md, width: '47%', borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  kpiEmoji: { fontSize: 24, marginBottom: spacing.xs },
  kpiValue: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.gray[800] },
  kpiTitle: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2 },
  kpiSubtitle: { fontSize: fontSize.xs, color: colors.gray[400], marginTop: 2 },
  noFarm: { alignItems: 'center', paddingVertical: spacing.xxl },
  noFarmText: { fontSize: fontSize.lg, color: colors.gray[500], marginBottom: spacing.md },
  selectFarmBtn: {
    backgroundColor: colors.primary[500], paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  selectFarmText: { color: colors.white, fontWeight: '700' },
});
