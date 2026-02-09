import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/stores/auth.store';
import { farmAPI } from '../../src/services/api';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme/colors';

const REGION_LABELS: Record<string, string> = {
  SOUSS_MASSA: 'Souss-Massa',
  FES_MEKNES: 'Fès-Meknès',
  RABAT_SALE_KENITRA: 'Rabat-Salé-Kénitra',
  CASABLANCA_SETTAT: 'Casablanca-Settat',
  MARRAKECH_SAFI: 'Marrakech-Safi',
  ORIENTAL: 'Oriental',
  TANGER_TETOUAN_AL_HOCEIMA: 'Tanger-Tétouan-Al Hoceïma',
  BENI_MELLAL_KHENIFRA: 'Béni Mellal-Khénifra',
  DRAA_TAFILALET: 'Drâa-Tafilalet',
  GUELMIM_OUED_NOUN: 'Guelmim-Oued Noun',
  LAAYOUNE_SAKIA_EL_HAMRA: 'Laâyoune-Sakia El Hamra',
  DAKHLA_OUED_ED_DAHAB: 'Dakhla-Oued Ed-Dahab',
};

interface Farm {
  id: string;
  name: string;
  nameAr?: string;
  region: string;
  province: string;
  totalArea: number;
  cultivatedArea?: number;
  farmType: string;
  waterSource: string;
  _count?: { parcels: number };
}

export default function FarmsScreen() {
  const { t } = useTranslation();
  const { setFarm, currentFarmId } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farmAPI.list(),
    select: (res) => res.data.data?.data || res.data.data || [],
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const selectFarm = async (farm: Farm) => {
    await setFarm(farm.id);
    router.push('/(tabs)/dashboard');
  };

  const renderFarm = ({ item }: { item: Farm }) => (
    <TouchableOpacity
      style={[styles.card, currentFarmId === item.id && styles.cardActive]}
      onPress={() => selectFarm(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.farmName}>{item.name}</Text>
        {currentFarmId === item.id && <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Active</Text></View>}
      </View>
      <Text style={styles.farmRegion}>{REGION_LABELS[item.region] || item.region}</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.totalArea}</Text>
          <Text style={styles.statLabel}>{t('common.ha')}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item._count?.parcels || 0}</Text>
          <Text style={styles.statLabel}>{t('farms.parcels')}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.farmType}</Text>
          <Text style={styles.statLabel}>{t('farms.farmType')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary[500]} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderFarm}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌾</Text>
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
  cardActive: { borderColor: colors.primary[500], borderWidth: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  farmName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.gray[800] },
  activeBadge: { backgroundColor: colors.primary[500], paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  activeBadgeText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '600' },
  farmRegion: { fontSize: fontSize.md, color: colors.gray[500], marginTop: spacing.xs },
  statsRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.lg },
  stat: { alignItems: 'center' },
  statValue: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary[500] },
  statLabel: { fontSize: fontSize.xs, color: colors.gray[400] },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: fontSize.lg, color: colors.gray[400] },
});
