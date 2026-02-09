import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '../../src/i18n';
import { useAuthStore } from '../../src/stores/auth.store';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme/colors';

interface MenuItemProps {
  emoji: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ emoji, label, subtitle, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: colors.danger }]}>{label}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userRole}>{user?.role}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
        </View>
      </View>

      {/* Modules */}
      <Text style={styles.sectionTitle}>Modules</Text>
      <View style={styles.section}>
        <MenuItem emoji="👷" label={t('hr.title')} onPress={() => {}} />
        <MenuItem emoji="💰" label={t('finance.title')} onPress={() => {}} />
        <MenuItem emoji="📜" label="Compliance" onPress={() => {}} />
        <MenuItem emoji="🤖" label={t('chat.title')} onPress={() => router.push('/chat')} />
      </View>

      {/* Language */}
      <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
      <View style={styles.langRow}>
        {[
          { code: 'fr', label: 'Français', flag: '🇫🇷' },
          { code: 'ar', label: 'العربية', flag: '🇲🇦' },
          { code: 'dar', label: 'Darija', flag: '🇲🇦' },
        ].map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.langBtn, i18n.language === lang.code && styles.langBtnActive]}
            onPress={() => changeLanguage(lang.code)}
          >
            <Text style={styles.langFlag}>{lang.flag}</Text>
            <Text style={[styles.langLabel, i18n.language === lang.code && styles.langLabelActive]}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings */}
      <Text style={styles.sectionTitle}>{t('settings.title')}</Text>
      <View style={styles.section}>
        <MenuItem emoji="🔔" label={t('settings.notifications')} onPress={() => {}} />
        <MenuItem emoji="ℹ️" label={t('settings.about')} subtitle="v1.0.0" onPress={() => {}} />
        <MenuItem emoji="🚪" label={t('auth.logout')} onPress={handleLogout} danger />
      </View>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary[500],
    padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.md,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary[500] },
  userName: { color: colors.white, fontSize: fontSize.xl, fontWeight: '700' },
  userRole: { color: colors.primary[200], fontSize: fontSize.sm },
  userPhone: { color: colors.primary[200], fontSize: fontSize.sm },
  sectionTitle: {
    fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[400],
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  section: {
    backgroundColor: colors.white, marginHorizontal: spacing.md,
    borderRadius: borderRadius.xl, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  menuEmoji: { fontSize: 24, marginRight: spacing.md },
  menuLabel: { fontSize: fontSize.lg, color: colors.gray[800] },
  menuSubtitle: { fontSize: fontSize.sm, color: colors.gray[400] },
  chevron: { fontSize: 24, color: colors.gray[300] },
  langRow: {
    flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  langBtn: {
    flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.gray[200],
  },
  langBtnActive: { borderColor: colors.primary[500], borderWidth: 2, backgroundColor: colors.primary[50] },
  langFlag: { fontSize: 24, marginBottom: spacing.xs },
  langLabel: { fontSize: fontSize.sm, color: colors.gray[600], fontWeight: '500' },
  langLabelActive: { color: colors.primary[500], fontWeight: '700' },
});
