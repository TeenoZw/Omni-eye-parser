import type { LayoutLoad } from './$types';

import { getFleetWorkspace } from '$lib/api/mockTelemetry';

export const load: LayoutLoad = async () => {
	const { data: workspace } = await getFleetWorkspace();
	return { workspace };
};
