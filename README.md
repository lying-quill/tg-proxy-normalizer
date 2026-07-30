# Telegram MTProxy Sanitizer Bot
A Telegram bot running on Cloudflare Workers, written in TypeScript, that
receives messages containing MTProxy links and sanitizes them so they work with
Telegram’s TDLib-based clients like Telegram Desktop and Telegram X.

The sanitization logic in [src/lib.ts](src/lib.ts) was reverse engineered from
the Telegram Android client source code.

## What it does
- Accepts Telegram webhook updates at `/webhook/<TG_BOT_TOKEN>`
- Detects MTProxy links in incoming messages
- Sanitizes proxy links for TDLib compatibility
- Runs entirely on Cloudflare Workers

## Worker secrets
- `TG_BOT_TOKEN`: Your bot's api token

## Webhook setup
After deploying your worker, set your Telegram bot webhook to:

```text
https://<worker-domain>/webhook/<TG_BOT_TOKEN>
```

## How it works
Incoming messages are processed by the worker, which extracts MTProxy links and
passes them through the sanitizer in `src/lib.ts`. The resulting links are
rewritten into a format compatible with Telegram clients using TDLib.

## License
Currently licensed under the [MIT license](https://mit-license.org/).
There's a copy of the [license](LICENSE) available along with the source code.
