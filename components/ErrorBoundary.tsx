
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  FallbackComponent?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * ErrorBoundary Component
 * 
 * FIX ISSUE 3: Prevent infinite error loops
 * FIX ISSUE 4: Enhanced error logging with component stack
 * 
 * Catches runtime errors in child components and displays a fallback UI
 * instead of crashing the entire app.
 * 
 * NEW: Accepts FallbackComponent prop for custom error UI
 * NEW: Prevents infinite loops by tracking error count
 * 
 * Usage:
 * <ErrorBoundary FallbackComponent={CustomFallback}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<Props, State> {
  private resetTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // FIX ISSUE 3: Prevent infinite loops by tracking error count
    const newErrorCount = this.state.errorCount + 1;
    
    if (newErrorCount > 5) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🚨 [ErrorBoundary] INFINITE ERROR LOOP DETECTED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error has occurred more than 5 times. Stopping error boundary reset.');
      console.error('This usually indicates a provider or hook is missing.');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Don't update state to prevent further re-renders
      return;
    }

    // FIX ISSUE 4: Enhanced error logging with full context
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`❌ [ErrorBoundary] CRITICAL ERROR CAUGHT (Count: ${newErrorCount})`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Log provider state snapshot for debugging
    try {
      console.error('Provider State Snapshot:');
      console.error('- Window dimensions:', {
        width: typeof window !== 'undefined' ? window.innerWidth : 'N/A',
        height: typeof window !== 'undefined' ? window.innerHeight : 'N/A',
      });
      console.error('- Timestamp:', new Date().toISOString());
      console.error('- Error count:', newErrorCount);
    } catch (e) {
      console.error('Failed to capture provider state:', e);
    }

    // Store errorInfo in state for display
    this.setState({ 
      errorInfo,
      errorCount: newErrorCount,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // FIX ISSUE 4: In development, ensure import/export errors are visible
    if (__DEV__) {
      if (error.message.includes('undefined') || error.message.includes('not a function')) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('⚠️  POSSIBLE IMPORT/EXPORT ERROR DETECTED');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('This error often indicates:');
        console.error('1. A component is exported incorrectly (default vs named export)');
        console.error('2. A component import path is incorrect');
        console.error('3. A component returns undefined instead of JSX');
        console.error('4. A circular dependency exists');
        console.error('5. A provider is missing from the app root');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }

      if (error.message.includes('must be used within')) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('⚠️  MISSING PROVIDER DETECTED');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('A hook is being called outside its provider context.');
        console.error('Check that the provider is mounted in app/_layout.tsx');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  handleReset = () => {
    console.log('🔄 [ErrorBoundary] Resetting error state');
    
    // FIX ISSUE 3: Add delay before reset to prevent immediate re-error
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }

    this.resetTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        // Keep error count to track infinite loops
      });
    }, 300);
  };

  render() {
    if (this.state.hasError) {
      // FIX ISSUE 3: If error count is too high, show permanent error screen
      if (this.state.errorCount > 5) {
        return (
          <View style={styles.container}>
            <View style={styles.content}>
              <IconSymbol
                ios_icon_name="exclamationmark.octagon.fill"
                android_material_icon_name="error"
                size={64}
                color={colors.brandPrimary}
              />
              <Text style={styles.title}>Critical Error</Text>
              <Text style={styles.message}>
                The app has encountered a critical error and cannot continue.
                Please restart the app.
              </Text>
              <Text style={[styles.message, { fontSize: 12, marginTop: 16 }]}>
                Error: {this.state.error?.message || 'Unknown error'}
              </Text>
            </View>
          </View>
        );
      }

      // Custom FallbackComponent prop
      if (this.props.FallbackComponent) {
        const FallbackComponent = this.props.FallbackComponent;
        return (
          <FallbackComponent 
            error={this.state.error || new Error('Unknown error')} 
            resetError={this.handleReset} 
          />
        );
      }

      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI with detailed error information
      return (
        <View style={styles.container}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.content}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="error"
                size={64}
                color={colors.brandPrimary}
              />
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.message}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </Text>
              
              {/* FIX ISSUE 4: Show detailed error info in development */}
              {__DEV__ && this.state.error && (
                <View style={styles.debugSection}>
                  <Text style={styles.debugTitle}>Debug Information:</Text>
                  <Text style={styles.debugText}>
                    {this.state.error.stack || 'No stack trace available'}
                  </Text>
                  {this.state.errorInfo && (
                    <>
                      <Text style={styles.debugTitle}>Component Stack:</Text>
                      <Text style={styles.debugText}>
                        {this.state.errorInfo.componentStack}
                      </Text>
                    </>
                  )}
                  <Text style={styles.debugTitle}>Error Count: {this.state.errorCount}</Text>
                </View>
              )}
              
              <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    gap: 16,
    maxWidth: 600,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  debugSection: {
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  debugText: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  button: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
