import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/worker.mjs";

const validQuery = { prenom: "Ada" };
const originalFetch = globalThis.fetch;

async function requestSearch(fetchImplementation, payload = validQuery) {
  globalThis.fetch = fetchImplementation;
  try {
    return await worker.fetch(new Request("https://redtrace.test/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }), { ASSETS: { fetch: () => new Response("asset") } });
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("relays a valid SearchHub JSON response", async () => {
  const response = await requestSearch(async () => new Response(
    JSON.stringify({
      status: 200,
      data: { results: [{ prenom: "Ada" }] },
      meta: { total: 1, page: 1, pages: 1 },
    }),
    { headers: { "Content-Type": "application/json" } },
  ));

  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data.results, [{ prenom: "Ada" }]);
});

test("accepts a UTF-8 BOM before an otherwise valid JSON response", async () => {
  const response = await requestSearch(async () => new Response(
    `\uFEFF${JSON.stringify({ data: { results: [] } })}`,
  ));

  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data.results, []);
});

test("returns a clear JSON error for an empty upstream response", async () => {
  const response = await requestSearch(async () => new Response(null, { status: 204 }));

  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /réponse vide/i);
});

test("returns a clear JSON error for malformed upstream JSON", async () => {
  const response = await requestSearch(async () => new Response("<html>upstream error</html>"));

  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /JSON illisible/i);
});

test("rejects valid JSON with an unexpected top-level shape", async () => {
  const response = await requestSearch(async () => new Response(JSON.stringify([])));

  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /JSON inattendue/i);
});

test("rejects responses larger than the configured limit", async () => {
  const body = " ".repeat(8 * 1024 * 1024 + 1);
  const response = await requestSearch(async () => new Response(body));

  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /dépasse la taille autorisée/i);
});

test("does not contact SearchHub when the search has no criteria", async () => {
  let called = false;
  const response = await requestSearch(async () => {
    called = true;
    return new Response("{}");
  }, { page: 1 });

  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test("rejects methods other than POST without contacting SearchHub", async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response("{}");
  };
  try {
    const response = await worker.fetch(new Request("https://redtrace.test/api/search"), {});
    assert.equal(response.status, 405);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
