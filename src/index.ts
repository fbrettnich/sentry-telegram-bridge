import { escapeReservedCharacter, sendTelegramMessage } from './telegram';
import { SentryHookResource, SentryWebhookBody } from './types/sentry/webhook';
import { verifySignature } from './verify';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method !== 'POST')
			return new Response(null, {
				status: 405,
				headers: {
					Allow: 'POST',
					'Access-Control-Allow-Origin': '*',
				},
			});

		if (
			!request.headers.get('sentry-hook-resource') ||
			!request.headers.get('sentry-hook-timestamp') ||
			!request.headers.get('sentry-hook-signature')
		)
			return new Response(null, { status: 400 });

		if (!(await verifySignature(request, env.SENTRY_CLIENT_SECRET))) return new Response(null, { status: 401 });

		const sentryHookResource: SentryHookResource = request.headers.get('sentry-hook-resource') as SentryHookResource;
		const body: SentryWebhookBody = await request.json();

		if (sentryHookResource === 'event_alert') {
			const event = body.data.event;
			const telegramMessage = {
				text: `
*${escapeReservedCharacter(event.metadata.type)}*
\`${escapeReservedCharacter(event.metadata.value)}\`
`,
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

			const success = await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, telegramMessage);
			if (!success) return new Response(null, { status: 500 });
		} else if (sentryHookResource === 'issue') {
			return new Response(null, { status: 204 });
		} else {
			return new Response(null, { status: 400 });
		}

		return new Response(null, { status: 201 });
	},
} satisfies ExportedHandler<Env>;
