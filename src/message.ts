import { escapeReservedCharacter } from './telegram';
import { SentryWebhookAction, SentryWebhookData } from './types/sentry/webhook';

// Telegram rejects messages above 4096 characters, long SQL spans can exceed that
const MAX_VALUE_LENGTH = 3500;

type MessageDetail = [label: string, value: string | null | undefined];

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

function buildMessage(title: string, value: string | null | undefined, details: MessageDetail[], url: string): Record<string, any> {
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
						url,
					},
				],
			],
		},
	};
}

export function buildTelegramMessage(event: any): Record<string, any> {
	// Only error events carry metadata.type, message and performance events (N+1 etc.) do not
	const title: string = event.metadata?.type ?? event.metadata?.title ?? event.title ?? 'Sentry Alert';
	const value: string | undefined = event.metadata?.value ?? event.message;

	return buildMessage(
		title,
		value,
		[
			['Project', getProjectSlugFromEventUrl(event.url)],
			['Environment', event.environment ?? getTag(event, 'environment')],
			['Level', event.level ?? getTag(event, 'level')],
		],
		event.web_url,
	);
}

export function buildMetricAlertMessage(action: SentryWebhookAction, data: SentryWebhookData): Record<string, any> {
	const metricAlert = data.metric_alert;
	const title: string = data.description_title ?? metricAlert?.alert_rule?.name ?? 'Sentry Metric Alert';
	const projects: string[] | undefined = metricAlert?.projects;

	return buildMessage(
		title,
		data.description_text,
		[
			['Project', projects?.join(', ')],
			['Environment', metricAlert?.alert_rule?.environment],
			['Status', action],
		],
		data.web_url as string,
	);
}
