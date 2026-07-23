const SPOO_ME_SHORTEN_URL = 'https://spoo.me/api/v1/shorten';
const SPOO_ME_MAX_LONG_URL_LENGTH = 8_192;
const SHORTEN_TIMEOUT_MS = 10_000;

type SpooMeShortenResponse = {
	short_url?: unknown;
};

const isSpooMeUrl = (value: unknown): value is string => {
	if (typeof value !== 'string') return false;

	try {
		const url = new URL(value);
		return (
			url.protocol === 'https:' && (url.hostname === 'spoo.me' || url.hostname === 'www.spoo.me')
		);
	} catch {
		return false;
	}
};

export async function shortenShareUrl(longUrl: string, fetcher: typeof fetch = fetch) {
	if (longUrl.length > SPOO_ME_MAX_LONG_URL_LENGTH) {
		throw new Error('The share URL exceeds the Spoo.me length limit.');
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), SHORTEN_TIMEOUT_MS);

	try {
		const response = await fetcher(SPOO_ME_SHORTEN_URL, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ long_url: longUrl }),
			signal: controller.signal
		});

		if (!response.ok) {
			throw new Error(`Spoo.me returned ${response.status}.`);
		}

		const payload = (await response.json()) as SpooMeShortenResponse;
		if (!isSpooMeUrl(payload.short_url)) {
			throw new Error('Spoo.me returned an invalid short URL.');
		}

		return payload.short_url;
	} finally {
		clearTimeout(timeout);
	}
}
