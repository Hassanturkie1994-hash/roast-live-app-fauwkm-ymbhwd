
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import GradientButton from '@/components/GradientButton';
import AppLogo from '@/components/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const t = useTranslation();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t.common.error, t.auth.login.error);
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        // Display user-friendly error message - NO AUTOMATIC RETRIES
        console.warn('⚠️ Login failed:', error.message);
        
        // Show specific error messages based on error code
        let errorTitle = t.auth.login.loginFailed;
        let errorMessage = error.message || t.errors.generic;
        
        if (error.code === 'invalid_credentials') {
          errorTitle = 'Invalid Credentials';
          errorMessage = 'The email or password you entered is incorrect. Please check your credentials and try again.';
        } else if (error.code === 'email_not_confirmed') {
          errorTitle = 'Email Not Confirmed';
          errorMessage = 'Please verify your email address before logging in. Check your inbox for the confirmation link.';
        }
        
        Alert.alert(
          errorTitle,
          errorMessage,
          [{ text: t.common.ok }]
        );
      } else {
        console.log('✅ Login successful');
        router.replace('/(tabs)/(home)');
      }
    } catch (error) {
      console.warn('⚠️ Unexpected login error:', error instanceof Error ? error.message : error);
      Alert.alert(
        t.auth.login.loginFailed,
        t.errors.generic,
        [{ text: t.common.ok }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <AppLogo size="xlarge" alignment="center" />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.auth.login.subtitle}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t.auth.login.email}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder={t.auth.login.emailPlaceholder}
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t.auth.login.password}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder={t.auth.login.passwordPlaceholder}
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: colors.brandPrimary }]}>
              {t.auth.login.forgotPassword}
            </Text>
          </TouchableOpacity>

          <GradientButton
            title={loading ? t.auth.login.signingIn : t.auth.login.signIn}
            onPress={handleLogin}
            disabled={loading}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{t.common.or}</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <GradientButton
            title={t.auth.login.createAccount}
            onPress={() => router.push('/auth/register')}
            disabled={loading}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 24,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 16,
  },
});
