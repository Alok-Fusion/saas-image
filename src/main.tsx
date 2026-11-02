import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/geist-sans/400.css'
import '@fontsource/geist-sans/500.css'
import '@fontsource/geist-sans/600.css'
import '@fontsource/geist-sans/700.css'
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/500.css'
import '@fontsource/geist-mono/600.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import './index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <ToastProvider>
                <App />
            </ToastProvider>
        </ErrorBoundary>
    </StrictMode>,
)
