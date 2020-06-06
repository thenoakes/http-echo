import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { fetchFromRaw } from './fetchFromRaw.ts';

const { test } = Deno;

const testPost = `POST /200 HTTP/1.1
Host: httpstat.us
Accept: */*
Connection: close
Content-Type: multipart/related;boundary="5011e609-53d3-4e50-bcd8-0fed74545689";start="<ContentRoot>";type="text/xml";charset="UTF-8"
Content-Length: 401

--5011e609-53d3-4e50-bcd8-0fed74545689
Content-Id: <ContentRoot>
Content-Type: text/xml; charset=UTF-8
Content-Disposition: inline

<xml />

--5011e609-53d3-4e50-bcd8-0fed74545689
Content-Id: <Content1@e-mis.com/EMISWeb/GP2GP2.2A>
Content-Transfer-Encoding: 8bit
Content-Type: application/xml; charset=UTF-8
Content-Disposition: inline

<xml />

--5011e609-53d3-4e50-bcd8-0fed74545689--`;

test('Request sends successfully', async () => {
  const fetcher = fetchFromRaw(testPost);
  const response = await fetcher();
  response.text(); // Consume the body to close the file handle
  assertEquals(response.ok, true);
  assertEquals(response.status, 200);
});
