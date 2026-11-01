import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
    children: ReactNode
    resetKey?: string
}

interface State {
    hasError: boolean
    error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('Tool crashed:', error, info.componentStack)
    }

    componentDidUpdate(prevProps: Props): void {
        if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.setState({ hasError: false, error: null })
        }
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="tool-page">
                    <div className="error-boundary" role="alert">
                        <h2>This tool hit an unexpected error</h2>
                        <p>Your image never left this tab. Try reloading the tool or the page.</p>
                        {this.state.error && (
                            <pre style={{
                                margin: '16px 0',
                                padding: '12px',
                                background: 'rgba(0,0,0,0.6)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '8px',
                                color: '#f87171',
                                fontSize: '12px',
                                lineHeight: '1.4',
                                overflowX: 'auto',
                                textAlign: 'left',
                                fontFamily: 'monospace',
                            }}>
                                <strong>{this.state.error.name}: {this.state.error.message}</strong>
                                {'\n\n'}
                                {this.state.error.stack}
                            </pre>
                        )}
                        <div className="actions-bar">
                            <button
                                className="secondary-button"
                                onClick={() => this.setState({ hasError: false, error: null })}
                            >
                                Reload tool
                            </button>
                            <button
                                className="download-button"
                                onClick={() => window.location.reload()}
                            >
                                Reload page
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
