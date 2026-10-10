const views = ["overview", "brix", "history"];
const viewTitles = {
  overview: "Vue d'ensemble",
  brix: "Recherche",
  history: "Activité récente",
};
const activity = [];

function showView(name) {
  for (const view of views) {
    document.querySelector(`#view-${view}`).classList.toggle("active", view === name);
  }
  document.querySelector("#breadcrumb-current").textContent = viewTitles[name];
  document.querySelectorAll(".nav-item").forEach((button) => {
    const isActive = button.dataset.view === name;
    button.classList.toggle("active", isActive);
    if (isActive) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (name === "history") renderActivity();
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatValue(value) {
  if (Array.isArray(value)) return value.length ? value.map(formatValue).join("\n") : "Aucun enregistrement";
  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, item]) => `${key}: ${formatValue(item)}`).join(" · ");
  }
  return String(value);
}

const brixFieldGroups = [
  {
    title: "Identité",
    fields: [
      ["nom_famille", "Nom", "text", {}, "Ex. Martin"],
      ["prenom", "Prénom", "text", {}, "Ex. Marie"],
    ],
  },
  {
    title: "Naissance",
    fields: [
      ["jour_naissance", "Jour (1-31)", "number", { min: 1, max: 31 }, "Ex. 14"],
      ["mois_naissance", "Mois (1-12)", "number", { min: 1, max: 12 }, "Ex. 6"],
      ["annee_naissance", "Année de naissance", "number", { min: 1800, max: 2100 }, "Ex. 1990"],
      ["date_naissance", "Date de naissance", "date"],
      ["ville_naissance", "Ville de naissance", "text", {}, "Ex. Lyon"],
      ["genre", "Genre (m ou f)", "select", { options: [["", "Non précisé"], ["m", "Homme (m)"], ["f", "Femme (f)"]] }],
    ],
  },
  {
    title: "Contact",
    fields: [
      ["email", "E-mail", "email", {}, "Ex. prenom.nom@mail.fr"],
      ["telephone", "Numéro", "tel", {}, "Ex. +33 6 12 34 56 78"],
      ["nom_utilisateur", "Nom d'utilisateur", "text", {}, "Ex. pseudo"],
      ["adresse_ip", "Adresse IP", "text", {}, "Ex. 203.0.113.10"],
    ],
  },
  {
    title: "Localisation",
    fields: [
      ["adresse", "Adresse", "text", {}, "Ex. 12 rue des Lilas"],
      ["code_postal", "Code postal", "text", {}, "Ex. 75011"],
      ["ville", "Ville", "text", {}, "Ex. Paris"],
    ],
  },
  {
    title: "Apps",
    fields: [
      ["steam_id", "Steam ID", "text", {}, "Ex. 76561198000000000"],
      ["fivem_license", "FiveM license", "text", {}, "Ex. license:…"],
      ["discord_id", "Discord ID", "text", {}, "Ex. 123456789012345678"],
      ["xbox_live_id", "Xbox Live (XBL)", "text", {}, "Ex. xuid:…"],
      ["live_id", "Live ID", "text", {}, "Ex. live:…"],
      ["fivem_license2", "FiveM license2", "text", {}, "Ex. license2:…"],
    ],
  },
  {
    title: "Champs avancés",
    fields: [
      ["nir", "NIR (sécu)", "text", {}, "Ex. 1 85 05 78 006 084 32"],
      ["iban", "IBAN", "text", {}, "Ex. FR76 3000 4408 0000 0123 4567 890"],
      ["bic", "BIC", "text", {}, "Ex. BNPAFRPP"],
      ["vin_plaque", "VIN / Plaque", "text", {}, "Ex. VF1AAAAA… ou AB-123-CD"],
    ],
  },
  {
    title: "Pagination & options",
    fields: [
      ["page", "Page", "number", { min: 1 }],
      ["per_page", "Résultats par page", "number", { min: 1, max: 100 }],
      ["flexible", "Recherche approximative (flexible)", "checkbox"],
    ],
  },
];

const brixFieldOrder = brixFieldGroups.flatMap((group) => group.fields.map(([key]) => key));

const brixLabels = {
  nom_famille: "Nom de famille",
  prenom: "Prénom",
  nom_naissance: "Nom de naissance",
  nom_affichage: "Nom d'affichage",
  nom_utilisateur: "Nom d'utilisateur",
  genre: "Genre",
  civilite: "Civilité",
  date_naissance: "Date de naissance",
  annee_naissance: "Année de naissance",
  jour_naissance: "Jour de naissance",
  mois_naissance: "Mois de naissance",
  email: "E-mail",
  telephone: "Téléphone",
  mobile: "Mobile",
  adresse_ip: "Adresse IP",
  discord_id: "Discord ID",
  adresse: "Adresse",
  complement_adresse: "Complément d'adresse",
  ville: "Ville",
  code_postal: "Code postal",
  departement: "Département",
  region: "Région",
  pays: "Pays",
  ville_naissance: "Ville de naissance",
  lieu_naissance: "Lieu de naissance",
  societe: "Société",
  profession: "Profession",
  fonction: "Fonction",
  siret: "SIRET",
  siren: "SIREN",
  marque: "Marque",
  modele: "Modèle",
  vin_plaque: "VIN / plaque",
  immatriculation: "Immatriculation",
  numero_serie: "Numéro de série",
  iban: "IBAN",
  bic: "BIC",
  nir: "NIR (sécu)",
  steam_id: "Steam ID",
  fivem_license: "FiveM license",
  fivem_license2: "FiveM license 2",
  fivem_id: "FiveM ID",
  xbox_live_id: "Xbox Live ID",
  live_id: "Live ID",
  page: "Page",
  per_page: "Résultats par page",
  flexible: "Recherche approximative",
  status: "Statut HTTP",
  message: "Message",
  timestamp: "Horodatage",
  total: "Total de résultats",
  total_raw: "Total brut",
  total_is_capped: "Total plafonné",
  total_pending: "Total en attente",
  pages: "Nombre de pages",
  query: "Requête",
  took_ms: "Durée totale (ms)",
  count_took_ms: "Durée de comptage (ms)",
  cached: "Réponse en cache",
  maintenance: "Mode maintenance",
  results: "Résultats",
  _all_text: "Texte complet indexé",
  _confidence: "Score de confiance",
  _dedup_key: "Clé de déduplication",
  _es_ids: "Identifiants sources",
  _source_files: "Fichiers sources",
  _sources: "Sources",
};

function brixLabel(key) {
  return brixLabels[key] || key;
}

function renderBrixForm() {
  const container = document.querySelector("#brix-fields");
  container.replaceChildren();

  for (const [index, group] of brixFieldGroups.entries()) {
    const section = element("section", "field-group");
    const heading = element("h3", "field-group-heading");
    const head = element("button", "field-group-head");
    head.type = "button";
    head.setAttribute("aria-expanded", "false");
    head.setAttribute("aria-controls", `brix-group-content-${index}`);
    head.append(
      element("span", "field-group-title", group.title),
      element("span", "field-group-count", `${group.fields.length} CHAMP${group.fields.length === 1 ? "" : "S"}`),
    );
    heading.append(head);
    section.append(heading);

    const content = element("div", "field-group-content");
    content.id = `brix-group-content-${index}`;
    content.setAttribute("aria-hidden", "true");
    content.inert = true;
    const grid = element("div", "field-grid");
    for (const [key, label, type = "text", attrs = {}, placeholder] of group.fields) {
      if (type === "checkbox") {
        const check = element("label", "field-check");
        check.dataset.brixField = "";
        check.dataset.search = `${label} ${key}`.toLocaleLowerCase("fr");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = key;
        check.append(input, element("span", "", label));
        grid.append(check);
        continue;
      }
      const field = element("label", "field");
      field.dataset.brixField = "";
      field.dataset.search = `${label} ${key}`.toLocaleLowerCase("fr");
      field.title = `Champ : ${key}`;
      const headLabel = element("span");
      headLabel.append(document.createTextNode(label.toUpperCase()));
      if (type === "select") {
        const select = document.createElement("select");
        select.name = key;
        select.autocomplete = "off";
        for (const [value, text] of attrs.options || []) {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = text;
          select.append(option);
        }
        field.append(headLabel, select);
        grid.append(field);
        continue;
      }
      const input = document.createElement("input");
      input.type = type;
      input.name = key;
      input.autocomplete = "off";
      input.spellcheck = false;
      if (placeholder) input.placeholder = placeholder;
      for (const [attribute, value] of Object.entries(attrs)) input.setAttribute(attribute, value);
      field.append(headLabel, input);
      grid.append(field);
    }
    content.append(grid);
    section.append(content);
    container.append(section);
  }

  container.addEventListener("click", (event) => {
    const button = event.target.closest(".field-group-head");
    if (!button || !container.contains(button)) return;
    setBrixGroupOpen(button.closest(".field-group"), button.getAttribute("aria-expanded") !== "true");
  });
}

function setBrixGroupOpen(group, open) {
  const button = group.querySelector(".field-group-head");
  const content = group.querySelector(".field-group-content");
  const isOpen = button.getAttribute("aria-expanded") === "true";
  if (isOpen === open) return;

  group.classList.toggle("is-open", open);
  if (open) {
    for (const sibling of group.parentElement.querySelectorAll(".field-group")) {
      if (sibling !== group) setBrixGroupOpen(sibling, false);
    }
    button.setAttribute("aria-expanded", "true");
    content.setAttribute("aria-hidden", "false");
    content.inert = false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      content.style.maxHeight = "none";
      return;
    }
    content.style.maxHeight = `${content.scrollHeight}px`;
    content.addEventListener("transitionend", () => {
      if (button.getAttribute("aria-expanded") === "true") content.style.maxHeight = "none";
    }, { once: true });
    return;
  }

  content.style.maxHeight = `${content.scrollHeight}px`;
  button.setAttribute("aria-expanded", "false");
  content.setAttribute("aria-hidden", "true");
  content.inert = true;
  requestAnimationFrame(() => {
    if (button.getAttribute("aria-expanded") === "false") content.style.maxHeight = "0px";
  });
}

function collectBrixPayload() {
  const payload = {};
  let criteria = 0;
  for (const input of document.querySelectorAll("#brix-fields input[name], #brix-fields select[name]")) {
    if (input.type === "checkbox") {
      if (input.checked) payload[input.name] = true;
      continue;
    }
    const value = input.value.trim();
    if (!value) continue;
    payload[input.name] = input.type === "number" ? Number(value) : value;
    if (!["page", "per_page", "flexible"].includes(input.name)) criteria += 1;
  }
  return { payload, criteria };
}

function birthDateError(payload) {
  const parts = ["jour_naissance", "mois_naissance", "annee_naissance"];
  const hasPart = parts.some((key) => payload[key] !== undefined);
  if (!hasPart) return "";
  if (payload.date_naissance) {
    return "Renseignez soit la date de naissance, soit le jour, le mois et l'année — pas les deux.";
  }
  if (payload.annee_naissance === undefined) {
    return "L'année de naissance est requise pour préciser le jour ou le mois de naissance.";
  }
  if (payload.jour_naissance !== undefined && payload.mois_naissance === undefined) {
    return "Le mois de naissance est requis pour préciser le jour de naissance.";
  }
  return "";
}

function updateBrixControls() {
  const filter = document.querySelector("#brix-field-filter").value.trim().toLocaleLowerCase("fr");
  let criteria = 0;
  const visibleGroups = [];

  for (const group of document.querySelectorAll(".field-group")) {
    let visibleFields = 0;
    for (const field of group.querySelectorAll("[data-brix-field]")) {
      const visible = !filter || field.dataset.search.includes(filter);
      field.classList.toggle("hidden", !visible);
      if (visible) visibleFields += 1;
      const input = field.querySelector("input, select");
      if (input?.name && !["page", "per_page", "flexible"].includes(input.name)) {
        if (input.type === "checkbox" ? input.checked : Boolean(input.value.trim())) criteria += 1;
      }
    }
    group.classList.toggle("hidden", visibleFields === 0);
    if (visibleFields > 0) visibleGroups.push(group);
  }

  if (filter && visibleGroups.length) {
    const openGroup = visibleGroups.find((group) => group.querySelector(".field-group-head").getAttribute("aria-expanded") === "true")
      || visibleGroups[0];
    setBrixGroupOpen(openGroup, true);
    for (const group of visibleGroups) {
      if (group !== openGroup) setBrixGroupOpen(group, false);
    }
  }

  const count = document.querySelector("#brix-criteria-count");
  count.textContent = `${criteria} critère${criteria === 1 ? "" : "s"} renseigné${criteria === 1 ? "" : "s"}`;
}

function brixQueryTitle(query) {
  const parts = Object.entries(query || {})
    .filter(([key]) => !["page", "per_page", "flexible"].includes(key))
    .slice(0, 3)
    .map(([key, value]) => `${brixLabel(key)} : ${value}`);
  return parts.length ? parts.join(" · ") : "Recherche";
}

function sortBrixEntries(record) {
  const displayPriority = [
    "nom_affichage", "prenom", "nom_famille", "nom_utilisateur", "email",
    "telephone", "mobile", "adresse", "ville", "pays",
  ];
  const order = new Map([...new Set([...displayPriority, ...brixFieldOrder])].map((key, index) => [key, index]));
  const rank = (key) => order.get(key) ?? Number.MAX_SAFE_INTEGER;
  return Object.entries(record).sort(([keyA], [keyB]) => rank(keyA) - rank(keyB));
}

function hasDisplayValue(value) {
  return value !== undefined
    && value !== null
    && value !== ""
    && !(Array.isArray(value) && value.length === 0)
    && !(typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0);
}

function brixResultCard(record, index) {
  const fields = sortBrixEntries(record || {}).filter(([key, value]) =>
    brixFieldOrder.includes(key)
    && !["page", "per_page", "flexible"].includes(key)
    && hasDisplayValue(value));
  const card = element("article", "brix-result-card");
  const heading = element("div", "brix-result-card-heading");
  const fieldValue = (key) => fields.find(([field]) => field === key)?.[1];
  const displayName = fieldValue("nom_affichage");
  const personalNameFields = ["prenom", "nom_famille"].filter((key) =>
    typeof fieldValue(key) === "string" && fieldValue(key).trim());
  const personalName = personalNameFields.map(fieldValue).join(" ");
  const username = fieldValue("nom_utilisateur");
  const email = fieldValue("email");
  const title = displayName || personalName || username || email || `Résultat ${index + 1}`;
  const titleFields = displayName
    ? ["nom_affichage"]
    : personalName
      ? personalNameFields
      : username
        ? ["nom_utilisateur"]
        : email
          ? ["email"]
          : [];
  heading.append(
    element("span", "brix-result-number", String(index + 1).padStart(2, "0")),
    element("h4", "brix-result-name", title),
  );
  card.append(heading);

  const additionalFields = fields.filter(([key]) => !titleFields.includes(key));
  const primaryFields = additionalFields.slice(0, 8);
  const extraFields = additionalFields.slice(8);
  const renderFields = (container, entries) => {
    for (const [key, value] of entries) {
      const row = element("div", "brix-result-field");
      row.append(
        element("span", "brix-result-label", brixLabel(key)),
        element("span", "brix-result-value", formatValue(value)),
      );
      container.append(row);
    }
  };

  const fieldGrid = element("div", "brix-result-fields");
  renderFields(fieldGrid, primaryFields);
  card.append(fieldGrid);

  if (extraFields.length) {
    const more = element("details", "brix-result-more");
    const summary = element("summary", "", `Afficher ${extraFields.length} autre${extraFields.length === 1 ? "" : "s"} champ${extraFields.length === 1 ? "" : "s"}`);
    const extraGrid = element("div", "brix-result-fields brix-result-extra");
    renderFields(extraGrid, extraFields);
    more.append(summary, extraGrid);
    card.append(more);
  }
  if (!fields.length) {
    card.append(element("p", "brix-result-empty", "Aucun champ exploitable dans ce résultat."));
  }
  return card;
}

function brixPagerRow(page, pages, search) {
  const row = element("div", "pager-row");
  const previous = element("button", "pager-button", `← Page ${page - 1}`);
  previous.type = "button";
  previous.disabled = page <= 1;
  previous.addEventListener("click", () => brixSearch({ ...search, page: page - 1 }, document.querySelector("#brix-submit")));
  const next = element("button", "pager-button", `Page ${page + 1} →`);
  next.type = "button";
  next.disabled = page >= pages;
  next.addEventListener("click", () => brixSearch({ ...search, page: page + 1 }, document.querySelector("#brix-submit")));
  row.append(previous, next);
  return row;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function brixErrorMessage(payload, statusCode) {
  const candidates = [payload?.error, payload?.message, payload?.detail];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    if (isPlainObject(candidate) && typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message.trim();
    }
  }
  return `La recherche a échoué (HTTP ${statusCode}).`;
}

function safeResponseNumber(value, minimum) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(number) && number >= minimum ? number : null;
}

function normalizeBrixResponse(payload, statusCode, search) {
  if (!isPlainObject(payload)) {
    return { error: "Le service de recherche a renvoyé une réponse JSON inattendue." };
  }

  const apiStatus = payload.status;
  const apiFailed = payload.success === false
    || apiStatus === "error"
    || (typeof apiStatus === "number" && apiStatus >= 400)
    || Boolean(payload.error);
  if (statusCode < 200 || statusCode >= 300 || apiFailed) {
    return { error: brixErrorMessage(payload, statusCode) };
  }

  const data = isPlainObject(payload.data) ? payload.data : {};
  const rawResults = Array.isArray(data.results)
    ? data.results
    : Array.isArray(payload.results)
      ? payload.results
      : null;
  if (!rawResults) {
    return { error: "Le service de recherche a renvoyé un JSON valide, mais sans liste de résultats exploitable." };
  }

  const results = rawResults.filter(isPlainObject);
  const meta = isPlainObject(payload.meta) ? payload.meta : {};
  const pages = safeResponseNumber(meta.pages, 1) || 1;
  const requestedPage = safeResponseNumber(meta.page ?? search.page, 1) || 1;
  const page = Math.min(requestedPage, pages);
  const total = safeResponseNumber(meta.total, 0) ?? rawResults.length;
  return {
    data: { results },
    invalidResults: rawResults.length - results.length,
    meta: {
      page,
      pages,
      total,
      query: isPlainObject(meta.query) ? meta.query : search,
    },
  };
}

function renderBrixResult(payload, statusCode = 200, search = {}) {
  const panel = document.querySelector("#brix-result-panel");
  const statusBadge = document.querySelector("#brix-result-status");
  const normalized = normalizeBrixResponse(payload, statusCode, search);
  const ok = !normalized.error;
  panel.classList.remove("hidden");
  statusBadge.className = `result-status ${ok ? "success" : "error"}`;
  statusBadge.textContent = ok ? "TERMINÉ" : "ERREUR";
  document.querySelector("#brix-result-title").textContent = brixQueryTitle(normalized.meta?.query || search);

  const summary = document.querySelector("#brix-result-summary");
  const sections = document.querySelector("#brix-result-sections");
  summary.replaceChildren();
  sections.replaceChildren();

  if (!ok) {
    summary.append(element("div", "result-error", normalized.error));
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const { data, meta, invalidResults } = normalized;
  const { results } = data;
  const { total, page, pages } = meta;

  const chips = [
    `${total} RÉSULTAT${total === 1 ? "" : "S"}`,
    `PAGE ${page} / ${pages}`,
  ];
  for (const text of chips) summary.append(element("div", "summary-chip", text));
  if (pages > 1) summary.append(brixPagerRow(page, pages, search));

  const resultsSection = element("section", "result-section brix-results");
  const resultsHeading = element("div", "brix-results-heading");
  resultsHeading.append(
    element("h3", "result-section-title", "Résultats"),
    element("span", "brix-results-count", `${results.length} AFFICHÉ${results.length === 1 ? "" : "S"}`),
  );
  resultsSection.append(resultsHeading);

  if (!results.length) {
    resultsSection.append(element(
      "p",
      "brix-result-empty",
      invalidResults
        ? "La réponse ne contenait aucun résultat exploitable."
        : "Aucun résultat pour ces critères.",
    ));
  } else {
    const resultList = element("div", "brix-result-list");
    for (const [index, record] of results.slice(0, 50).entries()) {
      resultList.append(brixResultCard(record, index));
    }
    resultsSection.append(resultList);
    if (invalidResults) {
      resultsSection.append(element("div", "result-note", `${invalidResults} entrée(s) ignorée(s), car leur format JSON était inattendu.`));
    }
    if (results.length > 50) {
      resultsSection.append(element("div", "result-note", `${results.length - 50} résultat(s) supplémentaires non affichés — réduisez « Résultats par page ».`));
    }
  }
  sections.append(resultsSection);

  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function readJsonResponse(response, serviceName) {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`${serviceName} a renvoyé une réponse vide (HTTP ${response.status}).`);
  }
  try {
    const payload = JSON.parse(text.replace(/^\uFEFF/, ""));
    if (!isPlainObject(payload)) throw new Error("JSON object expected");
    return payload;
  } catch {
    throw new Error(`${serviceName} a renvoyé une réponse JSON invalide ou inattendue (HTTP ${response.status}).`);
  }
}

async function brixSearch(payload, button) {
  button.disabled = true;
  const buttonLabel = button.querySelector(".button-label");
  const initialText = buttonLabel?.textContent;
  if (buttonLabel) buttonLabel.textContent = "Recherche en cours…";
  document.querySelector("#brix-form-error").classList.add("hidden");
  const panel = document.querySelector("#brix-result-panel");
  panel.classList.remove("hidden");
  document.querySelector("#brix-result-title").textContent = brixQueryTitle(payload);
  document.querySelector("#brix-result-status").className = "result-status";
  document.querySelector("#brix-result-status").textContent = "EN COURS";
  document.querySelector("#brix-result-summary").replaceChildren(element("div", "result-note", "Recherche en cours…"));
  document.querySelector("#brix-result-sections").replaceChildren();

  let statusCode = 502;
  let data = {};
  try {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
    statusCode = response.status;
    data = await readJsonResponse(response, "Le service de recherche");
  } catch (error) {
    data = { error: error.message || "Impossible de joindre le serveur." };
  } finally {
    button.disabled = false;
    if (buttonLabel) buttonLabel.textContent = initialText;
  }

  const criteria = Object.keys(payload).filter((key) => !["page", "per_page", "flexible"].includes(key)).length;
  activity.push({
    target: brixQueryTitle(payload),
    timestamp: Date.now(),
    time: new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
    ok: statusCode >= 200 && statusCode < 300 && !data?.error,
    detail: `${criteria} CRITÈRE${criteria === 1 ? "" : "S"} · BRIX`,
  });
  renderActivity();
  renderBrixResult(data, statusCode, payload);
}

function renderActivityList(container, emptyMessage) {
  container.replaceChildren();
  if (activity.length === 0) {
    const empty = element("div", "empty-state");
    empty.append(
      element("span", "empty-symbol", "◷"),
      element("strong", "", emptyMessage),
      element("p", "", "Lancez une analyse pour voir son activité ici."),
    );
    container.append(empty);
    return;
  }

  for (const item of [...activity].reverse().slice(0, 20)) {
    const row = element("div", "activity-item");
    const icon = element("span", "activity-icon", "⌕");
    const main = element("div", "activity-main");
    main.append(
      element("div", "activity-title", item.target),
      element("div", "activity-meta", `${item.time} · ${item.detail || "DNS + TLS"}`),
    );
    row.append(icon, main, element("span", `activity-badge ${item.ok ? "" : "error"}`, item.ok ? "TERMINÉ" : "ERREUR"));
    container.append(row);
  }
}

function renderSearchChart() {
  const container = document.querySelector("#search-chart");
  const totalLabel = document.querySelector("#search-chart-total");
  if (!container || !totalLabel) return;

  const now = new Date();
  const currentHour = new Date(now);
  currentHour.setMinutes(0, 0, 0);
  const buckets = Array.from({ length: 12 }, (_, index) => {
    const start = new Date(currentHour);
    start.setHours(currentHour.getHours() - (11 - index));
    return { start, count: 0 };
  });

  for (const item of activity) {
    const timestamp = Number(item.timestamp);
    if (!Number.isFinite(timestamp)) continue;
    const hour = new Date(timestamp);
    hour.setMinutes(0, 0, 0);
    const bucket = buckets.find(({ start }) => start.getTime() === hour.getTime());
    if (bucket) bucket.count += 1;
  }

  const count = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const maximum = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const width = 720;
  const height = 210;
  const plot = { left: 48, top: 16, right: 704, bottom: 163 };
  const plotHeight = plot.bottom - plot.top;
  const plotWidth = plot.right - plot.left;
  const slotWidth = plotWidth / buckets.length;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("aria-hidden", "true");

  const addSvgElement = (tag, attributes, text) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    if (text) node.textContent = text;
    svg.append(node);
    return node;
  };

  const tickCount = Math.min(3, maximum);
  for (let tick = 0; tick <= tickCount; tick += 1) {
    const value = Math.round(maximum * tick / tickCount);
    const y = plot.bottom - value / maximum * plotHeight;
    addSvgElement("line", { x1: plot.left, x2: plot.right, y1: y, y2: y, class: "search-chart-grid" });
    addSvgElement("text", { x: plot.left - 10, y: y + 4, "text-anchor": "end", class: "search-chart-axis" }, String(value));
  }

  buckets.forEach((bucket, index) => {
    const barHeight = bucket.count ? Math.max(3, bucket.count / maximum * plotHeight) : 2;
    const barWidth = Math.min(28, slotWidth * .5);
    const x = plot.left + slotWidth * index + (slotWidth - barWidth) / 2;
    const y = plot.bottom - barHeight;
    const rect = addSvgElement("rect", {
      x,
      y,
      width: barWidth,
      height: barHeight,
      rx: 3,
      class: `search-chart-bar${index === buckets.length - 1 ? " current" : ""}${bucket.count ? " has-value" : ""}`,
    });
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `${new Intl.DateTimeFormat("fr-FR", { hour: "2-digit" }).format(bucket.start)} · ${bucket.count} recherche${bucket.count === 1 ? "" : "s"}`;
    rect.append(title);

    if (index % 3 === 0 || index === buckets.length - 1) {
      addSvgElement(
        "text",
        { x: x + barWidth / 2, y: plot.bottom + 23, "text-anchor": "middle", class: "search-chart-axis search-chart-time" },
        new Intl.DateTimeFormat("fr-FR", { hour: "2-digit" }).format(bucket.start),
      );
    }
  });

  if (count === 0) {
    addSvgElement("text", { x: width / 2, y: 93, "text-anchor": "middle", class: "search-chart-empty" }, "Lancez une recherche pour voir votre activité");
  }

  container.replaceChildren(svg);
  container.setAttribute(
    "aria-label",
    count
      ? `${count} recherche${count === 1 ? "" : "s"} effectuée${count === 1 ? "" : "s"} au cours des douze dernières heures.`
      : "Aucune recherche effectuée au cours des douze dernières heures.",
  );
  totalLabel.textContent = `${count} RECHERCHE${count === 1 ? "" : "S"} · 12 H`;
}

function renderActivity() {
  document.querySelector("#stat-searches").textContent = String(activity.length).padStart(2, "0");
  renderSearchChart();
  document.querySelector("#history-count").textContent = `${String(activity.length).padStart(2, "0")} ENTRÉE${activity.length === 1 ? "" : "S"}`;
  renderActivityList(document.querySelector("#history-list"), "Votre historique est vide");
  renderActivityList(document.querySelector("#overview-activity"), "Aucune analyse pour le moment");
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});
document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.go));
});


document.querySelector("#brix-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const { payload, criteria } = collectBrixPayload();
  const errorBox = document.querySelector("#brix-form-error");
  if (!criteria) {
    errorBox.textContent = "Renseignez au moins un critère de recherche (hors pagination et option flexible).";
    errorBox.classList.remove("hidden");
    return;
  }
  const birthError = birthDateError(payload);
  if (birthError) {
    errorBox.textContent = birthError;
    errorBox.classList.remove("hidden");
    return;
  }
  errorBox.classList.add("hidden");
  brixSearch(payload, document.querySelector("#brix-submit"));
});

renderBrixForm();
document.querySelector("#brix-field-filter").addEventListener("input", updateBrixControls);
document.querySelector("#brix-fields").addEventListener("input", updateBrixControls);
document.querySelector("#brix-fields").addEventListener("change", updateBrixControls);
document.querySelector("#brix-form").addEventListener("reset", () => {
  window.setTimeout(updateBrixControls, 0);
});
updateBrixControls();
renderActivity();
