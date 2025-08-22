// src/components/common/ErrorBoundary.jsx
import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  padding: 2rem;
  text-align: center;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  margin: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ErrorTitle = styled.h2`
  color: #dc2626;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
`;

const ErrorMessage = styled.p`
  color: #7f1d1d;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const RetryButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background: #2563eb;
  }
  
  &:active {
    background: #1d4ed8;
  }
`;

const ReportButton = styled.button`
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
`;

const ErrorDetails = styled.details`
  margin: 1rem 0;
  text-align: left;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 1rem;
  
  summary {
    cursor: pointer;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }
  
  pre {
    font-size: 0.75rem;
    color: #6b7280;
    white-space: pre-wrap;
    word-break: break-word;
    background: white;
    padding: 0.75rem;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
    margin: 0;
  }
`;

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree, logs those errors,
 * and displays a fallback UI instead of the component tree that crashed.
 * 
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components to wrap
 * @param {string} props.fallbackMessage Custom error message to display
 * @param {Function} props.onError Optional callback when an error occurs
 * @returns {React.ReactNode} Error UI or children
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate a unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorId: errorId
    });

    // Log error for debugging
    console.group(`🚨 Error Boundary Caught Error [${errorId}]`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    // In production, you would send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToService({ error, errorInfo, errorId });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;

    // Create error report
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    // Copy to clipboard for easy reporting
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error details copied to clipboard. Please paste this when reporting the issue.');
      })
      .catch(() => {
        // Fallback: show error details in console
        console.log('Error Report:', errorReport);
        alert('Error details logged to console. Please check browser console and include details when reporting.');
      });
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <ErrorContainer>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            {this.props.fallbackMessage ||
              'An unexpected error occurred while rendering this component. Please try refreshing the page or contact support if the problem persists.'}
          </ErrorMessage>

          {isDevelopment && this.state.error && (
            <ErrorDetails>
              <summary>🔍 Development Error Details</summary>
              <pre>
                <strong>Error:</strong> {this.state.error.toString()}
                {this.state.errorInfo?.componentStack && (
                  <>
                    {'\n\n'}<strong>Component Stack:</strong>
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </ErrorDetails>
          )}

          <ErrorActions>
            <RetryButton onClick={this.handleRetry}>
              🔄 Try Again
            </RetryButton>
            <ReportButton onClick={this.handleReportError}>
              📋 Copy Error Details
            </ReportButton>
          </ErrorActions>

          {this.state.errorId && (
            <p style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              marginTop: '1rem',
              fontFamily: 'monospace'
            }}>
              Error ID: {this.state.errorId}
            </p>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
