export async function sendTelegramMessage(token: string, chatId: string, body: Record<string, any>): Promise<boolean> {
	if (!token || !chatId || !body) throw new Error('Telegram token, chatId and body are required');

	const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			chat_id: chatId,
			...body,
		}),
	});

	if (!response.ok) console.error(`Telegram API error ${response.status}: ${await response.text()}`);

	return response.ok;
}

export function escapeReservedCharacter(text: string): string {
	// https://core.telegram.org/bots/api#markdownv2-style
	return text
		.replace(/\\/g, '\\\\')
		.replace(/\_/g, '\\_')
		.replace(/\*/g, '\\*')
		.replace(/\[/g, '\\[')
		.replace(/\]/g, '\\]')
		.replace(/\(/g, '\\(')
		.replace(/\)/g, '\\)')
		.replace(/\~/g, '\\~')
		.replace(/\`/g, '\\`')
		.replace(/\>/g, '\\>')
		.replace(/\#/g, '\\#')
		.replace(/\+/g, '\\+')
		.replace(/\-/g, '\\-')
		.replace(/\=/g, '\\=')
		.replace(/\|/g, '\\|')
		.replace(/\{/g, '\\{')
		.replace(/\}/g, '\\}')
		.replace(/\./g, '\\.')
		.replace(/\!/g, '\\!');
}
