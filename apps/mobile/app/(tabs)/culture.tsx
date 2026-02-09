import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/stores/auth.store';
import { cultureAPI } from '../../src/services/api';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme/colors';

const STATUS_COLORS: Record<string, string> = {
  PLANIFIE: colors.info,
  EN_COURS: colors.primary[500],
  RECOLTE: colors.harvest[500],
  TERMINE: colors.gray[400],
  ABANDONNE: colors.danger,
};

const STATUS_LABELS: Record<string, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  RECOLTE: 'Récolte',
  TERMINE: 'Terminé',
  ABANDONNE: 'Abandonné',
};

interface Cycle {
  id: string;
  cropType: string;
  variety: string;
  status: string;
  campaignYear: string;
  estimatedYield?: number;
  actualYield?: number;
  totalCost: number;
  totalRevenue: number;
  parcel?: { name: string; area: number };
}

export default function CultureScreen() {
  const { t } = useTranslation();
  const { currentFarmId } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['culture-cycles', currentFarmId],
    queryFn: () => cultureAPI.listCycles({ farmId: currentFarmId }),
    enabled: !!currentFarmId,
    select: (res) => res.data.data?.data || res.data.data || [],
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderCycle = ({ item }: { item: Cycle }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cropType}>{item.cropType.replace(/_/g, ' ')}</Text>
          <Text style={styles.variety}>{item.variety}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || colors.gray[400] }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
        </View>
      </View>

      {item.parcel && (
        <Text style={styles.parcelInfo}>{item.parcel.name} ({item.parcel.area} ha)</Text>
      )}

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('culture.season')}</Text>
          <Text style={styles.statValue}>{item.campaignYear}</Text>
        </View>
        {item.estimatedYield && (
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{t('culture.yield')}</Text>
            <Text style={styles.statValue}>
              {item.actualYield || '?'} / {item.estimatedYield} kg
            </Text>
          </View>
        )}
      </View>

      {(item.totalRevenue > 0 || item.totalCost > 0) && (
        <View style={styles.financeRow}>
          <Text style={[styles.financeText, { color: colors.danger }]}>
            Coût: {(item.totalCost / 1000).toFixed(0)}K MAD
          </Text>
          <Text style={[styles.financeText, { color: colors.success }]}>
            Revenu: {(item.totalRevenue / 1000).toFixed(0)}K MAD
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (!currentFarmId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🌱</Text>
        <Text style={styles.emptyText}>Sélectionnez une exploitation</Text>
      </View>
    );
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary[500]} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderCycle}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyText}>{t('common.noData')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md },
  card: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.gray[200],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cropType: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[800] },
  variety: { fontSize: fontSize.md, color: colors.gray[500], marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  statusText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '600' },
  parcelInfo: { fontSize: fontSize.sm, color: colors.primary[500], marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.xl },
  stat: {},
  statLabel: { fontSize: fontSize.xs, color: colors.gray[400] },
  statValue: { fontSize: fontSize.md, fontWeight: '600', color: colors.gray[700] },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  financeText: { fontSize: fontSize.sm, fontWeight: '600' },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: fontSize.lg, color: colors.gray[400] },
});
