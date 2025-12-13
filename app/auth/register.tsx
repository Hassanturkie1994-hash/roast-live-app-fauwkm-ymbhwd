
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

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const t = useTranslation();

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert(t.common.error, t.auth.register.error);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t.common.error, t.auth.register.passwordMismatch);
      return;
    }

    if (password.length < 6) {
      Alert.alert(t.common.error, t.auth.register.passwordTooShort);
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signUp(email, password, displayName);
      
      if (error) {
        // Display user-friendly error message - NO AUTOMATIC RETRIES
        console.warn('⚠️ Registration failed:', error.message);
        
        // Show specific error messages based on error code
        let errorTitle = t.auth.register.registrationFailed;
        let errorMessage = error.message || t.errors.generic;
        
        if (error.code === 'user_already_exists') {
          errorTitle = 'Account Already Exists';
          errorMessage = 'An account with this email already exists. Please sign in instead or use a different email address.';
        } else if (error.code === 'weak_password') {
          errorTitle = 'Weak Password';
          errorMessage = 'Your password must be at least 6 characters long. Please choose a stronger password.';
        }
        
        Alert.alert(
          errorTitle,
          errorMessage,
          [{ text: t.common.ok }]
        );
      } else {
        console.log('✅ Registration successful');
        Alert.alert(
          t.auth.register.successTitle,
          t.auth.register.successMessage,
          [
            {
              text: t.common.ok,
              onPress: () => router.replace('/auth/login'),
            },
          ]
        );
      }
    } catch (error) {
      console.warn('⚠️ Unexpected registration error:', error instanceof Error ? error.message : error);
      Alert.alert(
        t.auth.register.registrationFailed,
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
            {t.auth.register.title}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t.auth.register.displayName}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
              placeholder={t.auth.register.displayNamePlaceholder}
              placeholderTextColor={colors.placeholder}
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t.auth.register.email}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
              placeholder={t.auth.register.emailPlaceholder}
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t.auth.register.password}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
              placeholder={t.auth.register.passwordPlaceholder}
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t.auth.register.confirmPassword}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
              placeholder={t.auth.register.confirmPasswordPlaceholder}
              placeholderTextColor={colors.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <GradientButton
            title={loading ? t.auth.register.creatingAccount : t.auth.register.createAccount}
            onPress={handleRegister}
            disabled={loading}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{t.common.or}</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              {t.auth.register.alreadyHaveAccount}
            </Text>
          </TouchableOpacity>
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
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
