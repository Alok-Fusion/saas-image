import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
    children: ReactNode
    resetKey?: string
}

interface State {
    hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('Tool crashed:', error, info.componentStack)
    }

    componentDidUpdate(prevProps: Props): void {
        if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.setState({ hasError: false })
        }
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="tool-page">
                    <div className="error-boundary" role="alert">
                        <h2>This tool hit an unexpected error</h2>
                        <p>Your image never left this tab. Try reloading the tool or the page.</p>
                        <div className="actions-bar">
                            <button
                                className="secondary-button"
                                onClick={() => this.setState({ hasError: false })}
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
