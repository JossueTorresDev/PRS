import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'sweetalert2/dist/sweetalert2.min.css'
import App from './App.jsx'
import './index.css'
// Polyfill Node `Buffer` in the browser for libraries that expect it.
// Use dynamic import so Vite handles the dependency according to optimizeDeps/alias.
if (typeof globalThis.Buffer === 'undefined') {
  import('buffer').then(({ Buffer }) => {
    globalThis.Buffer = Buffer;
  }).catch((err) => {
    // If polyfill fails, log — original jsPDF code should still work in many cases
    console.error('Failed to load buffer polyfill:', err);
  });
}

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter
      basename={routerBasename}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </StrictMode>,
)
