import { handleErrorWithSentry, init } from '@sentry/sveltekit';
import { PUBLIC_SENTRY_DSN, PUBLIC_SENTRY_ENVIRONMENT } from '$env/static/public';

if (PUBLIC_SENTRY_DSN) {
	init({
		dsn: PUBLIC_SENTRY_DSN,
		environment: PUBLIC_SENTRY_ENVIRONMENT || 'dev',
		tracesSampleRate: 0,
		sendDefaultPii: false
	});
}

export const handleError = handleErrorWithSentry();
