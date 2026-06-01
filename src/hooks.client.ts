import { handleErrorWithSentry, init } from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';

if (env.PUBLIC_SENTRY_DSN) {
	init({
		dsn: env.PUBLIC_SENTRY_DSN,
		environment: env.PUBLIC_SENTRY_ENVIRONMENT || 'dev',
		tracesSampleRate: 0,
		sendDefaultPii: false
	});
}

export const handleError = handleErrorWithSentry();
