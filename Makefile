install:
	deno install deps.ts
test:
	deno test --unstable --allow-all --import-map=import_map.json
run:
	deno run --unstable --allow-net --allow-read --allow-write --import-map=import_map.json app.ts