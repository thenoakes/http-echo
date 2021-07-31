# http-echo

Beginnings of a deno port of a node app which just prints out raw incoming HTTP
requests

```
deno run --allow-net --allow-write app.ts
```

@ `master`:

`make test` `make run`

Endpoints:

`/ping` for healthcheck

`/raw` to just echo back the raw request

`/multipart` to (fairly pointlessly) take a multipart request apart and put it
back together :)
