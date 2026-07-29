import type {
	APIMethodParams,
	APIMethods,
	TelegramAPIResponse,
	TelegramUpdate,
} from "@gramio/types";
import { env } from "cloudflare:workers";
import { fixLink } from "./lib";

const TOKEN = env.TG_BOT_TOKEN;
const WEBHOOK_ENDPOINT = `/webhook/${TOKEN}`;
const TBA_BASE_URL = "https://api.telegram.org/bot";

const api = new Proxy({} as APIMethods, {
	get:
		<T extends keyof APIMethods>(_target: APIMethods, method: T) =>
		async (params: APIMethodParams<T>) => {
			const response = await fetch(`${TBA_BASE_URL}${TOKEN}/${method}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(params),
			});

			const data = (await response.json()) as TelegramAPIResponse;

			if (!data.ok)
				// ><>
				throw new Error(`Some error occurred in ${method}`);

			return data.result;
		},
});

export default {
	async fetch(req, _, ctx) {
		const { pathname: path } = new URL(req.url);

		if (path === WEBHOOK_ENDPOINT && req.method === "POST") {
			const update = await req.json<TelegramUpdate>();

			const message = update.message;
			const text = message?.text;
			const entities = message?.entities;

			console.debug("message=", message, entities);

			if (message && text && entities) {
				const fixedLinks: string[] = [];

				for (const et of entities) {
					if (et.type !== "text_link") continue;

					try {
						fixedLinks.push(
							// this will throw errors on invalid links
							fixLink(et.url!),
						);
					} catch {}
				}

				if (fixedLinks.length) {
					console.debug("sendMessage", fixedLinks);

					// wait for this api call to finish
					ctx.waitUntil(
						api.sendMessage({
							chat_id: message.chat.id,
							text: fixedLinks.join("\n"),
						}),
					);
				}
			}

			return new Response(null, { status: 204 });
		}

		return new Response("nya >.<", { status: 200 });
	},
} satisfies ExportedHandler<Env>;
