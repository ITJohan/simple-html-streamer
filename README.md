# Out Of Order HTML Streamer

Exports 4 functions, `html`, `suspend`, `stream` and `escapeHTML`, which enables
streaming HTML out of order.

- `html`, used for generating HTML chunks.
- `suspend`, used for generating HTML chunks asynchronously, showing a
  placeholder while loading and error if it fails.
- `stream`, used for streaming HTML chunks, typically from a server or service
  worker.
- `escapeHTML`, used for safely escaping user input to prevent XSS attacks
