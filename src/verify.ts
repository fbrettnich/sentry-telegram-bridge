export async function verifySignature(request: Request, secret: string): Promise<boolean> {
	const sentrySignature = request.headers.get('sentry-hook-signature');
	if (!sentrySignature) return false;

	const body = await request.clone().text();
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

	const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
	const digest = Array.from(new Uint8Array(signatureBuffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	return digest === sentrySignature;
}
