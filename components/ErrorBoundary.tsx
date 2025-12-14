
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * FIX ISSUE 4: Enhanced error logging with component stack and detailed context
 * 
 * Catches runtime errors in child components and displays a fallback UI
 * instead of crashing the entire app.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
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
    // FIX ISSUE 4: Enhanced error logging with full context
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [ErrorBoundary] CRITICAL ERROR CAUGHT');
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
    } catch (e) {
      console.error('Failed to capture provider state:', e);
    }

    // Store errorInfo in state for display
    this.setState({ errorInfo });

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
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    }
  }

  handleReset = () => {
    console.log('🔄 [ErrorBoundary] Resetting error state');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
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
