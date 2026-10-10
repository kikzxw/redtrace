export const MAX_BRIX_RESPONSE_SIZE = 8 * 1024 * 1024;

export class BrixResponseError extends Error {
  constructor(message) {
    super(message);
    this.name = "BrixResponseError";
  }
}

export async function parseBrixResponse(response) {
  if (response.status === 204 || response.status === 205) {
    throw new BrixResponseError("Le service de recherche a renvoyé une réponse vide.");
  }

  const reader = response.body?.getReader();
  let text = "";
  if (reader) {
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BRIX_RESPONSE_SIZE) {
          await reader.cancel();
          throw new BrixResponseError("La réponse du service de recherche dépasse la taille autorisée.");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    text = new TextDecoder().decode(bytes);
  } else {
    text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BRIX_RESPONSE_SIZE) {
      throw new BrixResponseError("La réponse du service de recherche dépasse la taille autorisée.");
    }
  }

  const normalizedText = text.replace(/^\uFEFF/, "").trim();
  if (!normalizedText) {
    throw new BrixResponseError("Le service de recherche a renvoyé une réponse vide.");
  }

  let payload;
  try {
    payload = JSON.parse(normalizedText);
  } catch {
    throw new BrixResponseError("Le service de recherche a renvoyé une réponse JSON illisible.");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new BrixResponseError("Le service de recherche a renvoyé une réponse JSON inattendue.");
  }
  return payload;
}
