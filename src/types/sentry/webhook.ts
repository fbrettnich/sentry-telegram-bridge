type SentryHookResource = 'installation' | 'event_alert' | 'issue' | 'metric_alert' | 'error' | 'comment';

type SentryWebhookAction = 'triggered' | 'critical' | 'warning' | 'resolved';

type SentryWebhookInstallation = {
	uuid: string;
};

type SentryWebhookData = {
	event?: any;
	metric_alert?: any;
	description_title?: string;
	description_text?: string;
	web_url?: string;
};

type SentryWebhookActorType = 'user' | 'application';
type SentryWebhookActor = {
	id: number;
	name: string;
	type: SentryWebhookActorType;
};

type SentryWebhookBody = {
	action: SentryWebhookAction;
	installation: SentryWebhookInstallation;
	data: SentryWebhookData;
	actor: SentryWebhookActor;
};

export type {
	SentryHookResource,
	SentryWebhookBody,
	SentryWebhookAction,
	SentryWebhookInstallation,
	SentryWebhookData,
	SentryWebhookActorType,
	SentryWebhookActor,
};
