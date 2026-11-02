import { escapeReservedCharacter } from './telegram';

// Telegram rejects messages above 4096 characters, long SQL spans can exceed that
const MAX_VALUE_LENGTH = 3500;

function getTag(event: any, name: string): string | undefined {
	if (!Array.isArray(event.tags)) return undefined;
	return event.tags.find((tag: any) => tag?.[0] === name)?.[1];
}

function getProjectSlugFromEventUrl(eventUrl: unknown): string | undefined {
	if (typeof eventUrl !== 'string') return undefined;
	return eventUrl.match(/\/projects\/[^/]+\/([^/]+)\//)?.[1];
}

function truncate(text: string): string {
	return text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}…` : text;
}

export function buildTelegramMessage(event: any): Record<string, any> {
	// Only error events carry metadata.type, message and performance events (N+1 etc.) do not
	const title: string = event.metadata?.type ?? event.metadata?.title ?? event.title ?? 'Sentry Alert';
	const value: string | undefined = event.metadata?.value ?? event.message;

	const details: [string, string | undefined][] = [
		['Project', getProjectSlugFromEventUrl(event.url)],
		['Environment', event.environment ?? getTag(event, 'environment')],
		['Level', event.level ?? getTag(event, 'level')],
	];

	const lines = [`*${escapeReservedCharacter(title)}*`];
	if (value) lines.push(`\`${escapeReservedCharacter(truncate(value))}\``);
	lines.push('');
	for (const [label, detail] of details) {
		if (detail) lines.push(`${label}: \`${escapeReservedCharacter(detail)}\``);
	}

	return {
		text: lines.join('\n'),
		parse_mode: 'MarkdownV2',
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: 'Open in Sentry',
						url: event.web_url,
					},
				],
			],
		},
	};
}
