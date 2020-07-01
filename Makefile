install:
	deno install deps.ts
test:
	deno test --unstable --allow-all
run:
	deno run --allow-net --allow-write app.ts