// icons.jsx — Inline lucide SVGs. Stroke 1.5, currentColor.
// Single source of truth so screens don't redeclare SVG markup.

const _Icon = ({ children, size = 18, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true" {...rest}>
    {children}
  </svg>
);

const IconCheck = (p) => <_Icon {...p}><path d="M20 6 9 17l-5-5"/></_Icon>;
const IconCheckCircle = (p) => <_Icon {...p}>
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
</_Icon>;
const IconClock = (p) => <_Icon {...p}>
  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
</_Icon>;
const IconLock = (p) => <_Icon {...p}>
  <rect width="18" height="11" x="3" y="11" rx="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</_Icon>;
const IconPlay = (p) => <_Icon {...p}>
  <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
</_Icon>;
const IconChevronDown = (p) => <_Icon {...p}><path d="m6 9 6 6 6-6"/></_Icon>;
const IconChevronRight = (p) => <_Icon {...p}><path d="m9 18 6-6-6-6"/></_Icon>;
const IconChevronLeft = (p) => <_Icon {...p}><path d="m15 18-6-6 6-6"/></_Icon>;
const IconPlus = (p) => <_Icon {...p}><path d="M5 12h14"/><path d="M12 5v14"/></_Icon>;
const IconMinus = (p) => <_Icon {...p}><path d="M5 12h14"/></_Icon>;
const IconSearch = (p) => <_Icon {...p}>
  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
</_Icon>;
const IconFilter = (p) => <_Icon {...p}>
  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
</_Icon>;
const IconEdit = (p) => <_Icon {...p}>
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
</_Icon>;
const IconTrash = (p) => <_Icon {...p}>
  <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
</_Icon>;
const IconMerge = (p) => <_Icon {...p}>
  <path d="m8 6 4-4 4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22"/>
  <path d="m20 22-5-5"/>
</_Icon>;
const IconLogout = (p) => <_Icon {...p}>
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
  <polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
</_Icon>;
const IconRefresh = (p) => <_Icon {...p}>
  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
  <path d="M3 3v5h5"/>
  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
  <path d="M16 16h5v5"/>
</_Icon>;
const IconTrophy = (p) => <_Icon {...p}>
  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
  <path d="M4 22h16"/>
  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
</_Icon>;
const IconUsers = (p) => <_Icon {...p}>
  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
  <circle cx="9" cy="7" r="4"/>
  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
</_Icon>;
const IconList = (p) => <_Icon {...p}>
  <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/>
  <line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/>
  <line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
</_Icon>;
const IconAlert = (p) => <_Icon {...p}>
  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
  <line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
</_Icon>;
const IconSparkles = (p) => <_Icon {...p}>
  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
</_Icon>;
const IconShield = (p) => <_Icon {...p}>
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
</_Icon>;
const IconHelp = (p) => <_Icon {...p}>
  <circle cx="12" cy="12" r="10"/>
  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
  <line x1="12" x2="12.01" y1="17" y2="17"/>
</_Icon>;
const IconBird = (p) => <_Icon {...p}>
  <path d="M16 7h.01"/>
  <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/>
  <path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/>
  <path d="M7 18a6 6 0 0 0 3.84-10.61"/>
</_Icon>;

Object.assign(window, {
  IconCheck, IconCheckCircle, IconClock, IconLock, IconPlay,
  IconChevronDown, IconChevronRight, IconChevronLeft,
  IconPlus, IconMinus, IconSearch, IconFilter,
  IconEdit, IconTrash, IconMerge, IconLogout, IconRefresh,
  IconTrophy, IconUsers, IconList, IconAlert, IconSparkles,
  IconShield, IconHelp, IconBird,
});
