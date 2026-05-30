<script lang="ts">
	interface Props {
		labels: string[];
		values: number[];
		max?: number;
		size?: number;
		rings?: number;
	}

	let { labels, values, max, size = 240, rings = 4 }: Props = $props();

	let n = $derived(labels.length);
	let computedMax = $derived(max ?? Math.max(...values, 1));
	const margin = 32;
	let cx = $derived(size / 2);
	let cy = $derived(size / 2);
	let maxR = $derived(size / 2 - margin);

	function point(i: number, r: number): { x: number; y: number } {
		const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
		return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
	}

	let gridRings = $derived(
		Array.from({ length: rings }, (_, k) => {
			const r = (maxR * (k + 1)) / rings;
			return Array.from({ length: n }, (_, i) => {
				const p = point(i, r);
				return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
			}).join(' ');
		})
	);

	let axes = $derived(Array.from({ length: n }, (_, i) => point(i, maxR)));

	let valuePoly = $derived(
		values
			.map((v, i) => {
				const r = (Math.min(Math.max(v, 0), computedMax) / computedMax) * maxR;
				const p = point(i, r);
				return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
			})
			.join(' ')
	);

	let labelPositions = $derived(Array.from({ length: n }, (_, i) => point(i, maxR + 14)));
</script>

<svg viewBox="0 0 {size} {size}" class="w-full h-auto block">
	{#each gridRings as poly}
		<polygon points={poly} fill="none" stroke="rgb(200 169 81 / 0.15)" stroke-width="1" />
	{/each}
	{#each axes as p}
		<line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgb(200 169 81 / 0.18)" stroke-width="1" />
	{/each}

	<polygon
		points={valuePoly}
		fill="rgb(200 169 81 / 0.22)"
		stroke="rgb(200 169 81 / 0.9)"
		stroke-width="1.5"
		stroke-linejoin="round"
	/>

	{#each values as v, i}
		{@const r = (Math.min(Math.max(v, 0), computedMax) / computedMax) * maxR}
		{@const p = point(i, r)}
		<circle cx={p.x} cy={p.y} r="2.5" fill="rgb(200 169 81)" />
	{/each}

	{#each labels as lbl, i}
		{@const p = labelPositions[i]}
		<text x={p.x} y={p.y} text-anchor="middle" dominant-baseline="central" class="fill-parchment/70 text-[10px] font-cinzel">
			<tspan x={p.x} dy="0">{lbl}</tspan>
			<tspan x={p.x} dy="1.1em" class="fill-gold/80">{values[i]}</tspan>
		</text>
	{/each}
</svg>
