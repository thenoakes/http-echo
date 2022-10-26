import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.101.0/testing/asserts.ts";
import parseContentType from "./content-type.ts";
const { test } = Deno;

test({
  name: "Parse multipart/form-data",
  // ignore: true,
  fn: () => {
    const testCases = [
      'multipart/form-data;boundary="845802bb-bf56-46c0-b81b-dde440013751"',
      // Pending investigation of what is and isn't legal
      // 'multipart/form-data ;boundary="845802bb-bf56-46c0-b81b-dde440013751"',
      'multipart/form-data; boundary="845802bb-bf56-46c0-b81b-dde440013751"',
      'multipart/form-data; boundary=845802bb-bf56-46c0-b81b-dde440013751',
    ];

    for (const contentType of testCases) {
      const parsedResult = parseContentType(contentType);
      assertNotEquals(parsedResult, null);
      assertEquals(Object.keys(parsedResult!).length, 4);
      assertEquals(parsedResult?.mediaType, "multipart/form-data");
      assertEquals(parsedResult?.type, "multipart");
      assertEquals(parsedResult?.subType, "form-data");
      assertEquals(Object.keys(parsedResult?.parameters!), ["boundary"]);
      assertEquals(
        parsedResult?.parameters!["boundary"],
        "845802bb-bf56-46c0-b81b-dde440013751",
      );
    }
  },
});

test({
  name: "Parse multipart/related",
  // ignore: true,
  fn: () => {
    const testCases = [
      'multipart/related;boundary="5011e609-53d3-4e50-bcd8-0fed74545689";start="<ContentRoot>";type="text/xml";charset="UTF-8"',
      // Pending investigation of what is and isn't legal
      // 'multipart/related; boundary="5011e609-53d3-4e50-bcd8-0fed74545689"; start="<ContentRoot>"; type="text/xml"; charset=UTF-8',
      // 'multipart/related ; boundary=5011e609-53d3-4e50-bcd8-0fed74545689;start="<ContentRoot>";type=text/xml;charset="UTF-8"',
    ];

    for (const contentType of testCases) {
      const parsedResult = parseContentType(contentType);
      assertNotEquals(parsedResult, null);
      assertEquals(Object.keys(parsedResult!).length, 4);
      assertEquals(parsedResult?.mediaType, "multipart/related");
      assertEquals(parsedResult?.type, "multipart");
      assertEquals(parsedResult?.subType, "related");
      assertEquals(Object.keys(parsedResult?.parameters!).length, 4);
      assertEquals(
        parsedResult?.parameters!["boundary"],
        "5011e609-53d3-4e50-bcd8-0fed74545689",
      );
      assertEquals(parsedResult?.parameters!["start"], "<ContentRoot>");
      assertEquals(parsedResult?.parameters!["type"], "text/xml");
      assertEquals(parsedResult?.parameters!["charset"], "UTF-8");
    }
  },
});
