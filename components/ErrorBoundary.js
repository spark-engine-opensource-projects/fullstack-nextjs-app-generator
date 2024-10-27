import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Error caught by ErrorBoundary: ", error, errorInfo);
  }

  handleRegenerate = async () => {
    try {
      // Wait for the async regenerate function to complete
      await this.props.onRegenerate();
      // Reset the error state
      this.setState({ hasError: false });
    } catch (error) {
      console.error('Error during regeneration:', error);
      // Optionally, you could keep the error state or add additional error handling here
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong.</h2>
          <p>We are unable to display this component.</p>
          {this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              {this.state.error.toString()}
              <br />
              {this.state.errorInfo.componentStack}
            </details>
          )}
          <button onClick={this.handleRegenerate} className="btn py-2 px-4 bg-red-500 text-white rounded">
            Regenerate Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
