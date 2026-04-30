import type { NavigationItem } from '$lib/types/telemetry';

export const SHELL_NAV_ITEMS: NavigationItem[] = [
	{ id: 'dashboard', href: '/', label: 'Dashboard', description: 'Fleet overview' },
	{ id: 'monitoring', href: '/monitoring', label: 'Monitoring', description: 'Live tracking map' },
	{ id: 'playback', href: '/playback', label: 'Playback', description: 'Historical trip replay' },
	{ id: 'reports', href: '/reports', label: 'Reports', description: 'Operational outputs' },
	{ id: 'geofences', href: '/geofences', label: 'Geofences', description: 'Places and zones' },
	{ id: 'routes', href: '/routes', label: 'Routes', description: 'Planned operations' },
	{ id: 'drivers', href: '/drivers', label: 'Drivers', description: 'Driver registry' },
	{ id: 'alerts', href: '/alerts', label: 'Alerts', description: 'Attention queue' },
	{ id: 'assets', href: '/assets', label: 'Assets', description: 'Fleet registry' },
	{ id: 'devices', href: '/devices', label: 'Devices', description: 'Tracker health' },
	{ id: 'analytics', href: '/analytics', label: 'Analytics', description: 'Fleet insights' },
	{ id: 'settings', href: '/settings', label: 'Settings', description: 'Platform setup' }
];
