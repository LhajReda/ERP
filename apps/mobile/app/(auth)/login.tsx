import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/auth.store';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme/colors';

export default function LoginScreen() {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await login(phone.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>F</Text>
          </View>
          <Text style={styles.appName}>FLA7A</Text>
          <Text style={styles.subtitle}>ERP Agricole Marocain</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>{t('auth.phone')}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('auth.phonePlaceholder')}
            keyboardType="phone-pad"
            autoCapitalize="none"
            placeholderTextColor={colors.gray[400]}
          />

          <Text style={styles.label}>{t('auth.password')}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            placeholderTextColor={colors.gray[400]}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>{t('auth.loginButton')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotLink}>
            <Text style={styles.linkText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>{t('auth.noAccount')} </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>{t('auth.registerButton')}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logoContainer: { alignItems: 'center', marginBottom: spacing.xxl },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary[500], justifyContent: 'center', alignItems: 'center',
  },
  logoText: { fontSize: 36, fontWeight: '800', color: colors.white },
  appName: { fontSize: fontSize.xxxl, fontWeight: '800', color: colors.primary[500], marginTop: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.gray[500], marginTop: spacing.xs },
  form: { gap: spacing.sm },
  label: { fontSize: fontSize.md, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.gray[300], borderRadius: borderRadius.lg,
    padding: spacing.md, fontSize: fontSize.lg, color: colors.gray[800],
    backgroundColor: colors.gray[50], marginBottom: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary[500], padding: spacing.md,
    borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.md,
  },
  buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700' },
  forgotLink: { alignItems: 'center', marginTop: spacing.md },
  linkText: { color: colors.primary[500], fontSize: fontSize.md },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  registerText: { color: colors.gray[500], fontSize: fontSize.md },
  registerLink: { color: colors.primary[500], fontSize: fontSize.md, fontWeight: '600' },
});
