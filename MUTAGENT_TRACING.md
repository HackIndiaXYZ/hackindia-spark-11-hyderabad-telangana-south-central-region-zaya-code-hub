# Mutagent trace logs

Each build request creates a UUID in the browser and sends it as `X-Run-Id` to all six agents. Every API route emits JSON log events for the beginning and completion (or failure) of its Gemini stream.

The events are intentionally safe to export: they contain the run ID, agent ID, duration, input/output character counts, and any error message. They do not include the startup idea, prompts, API keys, or model output.

## Capturing a run

1. Run `npm run dev` and generate a startup package in `/build`.
2. Open the visible **Mutagent trace** panel below the progress indicator. It shows each agent's status, output size, and duration for the shared run ID.
3. Select **Download JSONL** to export the browser-side trace, then save it under `traces/` in the HackIndia submission repository. The server terminal emits matching structured events for the same run ID.

One successful package has twelve events: a `started` and `completed` event for each of the six agents. Failed runs end with a `failed` event instead.
