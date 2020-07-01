install:
	deno install deps.ts
test:
	deno test --unstable --allow-all
run:
	deno run --unstable --allow-net --allow-read --allow-write app.ts