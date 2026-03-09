// ============================================
//   CONTROLLER DETTAGLIO
//   Gestisce il rendering completo della
//   pagina dettaglio.html:
//   - Lettura ricetta da localStorage
//   - Popolamento di tutti i campi del DOM
//   - Gestione bottoni DB (salva / elimina)
//   - Navigazione back
// ============================================

const ControllerDettaglio = (() => {

  // --------------------------------------------------
  //   RIFERIMENTI DOM
  // --------------------------------------------------

  const _els = {
    loading:      () => getById("loadingState"),
    error:        () => getById("errorState"),
    errorMsg:     () => getById("errorMessage"),
    main:         () => getById("dettaglioMain"),
    heroImg:      () => getById("heroImg"),
    heroBadges:   () => getById("heroBadges"),
    heroTitolo:   () => getById("heroTitolo"),
    heroMeta:     () => getById("heroMeta"),
    heroTags:     () => getById("heroTags"),
    btnSalva:     () => getById("btnSalva"),
    btnElimina:   () => getById("btnElimina"),
    btnFonte:     () => getById("btnFonte"),
    btnBack:      () => getById("btnBack"),
    ingredienti:  () => getById("ingredientiLista"),
    istruzioni:   () => getById("istruzioniTesto"),
    sezioneVideo: () => getById("sezioneVideo"),
    videoFrame:   () => getById("videoFrame")
  };

  // Ricetta corrente (istanza ricostruita da localStorage)
  let _ricettaCorrente = null;


  // --------------------------------------------------
  //   INIT
  // --------------------------------------------------

  /**
   * Punto di ingresso: legge la ricetta da localStorage
   * con fallback su ID nell'URL → chiamata API
   */
  async function init() {
    _bindBack();

    mostraSolo(_els.loading(), [_els.main(), _els.error()]);

    // Ricava l'ID dall'URL — è sempre presente come parametro
    const id = getQueryParam("id");

    // Prova prima dallo storage (dati completi se arrivato dalla home)
    let datiRaw = leggiRicettaDaStorage();

    // Controlla se i dati in storage sono completi (hanno ingredienti e istruzioni)
    // Le ricette da /filter.php sono parziali: nessun ingrediente, nessuna istruzione
    const idStorage = datiRaw?.id || datiRaw?.idMeal;
    const hasDatiCompleti = datiRaw
      && idStorage === id
      && (
        (Array.isArray(datiRaw.ingredienti) && datiRaw.ingredienti.length > 0)
        || (datiRaw.strInstructions && datiRaw.strInstructions.trim() !== "")
        || (datiRaw.istruzioni && datiRaw.istruzioni.trim() !== "")
      );

    if (hasDatiCompleti) {
      // Ricostruisce l'istanza Ricetta dai dati plain dello storage
      const datiNorm = datiRaw.idMeal ? datiRaw : _denormalizza(datiRaw);
      _ricettaCorrente = new Ricetta(datiNorm);
    } else {
      // Dati assenti, parziali o appartenenti a un'altra ricetta:
      // ricarica i dettagli completi dall'API tramite ID nell'URL
      if (!id) {
        _mostraErrore("Nessuna ricetta selezionata. Torna alla home.");
        return;
      }
      try {
        const ricettaAPI = await ApiService.getPerID(id);
        if (ricettaAPI) {
          _ricettaCorrente = ricettaAPI;
          salvaRicettaInStorage(ricettaAPI); // aggiorna lo storage con dati completi
        } else {
          _mostraErrore("Ricetta non trovata.");
          return;
        }
      } catch (e) {
        _mostraErrore("Errore nel caricamento della ricetta. Controlla la connessione.");
        return;
      }
    }

    // Aggiorna il titolo della tab del browser
    document.title = `${_ricettaCorrente.nome} — MealExplorer`;

    // Renderizza tutto
    _renderHero();
    _renderIngredienti();
    _renderIstruzioni();
    _renderVideo();

    // Controlla se già salvata nel DB (solo se MongoDB è configurato)
    await _verificaStatoDB();

    // Mostra il contenuto
    mostraSolo(_els.main(), [_els.loading(), _els.error()]);
  }

  /**
   * Riconverte le chiavi normalizzate della classe Ricetta
   * nelle chiavi originali dell'API (strMeal, idMeal, ecc.)
   * necessarie per ricostruire l'istanza con new Ricetta()
   * @param {Object} dati - oggetto con chiavi normalizzate
   * @returns {Object} oggetto con chiavi API originali
   */
  function _denormalizza(dati) {
    const oggetto = {
      idMeal:          dati.id,
      strMeal:         dati.nome,
      strCategory:     dati.categoria,
      strArea:         dati.paese,
      strInstructions: dati.istruzioni,
      strMealThumb:    dati.immagine,
      strTags:         dati.tag,
      strYoutube:      dati.youtube,
      strSource:       dati.fonte
    };

    // Riconverte ingredienti array → strIngredient1...N + strMeasure1...N
    if (Array.isArray(dati.ingredienti)) {
      dati.ingredienti.forEach((ing, i) => {
        oggetto[`strIngredient${i + 1}`] = ing.nome;
        oggetto[`strMeasure${i + 1}`]    = ing.quantita;
      });
    }

    return oggetto;
  }


  // --------------------------------------------------
  //   RENDER HERO
  // --------------------------------------------------

  function _renderHero() {
    const r = _ricettaCorrente;

    // Immagine
    const img = _els.heroImg();
    if (img) {
      img.src = r.immagine;
      img.alt = r.nome;
      img.onerror = () => {
        img.src = "https://www.themealdb.com/images/media/meals/placeholder.png";
      };
    }

    // Badges categoria + paese
    const badges = _els.heroBadges();
    if (badges) {
      badges.innerHTML = `
        <span class="hero-badge">${r.categoria}</span>
        <span class="hero-badge">${getBandiera(r.paese)} ${r.paese}</span>
      `;
    }

    // Titolo
    const titolo = _els.heroTitolo();
    if (titolo) titolo.textContent = r.nome;

    // Meta: bandiera + paese + numero ingredienti
    const meta = _els.heroMeta();
    if (meta) {
      meta.innerHTML = `
        <span>${getBandiera(r.paese)} ${r.paese}</span>
        <span class="meta-sep"></span>
        <span>${r.getNumeroIngredienti()} ingredienti</span>
        ${r.hasVideo()
          ? `<span class="meta-sep"></span><span>📺 Video disponibile</span>`
          : ""}
      `;
    }

    // Tag
    const tagsEl = _els.heroTags();
    if (tagsEl) {
      const tags = r.getTagArray();
      tagsEl.innerHTML = tags.length > 0
        ? tags.map(t => `<span class="hero-tag">${t}</span>`).join("")
        : "";
    }

    // Bottone fonte originale
    const btnFonte = _els.btnFonte();
    if (btnFonte && r.fonte) {
      btnFonte.href = r.fonte;
      mostra(btnFonte);
    }
  }


  // --------------------------------------------------
  //   RENDER INGREDIENTI
  // --------------------------------------------------

  function _renderIngredienti() {
    const lista = _els.ingredienti();
    if (!lista) return;

    const r = _ricettaCorrente;

    if (r.ingredienti.length === 0) {
      lista.innerHTML = `<li class="ingrediente-item">
        <span class="ingrediente-nome">Nessun ingrediente disponibile.</span>
      </li>`;
      return;
    }

    lista.innerHTML = r.ingredienti.map(ing => `
      <li class="ingrediente-item">
        <span class="ingrediente-nome">${capitalizza(ing.nome)}</span>
        <span class="ingrediente-quantita">${ing.quantita || "q.b."}</span>
      </li>
    `).join("");
  }


  // --------------------------------------------------
  //   RENDER ISTRUZIONI
  // --------------------------------------------------

  function _renderIstruzioni() {
    const contenitore = _els.istruzioni();
    if (!contenitore) return;

    const paragrafi = istruzioniAParagrafi(_ricettaCorrente.istruzioni);

    if (paragrafi.length === 0) {
      contenitore.innerHTML = `
        <p class="istruzione-paragrafo">
          Istruzioni non disponibili per questa ricetta.
        </p>`;
      return;
    }

    contenitore.innerHTML = paragrafi
      .map(p => `<p class="istruzione-paragrafo">${p}</p>`)
      .join("");
  }


  // --------------------------------------------------
  //   RENDER VIDEO
  // --------------------------------------------------

  function _renderVideo() {
    const sezione = _els.sezioneVideo();
    const frame   = _els.videoFrame();
    if (!sezione || !frame) return;

    const embedUrl = _ricettaCorrente.getYoutubeEmbedUrl();

    if (embedUrl) {
      frame.src = embedUrl;
      mostra(sezione);
    } else {
      nascondi(sezione);
    }
  }


  // --------------------------------------------------
  //   VERIFICA STATO DB
  // --------------------------------------------------

  async function _verificaStatoDB() {
    const btnSalva   = _els.btnSalva();
    const btnElimina = _els.btnElimina();

    // Se MongoDB non è configurato, mostra il bottone disabilitato con tooltip
    if (!DbService.isConfigurato()) {
      if (btnSalva) {
        btnSalva.textContent = "💾 Salva nel DB";
        btnSalva.title = "Configura MongoDB in services/dbService.js per abilitare questa funzione";
        btnSalva.addEventListener("click", () => {
          alert(
            "Database non configurato.\n\n" +
            "Per abilitare il salvataggio:\n" +
            "1. Crea un cluster su mongodb.com/atlas\n" +
            "2. Abilita la Data API\n" +
            "3. Compila API_KEY e BASE_URL in services/dbService.js"
          );
        });
      }
      if (btnElimina) nascondi(btnElimina);
      return;
    }

    // MongoDB configurato: controlla se la ricetta è già salvata
    try {
      const giaPresente = await DbService.isRicettaSalvata(_ricettaCorrente.id);
      _aggiornaBtnDB(giaPresente);
    } catch (e) {
      console.warn("[ControllerDettaglio] DB non raggiungibile:", e);
      _bindBtnSalvaSenzaDB();
    }
  }

  // Funzione rimossa — rimpiazzata dalla logica inline sopra

  function _aggiornaBtnDB(giaPresente) {
    const btnSalva   = _els.btnSalva();
    const btnElimina = _els.btnElimina();

    if (giaPresente) {
      if (btnSalva) {
        btnSalva.textContent = "✅ Già salvata";
        btnSalva.disabled    = true;
      }
      if (btnElimina) {
        mostra(btnElimina);
        btnElimina.addEventListener("click", async () => {
          await ControllerRicette.eliminaRicettaDaDB(
            _ricettaCorrente.id,
            btnElimina
          );
          _aggiornaBtnDB(false);
          nascondi(btnElimina);
        });
      }
    } else {
      if (btnSalva) {
        btnSalva.disabled    = false;
        btnSalva.textContent = "💾 Salva nel DB";
        btnSalva.addEventListener("click", async () => {
          await ControllerRicette.salvaRicettaSuDB(
            _ricettaCorrente,
            btnSalva
          );
          await _verificaStatoDB();
        });
      }
    }
  }

  function _bindBtnSalvaSenzaDB() {
    const btnSalva = _els.btnSalva();
    if (!btnSalva) return;
    btnSalva.addEventListener("click", () => {
      alert("Database non configurato.\nCompila le costanti in services/dbService.js con i tuoi dati MongoDB Atlas.");
    });
  }


  // --------------------------------------------------
  //   NAVIGAZIONE BACK
  // --------------------------------------------------

  function _bindBack() {
    _els.btnBack()?.addEventListener("click", () => {
      cancellaRicettaDaStorage();
      window.location.href = "index.html";
    });
  }


  // --------------------------------------------------
  //   STATO ERRORE
  // --------------------------------------------------

  function _mostraErrore(messaggio) {
    if (_els.errorMsg()) _els.errorMsg().textContent = messaggio;
    mostraSolo(_els.error(), [_els.loading(), _els.main()]);
  }


  // --------------------------------------------------
  //   PUBLIC API
  // --------------------------------------------------

  return { init };

})();


// ============================================
//   AVVIO — solo su dettaglio.html
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  if (getById("dettaglioMain")) {
    ControllerDettaglio.init();
  }
});