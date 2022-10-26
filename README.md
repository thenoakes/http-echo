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

Some commands I had to run for trex

```
mkdir ~/.deno
ln -s $(asdf where deno)/.deno/bin/ ~/.deno/bin
trex install --map opine@2.1.1 io@0.101.0
deno run --unstable --allow-net --allow-read --allow-write --import-map=import_map.json app.ts
trex install --pkg thenoakes/multipart-related-parser@master/mod.ts multipart-related-parser
trex --custom assert=https://deno.land/std@0.101.0/testing/asserts.ts
```
