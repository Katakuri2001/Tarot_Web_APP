import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

/**
 * OpenNext (Cloudflare Workers) build configuration.
 *
 * The app has two dynamic routes (/readings/[type] and /readings/[type]/[id]),
 * so it cannot be a static export. OpenNext runs it on the Workers runtime
 * instead, keeping the project's existing Cloudflare stack.
 *
 * No incremental cache override is configured: readings are persisted in the
 * visitor's localStorage, so there is no shared cache to warm.
 */
export default defineCloudflareConfig({});
