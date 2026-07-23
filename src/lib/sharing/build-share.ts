import { clonePlainGuide, isBuildGuide } from '$lib/persistence/build-library';
import type { BuildGuide } from '$lib/types/guide';

export type SharedBuildPayload = {
	version: 1;
	name: string;
	guide: BuildGuide;
	activeStepId: string;
};

const MAX_SHARE_TOKEN_LENGTH = 150_000;
const MAX_SHARE_JSON_BYTES = 1_000_000;

const bytesToBase64Url = (bytes: Uint8Array) => {
	let binary = '';
	const chunkSize = 0x8000;
	for (let index = 0; index < bytes.length; index += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
	}
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
};

const base64UrlToBytes = (value: string) => {
	const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
	const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
	const binary = atob(padded);
	return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const compressText = async (text: string) => {
	const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
	return new Uint8Array(await new Response(stream).arrayBuffer());
};

const decompressText = async (bytes: Uint8Array) => {
	const buffer = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(buffer).set(bytes);
	const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];
	let length = 0;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		length += value.byteLength;
		if (length > MAX_SHARE_JSON_BYTES) {
			await reader.cancel();
			throw new Error('The shared build data is too large.');
		}
		chunks.push(value);
	}

	const output = new Uint8Array(length);
	let offset = 0;
	for (const chunk of chunks) {
		output.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return new TextDecoder().decode(output);
};

const isSharedBuildPayload = (value: unknown): value is SharedBuildPayload => {
	if (typeof value !== 'object' || value === null) return false;
	const payload = value as Record<string, unknown>;
	return (
		payload.version === 1 &&
		typeof payload.name === 'string' &&
		payload.name.length > 0 &&
		payload.name.length <= 200 &&
		isBuildGuide(payload.guide) &&
		typeof payload.activeStepId === 'string' &&
		payload.guide.steps.some((step) => step.id === payload.activeStepId)
	);
};

export async function encodeSharedBuild(payload: SharedBuildPayload) {
	const json = JSON.stringify({
		...payload,
		guide: clonePlainGuide(payload.guide)
	});
	if (new Blob([json]).size > MAX_SHARE_JSON_BYTES) {
		throw new Error('This build is too large to fit in a share link.');
	}

	if ('CompressionStream' in globalThis) {
		const token = `g.${bytesToBase64Url(await compressText(json))}`;
		if (token.length > MAX_SHARE_TOKEN_LENGTH) {
			throw new Error('This build is too large to fit in a share link.');
		}
		return token;
	}

	const token = `j.${bytesToBase64Url(new TextEncoder().encode(json))}`;
	if (token.length > MAX_SHARE_TOKEN_LENGTH) {
		throw new Error('This build is too large to fit in a share link.');
	}
	return token;
}

export async function decodeSharedBuild(token: string) {
	if (!token || token.length > MAX_SHARE_TOKEN_LENGTH) {
		throw new Error('The shared build link is empty or too large.');
	}

	const [format, encoded] = token.split('.', 2);
	if (!encoded || (format !== 'g' && format !== 'j')) {
		throw new Error('The shared build link has an unsupported format.');
	}

	const bytes = base64UrlToBytes(encoded);
	const json = format === 'g' ? await decompressText(bytes) : new TextDecoder().decode(bytes);
	const parsed = JSON.parse(json) as unknown;

	if (!isSharedBuildPayload(parsed)) {
		throw new Error('The shared build data is invalid.');
	}

	return {
		...parsed,
		guide: clonePlainGuide(parsed.guide)
	};
}

export const readSharedBuildToken = (hash: string) => {
	const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
	return params.get('build');
};

export const createShareUrl = (token: string, currentUrl: string) => {
	const url = new URL(currentUrl);
	url.hash = `build=${token}`;
	return url.toString();
};
