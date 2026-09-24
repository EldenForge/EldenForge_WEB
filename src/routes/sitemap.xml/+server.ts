const SITE = 'https://eldenforge.fr';

const STATIC_PAGES: { path: string; changefreq: string; priority: number }[] = [
	{ path: '/', changefreq: 'daily', priority: 1.0 },
	{ path: '/build', changefreq: 'weekly', priority: 0.8 },
	{ path: '/map', changefreq: 'monthly', priority: 0.6 },
	{ path: '/codex', changefreq: 'weekly', priority: 0.7 },
	{ path: '/codex/weapons', changefreq: 'weekly', priority: 0.7 },
	{ path: '/codex/armors', changefreq: 'weekly', priority: 0.6 },
	{ path: '/codex/shields', changefreq: 'weekly', priority: 0.6 },
	{ path: '/codex/talismans', changefreq: 'weekly', priority: 0.6 },
	{ path: '/codex/sorceries', changefreq: 'weekly', priority: 0.6 },
	{ path: '/codex/incantations', changefreq: 'weekly', priority: 0.6 },
	{ path: '/codex/ashes', changefreq: 'weekly', priority: 0.6 },
	{ path: '/codex/spirits', changefreq: 'weekly', priority: 0.6 },
	{ path: '/codex/ammos', changefreq: 'weekly', priority: 0.5 }
];

interface PublicBuildListItem {
	id: string;
	author_pseudo: string;
	created_at: string;
}

function escape(s: string): string {
	return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
}

export async function GET({
	fetch,
	setHeaders
}: {
	fetch: typeof globalThis.fetch;
	setHeaders: (h: Record<string, string>) => void;
}) {
	setHeaders({
		'Content-Type': 'application/xml; charset=utf-8',
		'Cache-Control': 'public, max-age=3600'
	});

	let builds: PublicBuildListItem[] = [];
	const authors = new Set<string>();
	try {
		const res = await fetch('/api/public/builds?limit=100&sort=recent');
		if (res.ok) {
			const data = (await res.json()) as PublicBuildListItem[];
			builds = Array.isArray(data) ? data : [];
			for (const b of builds) authors.add(b.author_pseudo);
		}
	} catch {
		// Continue with static pages only
	}

	const now = new Date().toISOString().slice(0, 10);
	const entries: string[] = [];
	for (const p of STATIC_PAGES) {
		entries.push(
			`  <url>\n    <loc>${SITE}${p.path}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority.toFixed(1)}</priority>\n  </url>`
		);
	}
	for (const b of builds) {
		const lastmod = (b.created_at || now).slice(0, 10);
		entries.push(
			`  <url>\n    <loc>${SITE}/b/${escape(b.id)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
		);
	}
	for (const pseudo of authors) {
		entries.push(
			`  <url>\n    <loc>${SITE}/u/${encodeURIComponent(pseudo)}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>`
		);
	}

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
	return new Response(body);
}
