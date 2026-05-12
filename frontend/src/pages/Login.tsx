import { useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Banner } from '../components/ui/Banner';

export function Login() {
  const location = useLocation();
  const networkError =
    (location.state as { networkError?: string } | null)?.networkError ?? null;

  const onLogin = () => {
    window.location.href = '/auth/google/login';
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-card shadow-md border border-border p-8 sm:p-10 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-4 text-center">
          <img
            src="/phicus-logo.png"
            alt="Phicus"
            className="h-12 w-auto"
            width={206}
            height={58}
          />
          <div>
            <h1 className="font-display text-xl font-semibold leading-tight">
              Kratos
            </h1>
            <div className="text-sm text-fg-muted mt-1">Pelea de gallos · Q3 2026</div>
          </div>
        </div>
        {networkError && (
          <Banner
            tone="warning"
            icon={<AlertTriangle className="w-5 h-5" />}
            title="No se pudo contactar con el backend"
          >
            {networkError}. Comprueba que el servidor está corriendo en{' '}
            <code className="font-mono">localhost:8000</code> y recarga.
          </Banner>
        )}
        <p className="text-fg-secondary text-sm leading-relaxed">
          Inicia sesión con tu cuenta corporativa para puntuar las propuestas internas. El
          voto es anónimo, irreversible y sólo se puede emitir una vez.
        </p>
        <Button onClick={onLogin} size="lg" className="w-full">
          <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
          </svg>
          Entrar con Google
        </Button>
        <p className="text-xs text-fg-muted text-center">
          Sólo cuentas <span className="font-mono">@phicus.es</span>.
        </p>
      </div>
    </div>
  );
}
