import { assertEquals } from "https://deno.land/std@0.101.0/testing/asserts.ts";
import Analyser from "./token-analyser.ts";
import { Group, Token } from "./content-type.ts";

const { test } = Deno;

const classifier = (character: string) => {
  const char = character.charAt(0);
  if (char === "\0") return Group.Null;
  if (/^-$/.test(char)) return Group.Hyphen;
  if (/^"$/.test(char)) return Group.Quote;
  if (/^=$/.test(char)) return Group.Equals;
  if (/^;$/.test(char)) return Group.Semicolon;
  if (/^\s$/.test(char)) return Group.Whitespace;
  if (/^\/$/.test(char)) return Group.ForwardSlash;
  if (/^[a-zA-Z]$/.test(char)) return Group.Letter;
  if (/^[0-9]$/.test(char)) return Group.Numeral;
  return Group.OtherSymbol;
};

test({
  name: "dev-test",
  ignore: false,
  fn: () => {
    const analyser = Analyser()
      .setClassifier(classifier)
      .whenTokenIs(Token.Type1)
      .fromAnyOf(Group.Letter, Group.Hyphen).toAnyOf(Group.Letter, Group.Hyphen)
      .setsToken(Token.Type1)
      .fromAnyOf(Group.Letter).toAnyOf(Group.ForwardSlash).setsToken(
        Token.TypeSep,
      )
      .whenTokenIs(Token.TypeSep)
      .fromAnyOf(Group.ForwardSlash).toAnyOf(Group.Letter).setsToken(
        Token.Type2,
      )
      .whenTokenIs(Token.Type2)
      .fromAnyOf(Group.Letter, Group.Hyphen).toAnyOf(Group.Letter, Group.Hyphen)
      .setsToken(Token.Type2)
      .fromAnyOf(Group.Letter).toAnyOf(Group.Whitespace).setsToken(Token.WS1)
      .fromAnyOf(Group.Letter).toAnyOf(Group.Semicolon).setsToken(
        Token.BeginParam,
      )
      .fromAnyOf(Group.Letter).toAnyOf(Group.Null).setsToken(Token.Terminator);

    const result = analyser.analyse("multipart/related", Token.Type1);

    assertEquals(result.length, 3);
    assertEquals(result[0], { type: "type", value: "multipart" });
    assertEquals(result[1], { type: "type-separator", value: "/" });
    assertEquals(result[2], { type: "subtype", value: "related" });
  },
});
