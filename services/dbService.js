// ============================================
//   DB SERVICE
//   Gestisce la comunicazione con MongoDB
//   tramite le API REST di MongoDB Data API
//
//   Setup richiesto:
//   1. Crea un cluster su https://www.mongodb.com/atlas
//   2. Abilita "Data API" dal pannello Atlas
//   3. Crea una API Key e compila le costanti qui sotto
// ============================================

const DbService = (() => {

  // --------------------------------------------------
  //   CONFIGURAZIONE — compila con i tuoi dati Atlas
  // --------------------------------------------------

  const CONFIG = {
    API_KEY:      "LA_TUA_API_KEY",          // Data API Key da Atlas
    BASE_URL:     "https://data.mongodb-api.com/app/data-azxxx/endpoint/data/v1",
    DATA_SOURCE:  "Cluster0",                // Nome del tuo cluster
    DATABASE:     "mealexplorer",            // Nome del database
    COLLECTION:   "ricette"                  // Nome della collection
  };

  /**
   * Indica se MongoDB è stato configurato con credenziali reali.
   * Finché API_KEY è il valore placeholder, tutte le chiamate DB
   * vengono saltate per evitare errori CORS inutili.
   */
  function isConfigurato() {
    return CONFIG.API_KEY !== "LA_TUA_API_KEY"
        && CONFIG.API_KEY !== ""
        && !CONFIG.BASE_URL.includes("data-azxxx");
  }


  // --------------------------------------------------
  //   METODO PRIVATO: fetch verso MongoDB Data API
  // --------------------------------------------------

  /**
   * Wrapper interno per le chiamate a MongoDB Data API
   * @param {string} action  - es. "findOne", "insertOne", "find"
   * @param {Object} payload - body specifico dell'azione
   * @returns {Promise<Object>}
   */
  async function _mongoFetch(action, payload) {
    const url = `${CONFIG.BASE_URL}/action/${action}`;

    const body = {
      dataSource: CONFIG.DATA_SOURCE,
      database:   CONFIG.DATABASE,
      collection: CONFIG.COLLECTION,
      ...payload
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "api-key":        CONFIG.API_KEY
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errTesto = await response.text();
      throw new Error(`[DbService] HTTP ${response.status} — ${errTesto}`);
    }

    return await response.json();
  }


  // --------------------------------------------------
  //   LETTURA
  // --------------------------------------------------

  /**
   * Recupera tutte le ricette salvate nel DB
   * @returns {Promise<Array<Object>>}
   */
  async function getTutteLeRicette() {
    const data = await _mongoFetch("find", {
      filter: {},
      sort:   { salvataIl: -1 },   // più recenti prima
      limit:  100
    });
    return data.documents || [];
  }

  /**
   * Recupera una ricetta dal DB tramite il suo ID TheMealDB
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async function getRicettaPerID(id) {
    const data = await _mongoFetch("findOne", {
      filter: { id: id }
    });
    return data.document || null;
  }

  /**
   * Verifica se una ricetta è già salvata nel DB
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async function isRicettaSalvata(id) {
    const ricetta = await getRicettaPerID(id);
    return ricetta !== null;
  }


  // --------------------------------------------------
  //   SCRITTURA
  // --------------------------------------------------

  /**
   * Salva una ricetta nel DB (solo se non è già presente)
   * @param {Ricetta} ricetta - istanza della classe Ricetta
   * @returns {Promise<{successo: boolean, messaggio: string}>}
   */
  async function salvaRicetta(ricetta) {
    try {
      // Controlla duplicati
      const giaPresente = await isRicettaSalvata(ricetta.id);
      if (giaPresente) {
        return {
          successo:  false,
          messaggio: "Ricetta già presente nel database."
        };
      }

      // Inserisce il documento
      await _mongoFetch("insertOne", {
        document: ricetta.toDBObject()
      });

      return {
        successo:  true,
        messaggio: "Ricetta salvata con successo!"
      };

    } catch (e) {
      console.error("[DbService] Errore salvataggio:", e);
      return {
        successo:  false,
        messaggio: "Errore durante il salvataggio. Riprova."
      };
    }
  }

  /**
   * Aggiorna una ricetta esistente nel DB
   * @param {string} id
   * @param {Object} campiAggiornati - solo i campi da modificare
   * @returns {Promise<{successo: boolean, messaggio: string}>}
   */
  async function aggiornaRicetta(id, campiAggiornati) {
    try {
      await _mongoFetch("updateOne", {
        filter: { id: id },
        update: { $set: campiAggiornati }
      });

      return {
        successo:  true,
        messaggio: "Ricetta aggiornata con successo!"
      };

    } catch (e) {
      console.error("[DbService] Errore aggiornamento:", e);
      return {
        successo:  false,
        messaggio: "Errore durante l'aggiornamento. Riprova."
      };
    }
  }


  // --------------------------------------------------
  //   ELIMINAZIONE
  // --------------------------------------------------

  /**
   * Elimina una ricetta dal DB tramite ID
   * @param {string} id
   * @returns {Promise<{successo: boolean, messaggio: string}>}
   */
  async function eliminaRicetta(id) {
    try {
      await _mongoFetch("deleteOne", {
        filter: { id: id }
      });

      return {
        successo:  true,
        messaggio: "Ricetta eliminata dal database."
      };

    } catch (e) {
      console.error("[DbService] Errore eliminazione:", e);
      return {
        successo:  false,
        messaggio: "Errore durante l'eliminazione. Riprova."
      };
    }
  }


  // --------------------------------------------------
  //   PUBLIC API
   // --------------------------------------------------

  return {
    isConfigurato,
    getTutteLeRicette,
    getRicettaPerID,
    isRicettaSalvata,
    salvaRicetta,
    aggiornaRicetta,
    eliminaRicetta
  };

})();