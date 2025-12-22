
import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface Props {
  children: ReactNode;
  FallbackComponent?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRITICAL: Global Error Boundary (Prevents White Screen of Death)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This component catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree
 * that crashed.
 * 
 * FEATURES:
 * - Catches all React errors during rendering, lifecycle methods, and constructors
 * - Displays error message and stack trace for debugging
 * - Provides "Try Again" button to reset error state
 * - Supports custom fallback components
 * - Logs errors to console for debugging
 * 
 * USAGE:
 * Wrap your app or specific components with this boundary:
 * 
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 * 
 * Or with a custom fallback:
 * 
 * <ErrorBoundary FallbackComponent={CustomErrorScreen}>
 *   <YourApp />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('🚨 [ErrorBoundary] Error caught by boundary');
    console.error('🚨 [ErrorBoundary] Error:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('🚨 [ErrorBoundary] Component stack trace:');
    console.error(errorInfo.componentStack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    this.setState({
      errorInfo,
    });
  }

  resetError = () => {
    console.log('🔄 [ErrorBoundary] Resetting error state');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const { FallbackComponent } = this.props;
      const { error } = this.state;

      // Use custom fallback component if provided
      if (FallbackComponent && error) {
        return <FallbackComponent error={error} resetError={this.resetError} />;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.content}>
              <Text style={styles.emoji}>⚠️</Text>
              <Text style={styles.title}>Something went wrong</Text>
              
              {error && (
                <>
                  <Text style={styles.errorTitle}>Error Message:</Text>
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error.message}</Text>
                  </View>
                </>
              )}
              
              {error?.stack && (
                <>
                  <Text style={styles.errorTitle}>Stack Trace:</Text>
                  <View style={styles.errorBox}>
                    <Text style={styles.stackText}>{error.stack}</Text>
                  </View>
                </>
              )}
              
              {this.state.errorInfo?.componentStack && (
                <>
                  <Text style={styles.errorTitle}>Component Stack:</Text>
                  <View style={styles.errorBox}>
                    <Text style={styles.stackText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </View>
                </>
              )}
              
              <TouchableOpacity
                style={styles.button}
                onPress={this.resetError}
              >
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
              
              <Text style={styles.hint}>
                If this error persists, please restart the app
              </Text>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    alignSelf: 'flex-start',
    marginTop: 16,
    marginBottom: 8,
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6666',
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#FF8888',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  button: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default ErrorBoundary;
