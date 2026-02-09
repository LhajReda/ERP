import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/stores/auth.store';
import { stockAPI } from '../../src/services/api';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme/colors';

const CATEGORY_EMOJIS: Record<string, string> = {
  SEMENCES: '🌰',
  ENGRAIS: '🧪',
  PHYTOSANITAIRE: '💊',
  MATERIEL: '🔧',
  CARBURANT: '⛽',
  PIECE_RECHANGE: '⚙️',
  EMBALLAGE: '📦',
  AUTRE: '📋',
};

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  unitPrice: number;
  sku?: string;
}

export default function StockScreen() {
  const { t } = useTranslation();
  const { currentFarmId } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products', currentFarmId],
    queryFn: () => stockAPI.listProducts({ farmId: currentFarmId }),
    enabled: !!currentFarmId,
    select: (res) => res.data.data?.data || res.data.data || [],
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const isLowStock = (product: Product) => product.currentStock <= product.minStock;

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity style={[styles.card, isLowStock(item) && styles.cardAlert]}>
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{CATEGORY_EMOJIS[item.category] || '📋'}</Text>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.category}>{item.category.replace(/_/g, ' ')}</Text>
        </View>
        {isLowStock(item) && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertText}>{t('stock.lowStock')}</Text>
          </View>
        )}
      </View>

      <View style={styles.stockRow}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockLabel}>{t('stock.quantity')}</Text>
          <Text style={[styles.stockValue, isLowStock(item) && { color: colors.danger }]}>
            {item.currentStock} {item.unit}
          </Text>
        </View>
        <View style={styles.stockInfo}>
          <Text style={styles.stockLabel}>{t('stock.minStock')}</Text>
          <Text style={styles.stockValue}>{item.minStock} {item.unit}</Text>
        </View>
        <View style={styles.stockInfo}>
          <Text style={styles.stockLabel}>Prix unit.</Text>
          <Text style={styles.stockValue}>{item.unitPrice} MAD</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!currentFarmId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>📦</Text>
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
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📦</Text>
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
  cardAlert: { borderColor: colors.danger, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 32 },
  productName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[800] },
  category: { fontSize: fontSize.sm, color: colors.gray[500] },
  alertBadge: { backgroundColor: colors.danger, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  alertText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '600' },
  stockRow: { flexDirection: 'row', marginTop: spacing.md, justifyContent: 'space-between' },
  stockInfo: { alignItems: 'center' },
  stockLabel: { fontSize: fontSize.xs, color: colors.gray[400] },
  stockValue: { fontSize: fontSize.md, fontWeight: '700', color: colors.gray[700] },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: fontSize.lg, color: colors.gray[400] },
});
