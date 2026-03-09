// ============================================
//   HELPERS
//   Funzioni di utilità riutilizzabili
//   in tutto il progetto
// ============================================


// --------------------------------------------------
//   STRINGHE & TESTO
// --------------------------------------------------

/**
 * Capitalizza la prima lettera di una stringa
 * @param {string} str
 * @returns {string}
 */
function capitalizza(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Tronca un testo oltre una certa lunghezza aggiungendo "..."
 * @param {string} testo
 * @param {number} maxLen
 * @returns {string}
 */
function troncaTesto(testo, maxLen = 120) {
  if (!testo) return "";
  return testo.length > maxLen ? testo.slice(0, maxLen).trimEnd() + "…" : testo;
}

/**
 * Converte le istruzioni (testo lungo) in un array di paragrafi
 * puliti, eliminando righe vuote consecutive
 * @param {string} istruzioni
 * @returns {Array<string>}
 */
function istruzioniAParagrafi(istruzioni) {
  if (!istruzioni) return [];
  return istruzioni
    .split(/\r?\n/)
    .map(r => r.trim())
    .filter(r => r.length > 0);
}


// --------------------------------------------------
//   PAESE → EMOJI BANDIERA
// --------------------------------------------------

/**
 * Mappa paese (strArea di TheMealDB) → emoji bandiera
 * @type {Object<string, string>}
 */
const BANDIERE = {
  "American":     "US",
  "Australian":   "AU",
  "British":      "UK",
  "Canadian":     "CA",
  "Chinese":      "CN",
  "Croatian":     "HR",
  "Dutch":        "NL",
  "Egyptian":     "EG",
  "Filipino":     "PH",
  "French":       "FR",
  "Greek":        "GR",
  "Indian":       "IN",
  "Irish":        "IE",
  "Italian":      "IT",
  "Jamaican":     "JM",
  "Japanese":     "JP",
  "Kenyan":       "KE",
  "Malaysian":    "MY",
  "Mexican":      "MX",
  "Moroccan":     "MA",
  "Norwegian":    "NO",
  "Polish":       "PL",
  "Portuguese":   "PT",
  "Russian":      "RU",
  "Saudi":        "SA",
  "Spanish":      "ES",
  "Thai":         "TH",
  "Tunisian":     "TN",
  "Turkish":      "TR",
  "Ukrainian":    "UA",
  "Uruguayan":    "UY",
  "Vietnamese":   "VN",
  "Unknown":      "??"
};

/**
 * Restituisce l'emoji bandiera per un paese dato
 * @param {string} paese
 * @returns {string}
 */
function getBandiera(paese) {
  return BANDIERE[paese] || paese.substring(0, 2).toUpperCase();
}


// --------------------------------------------------
//   DOM HELPERS
// --------------------------------------------------

/**
 * Shortcut per document.getElementById
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function getById(id) {
  return document.getElementById(id);
}

/**
 * Mostra un elemento (rimuove la classe "hidden")
 * @param {HTMLElement} el
 */
function mostra(el) {
  if (el) el.classList.remove("hidden");
}

/**
 * Nasconde un elemento (aggiunge la classe "hidden")
 * @param {HTMLElement} el
 */
function nascondi(el) {
  if (el) el.classList.add("hidden");
}

/**
 * Mostra solo l'elemento target, nasconde tutti gli altri passati
 * @param {HTMLElement} target
 * @param {Array<HTMLElement>} altri
 */
function mostraSolo(target, altri = []) {
  altri.forEach(el => nascondi(el));
  mostra(target);
}


// --------------------------------------------------
//   STORAGE (localStorage) — per ricetta corrente
// --------------------------------------------------

const STORAGE_KEY_RICETTA = "mealexplorer_ricetta_corrente";

/**
 * Salva una ricetta nello storage per passarla
 * da index.html a dettaglio.html.
 * Usa sessionStorage (compatibile anche con file://)
 * con fallback su localStorage.
 * @param {Ricetta} ricetta
 */
function salvaRicettaInStorage(ricetta) {
  const payload = JSON.stringify(ricetta);
  try {
    sessionStorage.setItem(STORAGE_KEY_RICETTA, payload);
  } catch (e) {
    try {
      localStorage.setItem(STORAGE_KEY_RICETTA, payload);
    } catch (e2) {
      console.warn("[helpers] Storage non disponibile:", e2);
    }
  }
}

/**
 * Legge la ricetta salvata nello storage
 * @returns {Object|null} oggetto plain (non istanza Ricetta)
 */
function leggiRicettaDaStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_RICETTA)
             || localStorage.getItem(STORAGE_KEY_RICETTA);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("[helpers] Errore lettura storage:", e);
    return null;
  }
}

/**
 * Cancella la ricetta dallo storage
 */
function cancellaRicettaDaStorage() {
  try { sessionStorage.removeItem(STORAGE_KEY_RICETTA); } catch(e) {}
  try { localStorage.removeItem(STORAGE_KEY_RICETTA); } catch(e) {}
}


// --------------------------------------------------
//   URL / NAVIGAZIONE
// --------------------------------------------------

/**
 * Naviga alla pagina di dettaglio salvando prima la ricetta
 * @param {Ricetta} ricetta
 */
function vaiAlDettaglio(ricetta) {
  salvaRicettaInStorage(ricetta);
  // Passa anche l'ID come parametro URL come fallback
  window.location.href = `dettaglio.html?id=${ricetta.id}`;
}

/**
 * Legge un parametro dalla query string dell'URL corrente
 * @param {string} nome
 * @returns {string|null}
 */
function getQueryParam(nome) {
  const params = new URLSearchParams(window.location.search);
  return params.get(nome);
}