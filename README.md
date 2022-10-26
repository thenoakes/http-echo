# http-echo

Beginnings of a deno port of a node app which just prints out raw incoming HTTP
requests

```
deno cache app.ts
deno run --allow-net --allow-write --allow-read app.ts
```

@ `master`:

`make test` `make run`

Endpoints:

`/ping` for healthcheck

`/raw` to just echo back the raw request

`/multipart` to (fairly pointlessly) take a multipart request apart and put it
back together :)


Other notes:

```
echo "Content of a.txt." > text-part.txt
echo "<\!DOCTYPE html><title>Content of a.html.</title>" > html-part.txt
http --offline --multipart POST :3000/multipart "file1@text-part.txt;type=text/plain" "file2@html-part.html;type=text/html" > httpie-generated-request.http
```