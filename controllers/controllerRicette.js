// ============================================
//   CONTROLLER RICETTE
// ============================================

const ControllerRicette = (() => {

  const filtro = new FiltroRicerca();
  let _categorieCache = [];
  let _areeCache = [];
  let _ultimaCategoria = "all";

  // --------------------------------------------------
  //   INIT
  // --------------------------------------------------

  async function inizializza() {
    try {
      ControllerUI.mostraLoading();
      const ricette = await ApiService.getRicetteIniziali();
      if (ricette.length === 0) {
        ControllerUI.mostraErrore("Nessuna ricetta ricevuta dall'API.");
        return;
      }
      filtro.setRicette(ricette);
      await _caricaCategorie();
      await _caricaAree();
      ControllerUI.renderRicette(filtro.applicaFiltri());
    } catch (e) {
      console.error("[ControllerRicette] Errore inizializzazione:", e);
      ControllerUI.mostraErrore("Impossibile caricare le ricette. Controlla la connessione.");
    }
  }

  // --------------------------------------------------
  //   RICERCA
  // --------------------------------------------------

  async function cercaPerNome(testo) {
    if (!testo || testo.trim() === "") {
      await inizializza();
      return;
    }
    try {
      ControllerUI.mostraLoading();
      const risultati = await ApiService.cercaPerNome(testo);
      filtro.setRicette(risultati).setTesto("").setCategoria("all");
      if (risultati.length === 0) { ControllerUI.mostraVuoto(); return; }
      ControllerUI.renderRicette(risultati);
    } catch (e) {
      console.error("[ControllerRicette] Errore ricerca:", e);
      ControllerUI.mostraErrore("Errore durante la ricerca. Riprova.");
    }
  }

  // --------------------------------------------------
  //   FILTRO CATEGORIA
  // --------------------------------------------------

  async function filtraPerCategoria(categoria) {
    _ultimaCategoria = categoria;
    try {
      ControllerUI.mostraLoading();
      if (categoria === "all") {
        const ricette = await ApiService.getRicetteIniziali();
        filtro.setRicette(ricette).setCategoria("all");
        await _caricaCategorie();
        if (ricette.length === 0) { ControllerUI.mostraVuoto(); return; }
        ControllerUI.renderRicette(ricette);
        return;
      }
      const ricette = await ApiService.getPerCategoria(categoria);
      ricette.forEach(r => {
        if (!r.categoria || r.categoria === "Sconosciuta") r.categoria = categoria;
      });
      filtro.setRicette(ricette).setCategoria("all");
      if (ricette.length === 0) { ControllerUI.mostraVuoto(); return; }
      await _caricaCategorie();
      ControllerUI.renderRicette(ricette);
    } catch (e) {
      console.error("[ControllerRicette] Errore filtro categoria:", e);
      ControllerUI.mostraErrore("Errore nel caricamento della categoria.");
    }
  }

  // --------------------------------------------------
  //   FILTRO AREA (BANDIERA)
  // --------------------------------------------------

  async function filtraPerArea(area) {
    try {
      ControllerUI.mostraLoading();
      if (area === "all") {
        const ricette = await ApiService.getRicetteIniziali();
        filtro.setRicette(ricette).setCategoria("all");
        await _caricaCategorie();
        if (ricette.length === 0) { ControllerUI.mostraVuoto(); return; }
        ControllerUI.renderRicette(ricette);
        return;
      }
      const ricette = await ApiService.getPerArea(area);
      ricette.forEach(r => {
        if (!r.paese || r.paese === "Sconosciuto") r.paese = area;
      });
      filtro.setRicette(ricette).setCategoria("all");
      if (ricette.length === 0) { ControllerUI.mostraVuoto(); return; }
      await _caricaCategorie();
      ControllerUI.renderRicette(ricette);
    } catch (e) {
      console.error("[ControllerRicette] Errore filtro area:", e);
      ControllerUI.mostraErrore("Errore nel caricamento delle ricette per questo paese.");
    }
  }

  // --------------------------------------------------
  //   FILTRO TESTO (lato client)
  // --------------------------------------------------

  function filtraPerTesto(testo) {
    filtro.setTesto(testo);
    const risultati = filtro.applicaFiltri();
    if (risultati.length === 0) { ControllerUI.mostraVuoto(); return; }
    ControllerUI.renderRicette(risultati);
  }

  // --------------------------------------------------
  //   DETTAGLIO
  // --------------------------------------------------

  async function apriDettaglio(id) {
    try {
      const ricettaInMemoria = filtro._ricetteOriginali.find(r => r.id === id);
      if (ricettaInMemoria) { vaiAlDettaglio(ricettaInMemoria); return; }
      const ricetta = await ApiService.getPerID(id);
      if (ricetta) vaiAlDettaglio(ricetta);
      else alert("Ricetta non trovata.");
    } catch (e) {
      console.error("[ControllerRicette] Errore apertura dettaglio:", e);
      alert("Errore nel caricamento del dettaglio.");
    }
  }

  // --------------------------------------------------
  //   MONGODB
  // --------------------------------------------------

  async function salvaRicettaSuDB(ricetta, btnEl) {
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = "Salvataggio..."; }
    const risultato = await DbService.salvaRicetta(ricetta);
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.textContent = risultato.successo ? "✅ Salvata!" : "💾 Salva nel DB";
      if (risultato.successo) btnEl.disabled = true;
    }
    alert(risultato.messaggio);
  }

  async function eliminaRicettaDaDB(id, btnEl) {
    if (!confirm("Sei sicuro di voler eliminare questa ricetta dal database?")) return;
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = "Eliminazione..."; }
    const risultato = await DbService.eliminaRicetta(id);
    alert(risultato.messaggio);
    if (btnEl) { btnEl.disabled = false; btnEl.textContent = "🗑 Elimina dal DB"; }
  }

  // --------------------------------------------------
  //   HELPERS PRIVATI
  // --------------------------------------------------

  async function _caricaCategorie() {
    try {
      if (_categorieCache.length > 0) { ControllerUI.renderCategorie(_categorieCache); return; }
      const categorie = await ApiService.getListaCategorie();
      _categorieCache = categorie;
      ControllerUI.renderCategorie(categorie);
    } catch (e) {
      console.warn("[ControllerRicette] Impossibile caricare categorie:", e);
    }
  }

  async function _caricaAree() {
    try {
      if (_areeCache.length > 0) { ControllerUI.renderBandiere(_areeCache); return; }
      const aree = await ApiService.getListaAree();
      _areeCache = aree;
      ControllerUI.renderBandiere(aree);
    } catch (e) {
      console.warn("[ControllerRicette] Impossibile caricare aree:", e);
    }
  }

  // --------------------------------------------------
  //   PUBLIC API
  // --------------------------------------------------

  return {
    inizializza,
    cercaPerNome,
    filtraPerCategoria,
    filtraPerArea,
    filtraPerTesto,
    apriDettaglio,
    salvaRicettaSuDB,
    eliminaRicettaDaDB
  };

})();
