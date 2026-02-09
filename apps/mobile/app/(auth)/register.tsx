import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/auth.store';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme/colors';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({ phone: '', password: '', firstName: '', lastName: '', tenantName: '' });
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (!form.phone || !form.password || !form.firstName || !form.lastName) {
      Alert.alert(t('common.error'), 'Remplissez tous les champs obligatoires');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'firstName', label: t('auth.firstName'), type: 'default' as const },
    { key: 'lastName', label: t('auth.lastName'), type: 'default' as const },
    { key: 'phone', label: t('auth.phone'), type: 'phone-pad' as const },
    { key: 'password', label: t('auth.password'), type: 'default' as const, secure: true },
    { key: 'tenantName', label: t('auth.tenantName'), type: 'default' as const },
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('auth.registerButton')}</Text>
        <Text style={styles.subtitle}>FLA7A ERP</Text>

        <View style={styles.form}>
          {fields.map((f) => (
            <View key={f.key}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={(form as any)[f.key]}
                onChangeText={(v) => update(f.key, v)}
                keyboardType={f.type}
                secureTextEntry={f.secure}
                placeholder={f.key === 'phone' ? t('auth.phonePlaceholder') : ''}
                placeholderTextColor={colors.gray[400]}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{t('auth.registerButton')}</Text>}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>{t('auth.hasAccount')} </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity><Text style={styles.loginLink}>{t('auth.login')}</Text></TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.primary[500] },
  subtitle: { fontSize: fontSize.md, color: colors.gray[500], marginBottom: spacing.xl },
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
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  loginText: { color: colors.gray[500], fontSize: fontSize.md },
  loginLink: { color: colors.primary[500], fontSize: fontSize.md, fontWeight: '600' },
});
