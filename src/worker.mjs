import { BrixResponseError, parseBrixResponse } from "./brix-response.mjs";

const BRIX_ENDPOINT = "https://api.brixhub.ru/api/v1/search";
const BRIX_TIMEOUT_MS = 20_000;
const MAX_SEARCH_SIZE = 16 * 1024;
const TEXT_FIELDS = [
  "nom_famille", "prenom",
  "date_naissance", "ville_naissance", "genre",
  "email", "telephone", "nom_utilisateur", "adresse_ip",
  "adresse", "code_postal", "ville",
  "steam_id", "fivem_license", "fivem_license2", "discord_id",
  "xbox_live_id", "live_id",
  "nir", "iban", "bic", "vin_plaque",
];
const INTEGER_FIELDS = {
  annee_naissance: [1800, 2100],
  jour_naissance: [1, 31],
  mois_naissance: [1, 12],
  page: [1, 100000],
  per_page: [1, 100],
};

function jsonResponse(status, payload) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function applyBirthDate(query) {
  const day = query.jour_naissance;
  const month = query.mois_naissance;
  const year = query.annee_naissance;
  delete query.jour_naissance;
  delete query.mois_naissance;
  delete query.annee_naissance;
  if (day === undefined && month === undefined && year === undefined) return;
  if (query.date_naissance) {
    throw Object.assign(
      new Error("Renseignez soit la date de naissance, soit le jour, le mois et l'année — pas les deux."),
      { status: 400 },
    );
  }
  if (year === undefined) {
    throw Object.assign(
      new Error("L'année de naissance est requise pour préciser le jour ou le mois de naissance."),
      { status: 400 },
    );
  }
  if (day !== undefined && month === undefined) {
    throw Object.assign(
      new Error("Le mois de naissance est requis pour préciser le jour de naissance."),
      { status: 400 },
    );
  }
  let date = String(year);
  if (month !== undefined) {
    date += `-${String(month).padStart(2, "0")}`;
    if (day !== undefined) date += `-${String(day).padStart(2, "0")}`;
  }
  query.date_naissance = date;
}

function buildQuery(body) {
  const query = {};
  for (const key of TEXT_FIELDS) {
    const raw = body[key];
    if (raw === undefined || raw === null) continue;
    const value = typeof raw === "string" ? raw.trim() : typeof raw === "number" ? String(raw) : "";
    if (value) query[key] = value.slice(0, 250);
  }

  for (const [key, [min, max]] of Object.entries(INTEGER_FIELDS)) {
    const raw = body[key];
    if (raw === undefined || raw === null || raw === "") continue;
    const value = typeof raw === "number" ? raw : Number(String(raw).trim());
    if (!Number.isInteger(value) || value < min || value > max) {
      throw Object.assign(
        new Error(`Le champ « ${key} » doit être un entier compris entre ${min} et ${max}.`),
        { status: 400 },
      );
    }
    query[key] = value;
  }

  applyBirthDate(query);
  if (body.flexible === true || body.flexible === "true") query.flexible = true;
  if (!Object.keys(query).some((key) => !["page", "per_page", "flexible"].includes(key))) {
    throw Object.assign(new Error("Renseignez au moins un critère de recherche."), { status: 400 });
  }
  return query;
}

async function handleSearch(request) {
  let body;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_SEARCH_SIZE) {
      return jsonResponse(413, { error: "La requête est trop volumineuse." });
    }
    body = JSON.parse(text);
  } catch {
    return jsonResponse(400, { error: "Le corps de la requête doit être un objet JSON valide." });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse(400, { error: "Le corps de la requête doit être un objet JSON valide." });
  }

  let query;
  try {
    query = buildQuery(body);
  } catch (error) {
    return jsonResponse(error.status || 400, { error: error.message });
  }

  try {
    const upstream = await fetch(BRIX_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(query),
      signal: AbortSignal.timeout(BRIX_TIMEOUT_MS),
    });
    const payload = await parseBrixResponse(upstream);
    return jsonResponse(upstream.status, payload);
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return jsonResponse(504, { error: "Le service de recherche n'a pas répondu à temps." });
    }
    if (error instanceof BrixResponseError) {
      return jsonResponse(502, { error: error.message });
    }
    return jsonResponse(502, { error: "Impossible de joindre le service de recherche." });
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/search") {
      if (request.method !== "POST") {
        return jsonResponse(405, { error: "Méthode non autorisée." });
      }
      return handleSearch(request);
    }
    if (pathname === "/api/lookup") {
      return jsonResponse(404, {
        error: "Endpoint inconnu.",
      });
    }
    return env.ASSETS.fetch(request);
  },
};
