export function formatDateLabel(value: string) {
	return new Date(value).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

export function formatTimeLabel(value: string) {
	return new Date(value).toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatDuration(seconds: number) {
	const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
	const hours = Math.floor(safe / 3600);
	const minutes = Math.floor((safe % 3600) / 60);
	const secs = safe % 60;

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}

	return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatSpeed(speed: number) {
	const safe = Number.isFinite(speed) ? speed : 0;
	return safe.toFixed(1);
}

export function formatRelativeTime(value: string) {
	const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));

	if (diffSeconds < 60) return `${diffSeconds}s ago`;
	if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
	return `${Math.floor(diffSeconds / 3600)}h ago`;
}
