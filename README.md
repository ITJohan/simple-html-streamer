# Out Of Order HTML Streamer

Exports 3 functions, `html`, `suspend` and `stream`, which makes it possible to
stream HTML out of order.

- `html`, used for generating HTML chunks.
- `suspend`, used for generating HTML chunks asynchronously, showing a
  placeholder while loading and error if it fails.
- `stream`, used for streaming HTML chunks, typically from a server or service
  worker.
