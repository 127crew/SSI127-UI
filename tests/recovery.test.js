import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const prfOutput = new Uint8Array(32).fill(127);
const context = {
  crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, JSON,
  btoa: value => Buffer.from(value, "binary").toString("base64"),
  atob: value => Buffer.from(value, "base64").toString("binary"),
  Blob, URL, setTimeout, location: { hostname: "accounts.example.test" },
  document: { createElement: () => ({ click() {} }) },
};
context.window = { PublicKeyCredential: function PublicKeyCredential() {} };
context.navigator = { credentials: {
  async create() { return { rawId: new Uint8Array([1,2,3]), getClientExtensionResults: () => ({ prf: { enabled: true } }) }; },
  async get() { return { getClientExtensionResults: () => ({ prf: { results: { first: prfOutput.buffer } } }) }; },
} };
vm.runInNewContext(fs.readFileSync(new URL("../js/lib/recovery.js", import.meta.url), "utf8"), context);
const recovery = context.window.RecoveryUtils;
const payload = { version: 1, did: "did:key:zTest", publicKey: "00", pkcs8: "AA" };

test("password recovery round-trips and detects tampering", async () => {
  const backup = await recovery.createPasswordBackup(payload, "correct horse battery staple");
  assert.deepEqual(await recovery.unlockPasswordBackup(backup, "correct horse battery staple"), payload);
  const tampered = { ...backup, ciphertext: backup.ciphertext.slice(0,-1) + (backup.ciphertext.endsWith("A") ? "B" : "A") };
  await assert.rejects(() => recovery.unlockPasswordBackup(tampered, "correct horse battery staple"));
});

test("mock WebAuthn PRF wraps and unlocks a portable wallet", async () => {
  const backup = await recovery.createPasskeyBackup(payload);
  assert.equal(backup.type, "passkey");
  assert.deepEqual(await recovery.unlockPasskeyBackup(backup), payload);
});
