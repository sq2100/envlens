import test from "node:test";
import assert from "node:assert/strict";
import { parseEnv, compareEnv, exampleEnv } from "../src/core.js";
test("quotes, hash comments, export, multiline and escapes", () => {
  const env = parseEnv(
    'export A="hello#world" # note\nB=plain # comment\nC="one\ntwo"\nD="x\\ny"',
  );
  assert.equal(env.get("A"), "hello#world");
  assert.equal(env.get("B"), "plain");
  assert.equal(env.get("C"), "one\ntwo");
  assert.equal(env.get("D"), "x\ny");
});
test("reports missing and empty keys without including values", () => {
  const a = parseEnv("A=\nB=\nC="),
    b = parseEnv("A=super-secret\nB=\nD=private");
  const rows = compareEnv(a, b);
  assert.deepEqual(
    rows.map((r) => r.status),
    ["Present", "Empty", "Missing", "Unexpected"],
  );
  assert.ok(!JSON.stringify(rows).includes("super-secret"));
  assert.equal(exampleEnv(a), "A=\nB=\nC=\n");
});
test("ambiguous and malformed inputs fail without echoing secret values", () => {
  for (const input of [
    "A=1\nA=secret",
    "private secret",
    'A="secret',
    'A="secret"junk',
    "A=`secret`",
  ])
    assert.throws(
      () => parseEnv(input),
      (error) => !error.message.includes("secret"),
    );
});
