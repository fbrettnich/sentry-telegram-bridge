import { describe, expect, it } from 'vitest';
import { buildMetricAlertMessage, buildTelegramMessage } from '../src/message';
import { escapeReservedCharacter } from '../src/telegram';

const baseEvent = {
	web_url: 'https://example-org.sentry.io/issues/1/events/abc/',
	url: 'https://sentry.io/api/0/projects/example-org/example-project/events/abc/',
};

describe('buildTelegramMessage', () => {
	it('falls back to the event title for events without metadata.type', () => {
		const { text } = buildTelegramMessage({ ...baseEvent, title: 'N+1 Query', level: 'info', metadata: { value: 'db - UPDATE users' } });

		expect(text).toContain('*N\\+1 Query*');
		expect(text).toContain('`db \\- UPDATE users`');
		expect(text).toContain('Level: `info`');
	});

	it('does not throw when metadata and value are missing', () => {
		const { text } = buildTelegramMessage({ ...baseEvent, title: 'Something happened' });

		expect(text).toContain('*Something happened*');
	});

	it('reads the project slug from the event URL', () => {
		const { text } = buildTelegramMessage({ ...baseEvent, metadata: { type: 'Error', value: 'boom' } });

		expect(text).toContain('Project: `example\\-project`');
	});

	it('omits the project when the event URL has an unknown format', () => {
		const { text } = buildTelegramMessage({ ...baseEvent, url: 'https://example.com/', metadata: { type: 'Error', value: 'boom' } });

		expect(text).not.toContain('Project:');
	});

	it('reads environment and level from tags when they are not top-level fields', () => {
		const { text } = buildTelegramMessage({
			...baseEvent,
			title: 'N+1 Query',
			tags: [
				['environment', 'prod'],
				['level', 'info'],
			],
		});

		expect(text).toContain('Environment: `prod`');
		expect(text).toContain('Level: `info`');
	});

	it('stays below the Telegram length limit for long values', () => {
		const { text } = buildTelegramMessage({ ...baseEvent, title: 'N+1 Query', metadata: { value: 'a'.repeat(10000) } });

		expect(text.length).toBeLessThan(4096);
	});
});

describe('buildMetricAlertMessage', () => {
	const data = {
		description_title: 'Resolved: Too many errors',
		description_text: '1000 events in the last 10 minutes\nFilter: level:error',
		web_url: 'https://sentry.io/organizations/example-org/alerts/1/',
		metric_alert: {
			projects: ['example-project', 'other-project'],
			alert_rule: { name: 'Too many errors', environment: 'prod' },
		},
	};

	it('shows title, description, projects, environment and status', () => {
		const { text, reply_markup } = buildMetricAlertMessage('resolved', data);

		expect(text).toContain('*Resolved: Too many errors*');
		expect(text).toContain('`1000 events in the last 10 minutes\nFilter: level:error`');
		expect(text).toContain('Project: `example\\-project, other\\-project`');
		expect(text).toContain('Environment: `prod`');
		expect(text).toContain('Status: `resolved`');
		expect(reply_markup.inline_keyboard[0][0].url).toBe(data.web_url);
	});

	it('falls back to the rule name and omits a null environment', () => {
		const { text } = buildMetricAlertMessage('critical', {
			web_url: data.web_url,
			metric_alert: { projects: ['example-project'], alert_rule: { name: 'Too many errors', environment: null } },
		});

		expect(text).toContain('*Too many errors*');
		expect(text).not.toContain('Environment:');
		expect(text).toContain('Status: `critical`');
	});
});

describe('escapeReservedCharacter', () => {
	it('escapes backslashes without double escaping other characters', () => {
		expect(escapeReservedCharacter('C:\\temp.log')).toBe('C:\\\\temp\\.log');
	});
});
