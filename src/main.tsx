import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { inject } from '@vercel/analytics'
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Initialize Vercel Web Analytics
inject()

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
