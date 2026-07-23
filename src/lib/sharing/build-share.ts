import { sampleGuides } from '$lib/data/sample-guides';
import { clonePlainGuide, isBuildGuide } from '$lib/persistence/build-library';
import type { BuildGuide, GuideInsight, GuideTodo } from '$lib/types/guide';

export type SharedBuildPayload = {
	version: 1;
	name: string;
	guide: BuildGuide;
	activeStepId: string;
};

type CompactStepOverrides = {
	i: string;
	t?: string;
	e?: string;
	d?: string;
	r?: GuideInsight[] | null;
	c?: GuideTodo[];
};

type CompactSharedBuildPayload = {
	v: 2;
	n: string;
	b: string;
	a: string;
	s: CompactStepOverrides[];
};

const MAX_SHARE_TOKEN_LENGTH = 150_000;
const MAX_SHARE_JSON_BYTES = 1_000_000;

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

const hasOwn = (value: Record<string, unknown>, key: string) =>
	Object.prototype.hasOwnProperty.call(value, key);

const isString = (value: unknown, maxLength: number): value is string =>
	typeof value === 'string' && value.length <= maxLength;

const isSameJson = (left: unknown, right: unknown) =>
	JSON.stringify(left) === JSON.stringify(right);

const findGuideTemplate = (guide: BuildGuide) =>
	sampleGuides.find(
		(template) => template.id === guide.id && template.sourceUrl === guide.sourceUrl
	);

const hasMatchingStaticGuideData = (guide: BuildGuide, template: BuildGuide) => {
	if (
		guide.name !== template.name ||
		guide.buildVersion !== template.buildVersion ||
		guide.className !== template.className ||
		guide.level !== template.level ||
		guide.sourceUrl !== template.sourceUrl ||
		!isSameJson(guide.notes, template.notes) ||
		guide.steps.length !== template.steps.length
	) {
		return false;
	}

	return guide.steps.every((step, index) => {
		const templateStep = template.steps[index];
		return (
			step.id === templateStep.id &&
			isSameJson(step.uniques, templateStep.uniques) &&
			isSameJson(step.equipment, templateStep.equipment) &&
			isSameJson(step.gems, templateStep.gems) &&
			isSameJson(step.noteHighlights, templateStep.noteHighlights)
		);
	});
};

const createCompactPayload = (
	payload: SharedBuildPayload
): CompactSharedBuildPayload | undefined => {
	const template = findGuideTemplate(payload.guide);
	if (!template || !hasMatchingStaticGuideData(payload.guide, template)) return undefined;

	const stepOverrides = payload.guide.steps.flatMap<CompactStepOverrides>((step, index) => {
		const templateStep = template.steps[index];
		const overrides: CompactStepOverrides = { i: step.id };

		if (step.title !== templateStep.title) overrides.t = step.title;
		if (step.eyebrow !== templateStep.eyebrow) overrides.e = step.eyebrow;
		if (step.description !== templateStep.description) overrides.d = step.description;
		if (!isSameJson(step.insights, templateStep.insights)) {
			overrides.r = step.insights ?? null;
		}
		if (!isSameJson(step.todos, templateStep.todos)) overrides.c = step.todos;

		return Object.keys(overrides).length > 1 ? [overrides] : [];
	});

	return {
		v: 2,
		n: payload.name,
		b: template.id,
		a: payload.activeStepId,
		s: stepOverrides
	};
};

const decodeCompactPayload = (value: unknown): SharedBuildPayload | undefined => {
	if (
		!isObject(value) ||
		value.v !== 2 ||
		!isString(value.n, 200) ||
		value.n.length === 0 ||
		!isString(value.b, 200) ||
		!isString(value.a, 200) ||
		!Array.isArray(value.s) ||
		value.s.length > 50
	) {
		return undefined;
	}

	const template = sampleGuides.find((guide) => guide.id === value.b);
	if (!template) return undefined;

	const guide = clonePlainGuide(template);
	const seenStepIds = new Set<string>();

	for (const rawOverrides of value.s) {
		if (!isObject(rawOverrides) || !isString(rawOverrides.i, 200)) return undefined;
		if (seenStepIds.has(rawOverrides.i)) return undefined;

		const step = guide.steps.find((candidate) => candidate.id === rawOverrides.i);
		if (!step) return undefined;
		seenStepIds.add(rawOverrides.i);

		if (hasOwn(rawOverrides, 't')) {
			if (!isString(rawOverrides.t, 300)) return undefined;
			step.title = rawOverrides.t;
		}
		if (hasOwn(rawOverrides, 'e')) {
			if (!isString(rawOverrides.e, 300)) return undefined;
			step.eyebrow = rawOverrides.e;
		}
		if (hasOwn(rawOverrides, 'd')) {
			if (!isString(rawOverrides.d, 4_000)) return undefined;
			step.description = rawOverrides.d;
		}
		if (hasOwn(rawOverrides, 'r')) {
			if (rawOverrides.r === null) {
				delete step.insights;
			} else {
				step.insights = rawOverrides.r as GuideInsight[];
			}
		}
		if (hasOwn(rawOverrides, 'c')) {
			step.todos = rawOverrides.c as GuideTodo[];
		}
	}

	if (!isBuildGuide(guide) || !guide.steps.some((step) => step.id === value.a)) {
		return undefined;
	}

	return {
		version: 1,
		name: value.n,
		guide,
		activeStepId: value.a
	};
};

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
	const compactPayload = createCompactPayload(payload);
	const json = JSON.stringify(
		compactPayload ?? {
			...payload,
			guide: clonePlainGuide(payload.guide)
		}
	);
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
	const payload = isSharedBuildPayload(parsed) ? parsed : decodeCompactPayload(parsed);
	if (!payload) {
		throw new Error('The shared build data is invalid.');
	}

	return {
		...payload,
		guide: clonePlainGuide(payload.guide)
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
