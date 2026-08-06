/**
 * Entitlement tests.
 *
 * The signatures below are real, made by the production private key, so these
 * tests prove the shipped public key verifies what the real signer produces. The
 * product is named `fixture-only`, which no real licence uses, so a committed
 * fixture unlocks nothing. Forging a licence for a real product still needs the
 * private key, which is not in this repository.
 */
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { granted } from "../src/entitlements.mjs";
import { entitled, verifyLicence } from "../src/licence.mjs";

const LICENCES = {
  valid: "eyJwcm9kdWN0IjoiZml4dHVyZS1vbmx5IiwiZXhwaXJlcyI6NDA3MDkwODgwMDAwMCwiaXNzdWVkIjoxNzg1ODg4MDAwMDAwfQ.EjkzyxgHISOMu7DjR4NA_W5dpP4cN8oNeNAR0Xa4tH1wTdKTDk1mqfFHpEKJjBngUTTEAcjUfU0nbiJmMwqoDw",
  expired: "eyJwcm9kdWN0IjoiZml4dHVyZS1vbmx5IiwiZXhwaXJlcyI6MTU5MjE3OTIwMDAwMH0.9l22kfqSQYIyAC0fuK9hH6Bv6jYI-Ga3L3_o9lsuyRKyGFKME5d38TGJHEMHltso8V_ZLDDeZUuOyoqUYC7SCQ",
  twoProducts: "eyJwcm9kdWN0IjpbImZpeHR1cmUtb25seSIsImZpeHR1cmUtZXh0cmEiXSwiZXhwaXJlcyI6NDA3MDkwODgwMDAwMH0.onHKWU17_0k25RmCvZuppip0cQE6EsivP-7RlLPOFWf9I9lyD9hFMUD8hqhvvTo_wRQrwxwKtgf0ljTOg9xgBw",
  noExpiry: "eyJwcm9kdWN0IjoiZml4dHVyZS1vbmx5In0.XAhnCi3sCPb0v61alZBu9gIemddeu9T423fcr2Gqekr6bzg4pexPv0gCbe7Xg6yHPvdGcNQcipFjzsWOLtgWDA",
  noProduct: "eyJleHBpcmVzIjo0MDcwOTA4ODAwMDAwfQ.9_ZC80gjWitRmUIYog5gDD0RP8NJBUUlayhofLAmUpzhM2-0tm9RRQJds90s6Y9zzHwFWYiGzpIWor0ybjUyBw",
};

test("a licence signed by the real key verifies against the shipped public key", () => {
  const seen = verifyLicence(LICENCES.valid);
  assert.equal(seen.ok, true, seen.reason);
  assert.equal(seen.payload.product, "fixture-only");
});

test("a flipped signature byte is rejected, so a licence cannot be forged", () => {
  // Same payload, one character changed in the signature.
  const [body, signature] = LICENCES.valid.split(".");
  const flipped = signature[0] === "A" ? `B${signature.slice(1)}` : `A${signature.slice(1)}`;
  const seen = verifyLicence(`${body}.${flipped}`);
  assert.equal(seen.ok, false);
  assert.match(seen.reason, /was not issued by us/);
});

test("a payload swapped under a real signature is rejected", () => {
  // The attack that matters: take our signature, upgrade the product yourself.
  const signature = LICENCES.valid.split(".")[1];
  const richer = Buffer.from(JSON.stringify({ product: "watch", expires: 4102444800000 })).toString("base64url");
  const seen = verifyLicence(`${richer}.${signature}`);
  assert.equal(seen.ok, false);
  assert.match(seen.reason, /was not issued by us/);
});

test("an expired licence says so, and says when", () => {
  const seen = verifyLicence(LICENCES.expired);
  assert.equal(seen.ok, false);
  assert.equal(seen.expired, true);
  assert.match(seen.reason, /expired on 2020-06-15/);
});

test("a licence with no expiry is refused rather than treated as forever", () => {
  assert.match(verifyLicence(LICENCES.noExpiry).reason, /no expiry/);
});

test("a licence naming no product is refused", () => {
  assert.match(verifyLicence(LICENCES.noProduct).reason, /names no product/);
});

test("junk is named as junk instead of failing as a signature error", () => {
  assert.match(verifyLicence("not-a-token").reason, /not a licence token/);
  assert.match(verifyLicence("a.b.c").reason, /malformed/);
  assert.match(verifyLicence(undefined).reason, /not a licence token/);
});

test("entitled reads MARGYN_LICENCE and gates on the product name", () => {
  const env = { MARGYN_LICENCE: LICENCES.valid };
  assert.equal(entitled("fixture-only", env).ok, true);
  const wrong = entitled("watch", env);
  assert.equal(wrong.ok, false);
  assert.match(wrong.reason, /covers fixture-only, not watch/);
});

test("Team grants the paid check, a service grants nothing in the binary", () => {
  // The CLI asks one question: does this licence cover "watch". So a Team
  // purchase has to expand into that or somebody who bought the larger plan
  // finds the paid check locked, which is the worst possible bug to ship in a
  // billing path.
  assert.deepEqual(granted(["watch"]), ["watch"]);
  assert.deepEqual(granted(["team"]).sort(), ["team", "watch"]);
  assert.ok(!granted(["fixflow"]).includes("watch"), "a service must not unlock the binary");
  assert.deepEqual(granted(["team", "watch"]).sort(), ["team", "watch"], "no duplicates");
  // An id created after this build shipped still names what was bought.
  assert.deepEqual(granted(["enterprise"]), ["enterprise"]);
  assert.deepEqual(granted([]), []);
});

test("a licence can cover several products at once", () => {  const env = { MARGYN_LICENCE: LICENCES.twoProducts };
  assert.equal(entitled("fixture-only", env).ok, true);
  assert.equal(entitled("fixture-extra", env).ok, true);
  assert.equal(entitled("watch", env).ok, false);
});

test("entitled finds the licence file on disk when the environment is empty", () => {
  const home = mkdtempSync(join(tmpdir(), "margyn-home-"));
  try {
    mkdirSync(join(home, ".margyn"));
    // Trailing newline on purpose: a file written by an editor has one.
    writeFileSync(join(home, ".margyn", "licence"), `${LICENCES.valid}\n`);
    const found = entitled("fixture-only", { MARGYN_HOME: home });
    assert.equal(found.ok, true, found.reason);
    assert.match(found.source, /\.margyn\/licence$/);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("no licence anywhere is a named refusal, not a crash", () => {
  const found = entitled("watch", { MARGYN_HOME: join(tmpdir(), "margyn-absent-home") });
  assert.equal(found.ok, false);
  assert.equal(found.reason, "no licence found");
});
