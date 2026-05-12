import { NavLink, Outlet } from 'react-router-dom';
import { type ReactNode } from 'react';
import {
  ClipboardList,
  GitMerge,
  LayoutDashboard,
  PlayCircle,
  Settings2,
  Users,
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import type { Me } from '../../api/types';

interface Props {
  me: Me;
  loading: boolean;
  children?: ReactNode;
}

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/proposals', label: 'Propuestas', icon: ClipboardList, end: false },
  { to: '/admin/merge', label: 'Fusionar', icon: GitMerge, end: false },
  { to: '/admin/period', label: 'Periodo', icon: PlayCircle, end: false },
  { to: '/admin/participation', label: 'Participación', icon: Users, end: false },
  { to: '/admin/audit', label: 'Auditoría', icon: Settings2, end: false },
];

export function AdminShell({ me, loading, children }: Props) {
  useRequireAdmin(me, loading);
  return (
    <AppShell me={me}>
      <div className="grid sm:grid-cols-[200px_1fr] gap-6">
        <aside>
          <h2 className="text-xs uppercase tracking-wide text-fg-muted font-semibold mb-2 px-2">
            Administración
          </h2>
          <nav className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 px-3 py-2 rounded-control text-sm whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-soft text-primary-soft-text font-medium'
                      : 'text-fg-secondary hover:bg-surface-sunken'
                  }`
                }
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section>{children ?? <Outlet />}</section>
      </div>
    </AppShell>
  );
}
