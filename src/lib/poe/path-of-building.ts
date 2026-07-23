const POBB_IN_URL = /^https?:\/\/(?:www\.)?pobb\.in\/([A-Za-z0-9_-]+)\/?$/i;

export function buildPathOfBuildingUrl(sourceUrl: string) {
	const buildId = sourceUrl.match(POBB_IN_URL)?.[1];
	return buildId ? `pob://pobbin/${buildId}` : null;
}
