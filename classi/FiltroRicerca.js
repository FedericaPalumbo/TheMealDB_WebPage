// ============================================
//   CLASSE: FiltroRicerca
//   Gestisce lo stato dei filtri attivi
//   e la logica di filtraggio lato client
// ============================================

class FiltroRicerca {

  constructor() {
    // Testo digitato nella search bar
    this.testoRicerca  = "";

    // Categoria selezionata ("all" = nessun filtro)
    this.categoria     = "all";

    // Lista completa delle ricette (riferimento originale, mai modificato)
    this._ricetteOriginali = [];
  }


  // --------------------------------------------------
  //   SETTERS — aggiornano il filtro e restituiscono
  //   this per permettere il chaining
  // --------------------------------------------------

  /**
   * Imposta il testo di ricerca (normalizzato in minuscolo)
   * @param {string} testo
   * @returns {FiltroRicerca}
   */
  setTesto(testo) {
    this.testoRicerca = testo.trim().toLowerCase();
    return this;
  }

  /**
   * Imposta la categoria attiva
   * @param {string} categoria
   * @returns {FiltroRicerca}
   */
  setCategoria(categoria) {
    this.categoria = categoria || "all";
    return this;
  }

  /**
   * Carica la lista originale di ricette da filtrare
   * @param {Array<Ricetta>} ricette
   * @returns {FiltroRicerca}
   */
  setRicette(ricette) {
    this._ricetteOriginali = Array.isArray(ricette) ? ricette : [];
    return this;
  }


  // --------------------------------------------------
  //   GETTERS
  // --------------------------------------------------

  /**
   * Indica se è attivo almeno un filtro
   * @returns {boolean}
   */
  hasFiltriAttivi() {
    return this.testoRicerca !== "" || this.categoria !== "all";
  }

  /**
   * Restituisce il numero totale di ricette originali
   * @returns {number}
   */
  getTotaleRicette() {
    return this._ricetteOriginali.length;
  }


  // --------------------------------------------------
  //   METODO PRINCIPALE: applica i filtri
  // --------------------------------------------------

  /**
   * Applica tutti i filtri attivi alla lista originale
   * @returns {Array<Ricetta>} lista filtrata
   */
  applicaFiltri() {
    let risultati = [...this._ricetteOriginali];

    // Filtro per categoria
    if (this.categoria !== "all") {
      risultati = this._filtraPerCategoria(risultati, this.categoria);
    }

    // Filtro per testo (nome + paese + ingredienti)
    if (this.testoRicerca !== "") {
      risultati = this._filtraPerTesto(risultati, this.testoRicerca);
    }

    return risultati;
  }


  // --------------------------------------------------
  //   METODI PRIVATI DI FILTRAGGIO
  // --------------------------------------------------

  /**
   * Filtra per categoria (confronto case-insensitive)
   * @param {Array<Ricetta>} ricette
   * @param {string} categoria
   * @returns {Array<Ricetta>}
   */
  _filtraPerCategoria(ricette, categoria) {
    const cat = categoria.toLowerCase();
    return ricette.filter(r => r.categoria.toLowerCase() === cat);
  }

  /**
   * Filtra per testo cercando in:
   * - nome della ricetta
   * - paese di origine
   * - nomi degli ingredienti
   * @param {Array<Ricetta>} ricette
   * @param {string} testo
   * @returns {Array<Ricetta>}
   */
  _filtraPerTesto(ricette, testo) {
    return ricette.filter(r => {
      const nomeMatch      = r.nome.toLowerCase().includes(testo);
      const paeseMatch     = r.paese.toLowerCase().includes(testo);
      const ingredientiMatch = r.ingredienti.some(
        ing => ing.nome.toLowerCase().includes(testo)
      );

      return nomeMatch || paeseMatch || ingredientiMatch;
    });
  }


  // --------------------------------------------------
  //   UTILITY
  // --------------------------------------------------

  /**
   * Azzera tutti i filtri attivi
   * @returns {FiltroRicerca}
   */
  reset() {
    this.testoRicerca = "";
    this.categoria    = "all";
    return this;
  }

  /**
   * Estrae la lista univoca di categorie dalle ricette caricate
   * @returns {Array<string>}
   */
  getCategorieDisponibili() {
    const set = new Set(
      this._ricetteOriginali.map(r => r.categoria).filter(c => c !== "")
    );
    return Array.from(set).sort();
  }

  /**
   * Rappresentazione testuale dello stato del filtro
   * @returns {string}
   */
  toString() {
    return `[FiltroRicerca] testo: "${this.testoRicerca}" | categoria: "${this.categoria}" | ricette: ${this.getTotaleRicette()}`;
  }
}