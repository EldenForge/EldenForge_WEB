import { sequence } from '@sveltejs/kit/hooks';
import { handleErrorWithSentry, init, sentryHandle } from '@sentry/sveltekit';
import { env } from '$env/dynamic/private';

if (env.SENTRY_DSN) {
	init({
		dsn: env.SENTRY_DSN,
		environment: env.SENTRY_ENVIRONMENT || 'dev',
		tracesSampleRate: 0,
		sendDefaultPii: false
	});
}

export const handle = sequence(sentryHandle());
export const handleError = handleErrorWithSentry();
