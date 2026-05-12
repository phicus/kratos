import { Link, NavLink } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { type ReactNode } from 'react';
import { logout } from '../api/endpoints';
import { Button } from './ui/Button';
import type { Me } from '../api/types';

interface Props {
  children: ReactNode;
  me?: Me | null;
}

export function AppShell({ children, me }: Props) {
  const onLogout = async () => {
    try {
      await logout();
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-sticky bg-surface/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3" aria-label="Kratos">
            <img
              src="/phicus-logo.png"
              alt="Phicus"
              className="h-7 w-auto"
              width={206}
              height={58}
            />
            <span className="font-display font-medium text-fg-secondary text-sm hidden sm:inline">
              Kratos
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {me?.is_admin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1 px-3 py-1.5 rounded-control text-sm font-medium ${
                    isActive
                      ? 'bg-primary-soft text-primary-soft-text'
                      : 'text-fg-secondary hover:bg-surface-sunken'
                  }`
                }
              >
                <Settings className="w-4 h-4" />
                Admin
              </NavLink>
            )}
            {me ? (
              <>
                <span className="text-sm text-fg-muted hidden sm:inline pl-2 pr-1">{me.email}</span>
                <Button variant="ghost" size="sm" onClick={onLogout} aria-label="Cerrar sesión">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="secondary" size="sm">
                  Entrar con Google
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
