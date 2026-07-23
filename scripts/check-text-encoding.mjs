import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ignoredDirectories = new Set([
	'.git',
	'.svelte-kit',
	'build',
	'coverage',
	'node_modules',
	'playwright-report',
	'test-results'
]);

const textExtensions = new Set([
	'.css',
	'.html',
	'.js',
	'.json',
	'.md',
	'.mjs',
	'.svelte',
	'.ts',
	'.yaml',
	'.yml'
]);

const rootTextFiles = new Set([
	'.eslintignore',
	'.gitignore',
	'.npmrc',
	'.prettierignore',
	'.prettierrc',
	'LICENSE'
]);

const suspiciousPatterns = [
	/\u00c2(?=[\u0080-\u00bf])/u,
	/\u00c3(?=[\u0080-\u00bf])/u,
	/\u00e2(?=[\u0080-\u009f\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2010-\u203a\u20ac\u2122])/u,
	/\ufffd/u,
	/[\u0080-\u009f]/u
];

function shouldScan(filePath) {
	return textExtensions.has(path.extname(filePath)) || rootTextFiles.has(path.basename(filePath));
}

async function collectTextFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			files.push(...(await collectTextFiles(entryPath)));
		} else if (entry.isFile() && shouldScan(entryPath)) {
			files.push(entryPath);
		}
	}

	return files;
}

function escapeNonAscii(value) {
	return Array.from(value, (character) => {
		const codePoint = character.codePointAt(0);
		return codePoint !== undefined && (codePoint < 32 || codePoint > 126)
			? `\\u{${codePoint.toString(16).toUpperCase()}}`
			: character;
	}).join('');
}

const files = await collectTextFiles(process.cwd());
const findings = [];

for (const filePath of files) {
	const contents = await readFile(filePath, 'utf8');
	const lines = contents.split(/\r?\n/u);

	for (const [index, line] of lines.entries()) {
		if (suspiciousPatterns.some((pattern) => pattern.test(line))) {
			findings.push(
				`${path.relative(process.cwd(), filePath)}:${index + 1}: ${escapeNonAscii(line)}`
			);
		}
	}
}

if (findings.length > 0) {
	console.error('Encoding check failed. Possible mojibake was found:');
	console.error(findings.join('\n'));
	process.exitCode = 1;
} else {
	console.log(`Encoding check passed (${files.length} text files scanned).`);
}
