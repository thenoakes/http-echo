import { assertEquals, assertNotEquals } from "https://deno.land/std/testing/asserts.ts";
import parseContentType from './utilities/content-type.ts';
const { test } = Deno;

test('Parse multipart/form-data', () => {
  
  let contentType = 'multipart/form-data;boundary=845802bb-bf56-46c0-b81b-dde440013751';
  let parsedResult = parseContentType(contentType);

  assertNotEquals(parsedResult, null);
  assertEquals(Object.keys(parsedResult!).length, 4);
  assertEquals(parsedResult?.mediaType, 'multipart/form-data');
  assertEquals(parsedResult?.type, 'multipart');
  assertEquals(parsedResult?.subType, 'form-data');
  assertEquals(Object.keys(parsedResult?.parameters!), ['boundary']);
  assertEquals(parsedResult?.parameters!['boundary'], '845802bb-bf56-46c0-b81b-dde440013751');

});

