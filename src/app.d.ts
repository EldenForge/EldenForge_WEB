/// <reference types="@sveltejs/kit" />

declare namespace App {}

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL: string;
}
