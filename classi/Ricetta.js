// ============================================
//   CLASSE: Ricetta
//   Rappresenta il modello dati di una ricetta
//   proveniente da TheMealDB API
// ============================================

class Ricetta {

  /**
   * @param {Object} datiAPI - Oggetto grezzo restituito da TheMealDB
   */
  constructor(datiAPI) {
    this.id          = datiAPI.idMeal        || null;
    this.nome        = datiAPI.strMeal       || "Nome non disponibile";
    this.categoria   = datiAPI.strCategory   || "Sconosciuta";
    this.paese       = datiAPI.strArea       || "Sconosciuto";
    this.istruzioni  = datiAPI.strInstructions || "";
    this.immagine    = datiAPI.strMealThumb  || "";
    this.tag         = datiAPI.strTags       || "";
    this.youtube     = datiAPI.strYoutube    || "";
    this.fonte       = datiAPI.strSource     || "";

    // Ingredienti e misure: TheMealDB li restituisce come
    // strIngredient1...strIngredient20 + strMeasure1...strMeasure20
    this.ingredienti = this._estraiIngredienti(datiAPI);

    // Timestamp salvataggio su MongoDB (valorizzato solo se salvata nel DB)
    this.salvataIl   = datiAPI.salvataIl || null;
  }


  // --------------------------------------------------
  //   METODO PRIVATO: estrai ingredienti dall'oggetto API
  // --------------------------------------------------

  /**
   * Combina strIngredientX e strMeasureX in un array di oggetti
   * @param {Object} dati
   * @returns {Array<{nome: string, quantita: string}>}
   */
  _estraiIngredienti(dati) {
    const ingredienti = [];

    for (let i = 1; i <= 20; i++) {
      const nome     = dati[`strIngredient${i}`];
      const quantita = dati[`strMeasure${i}`];

      // TheMealDB restituisce stringhe vuote per i campi non usati
      if (nome && nome.trim() !== "") {
        ingredienti.push({
          nome:     nome.trim(),
          quantita: quantita ? quantita.trim() : ""
        });
      }
    }

    return ingredienti;
  }


  // --------------------------------------------------
  //   METODI PUBBLICI
  // --------------------------------------------------

  /**
   * Restituisce il numero di ingredienti della ricetta
   * @returns {number}
   */
  getNumeroIngredienti() {
    return this.ingredienti.length;
  }

  /**
   * Restituisce l'URL del video YouTube come embed
   * (es. https://www.youtube.com/watch?v=ID → https://www.youtube.com/embed/ID)
   * @returns {string|null}
   */
  getYoutubeEmbedUrl() {
    if (!this.youtube) return null;

    const match = this.youtube.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }

  /**
   * Indica se la ricetta ha un video collegato
   * @returns {boolean}
   */
  hasVideo() {
    return this.getYoutubeEmbedUrl() !== null;
  }

  /**
   * Restituisce i tag come array (TheMealDB li separa con virgola)
   * @returns {Array<string>}
   */
  getTagArray() {
    if (!this.tag) return [];
    return this.tag.split(",").map(t => t.trim()).filter(t => t !== "");
  }

  /**
   * Serializza la ricetta in un oggetto plain per il salvataggio su MongoDB
   * @returns {Object}
   */
  toDBObject() {
    return {
      id:           this.id,
      nome:         this.nome,
      categoria:    this.categoria,
      paese:        this.paese,
      istruzioni:   this.istruzioni,
      immagine:     this.immagine,
      tag:          this.tag,
      youtube:      this.youtube,
      fonte:        this.fonte,
      ingredienti:  this.ingredienti,
      salvataIl:    new Date().toISOString()
    };
  }

  /**
   * Rappresentazione stringa leggibile della ricetta
   * @returns {string}
   */
  toString() {
    return `[Ricetta] ${this.nome} | ${this.paese} | ${this.categoria} | ${this.getNumeroIngredienti()} ingredienti`;
  }
}