// ============================================
//   CONTROLLER UI
// ============================================

const ControllerUI = (() => {

  const _els = {
    grid:         () => getById("ricetteGrid"),
    loading:      () => getById("loadingState"),
    error:        () => getById("errorState"),
    errorMsg:     () => getById("errorMessage"),
    empty:        () => getById("emptyState"),
    retry:        () => getById("retryBtn"),
    searchInput:  () => getById("searchInput"),
    searchBtn:    () => getById("searchBtn"),
    categorie:    () => getById("categorieContainer"),
    bandiere:     () => getById("bandiereContainer")
  };

  // --------------------------------------------------
  //   STATI
  // --------------------------------------------------

  function mostraLoading() {
    mostraSolo(_els.loading(), [_els.grid(), _els.error(), _els.empty()]);
  }

  function mostraErrore(messaggio) {
    if (_els.errorMsg()) _els.errorMsg().textContent = messaggio;
    mostraSolo(_els.error(), [_els.loading(), _els.grid(), _els.empty()]);
  }

  function mostraVuoto() {
    mostraSolo(_els.empty(), [_els.loading(), _els.error(), _els.grid()]);
  }

  function mostraGriglia() {
    mostraSolo(_els.grid(), [_els.loading(), _els.error(), _els.empty()]);
  }

  // --------------------------------------------------
  //   RENDER RICETTE
  // --------------------------------------------------

  function renderRicette(ricette) {
    const grid = _els.grid();
    if (!grid) return;
    grid.innerHTML = "";
    ricette.forEach((ricetta, index) => grid.appendChild(_creaCard(ricetta, index)));
    mostraGriglia();
  }

  function _creaCard(ricetta, index) {
    const card = document.createElement("div");
    card.className = "ricetta-card";
    card.style.animationDelay = `${Math.min(index * 0.04, 0.4)}s`;

    const paeseLabel = (ricetta.paese && ricetta.paese !== "Sconosciuto")
      ? `<span>${getBandiera(ricetta.paese)}</span><span>${ricetta.paese}</span><span class="separator"></span>`
      : "";

    const categoriaLabel = (ricetta.categoria && ricetta.categoria !== "Sconosciuta")
      ? `<span class="card-category-badge">${ricetta.categoria}</span>`
      : "";

    const ingredientiLabel = ricetta.getNumeroIngredienti() > 0
      ? `<span>${ricetta.getNumeroIngredienti()} ingredienti</span>`
      : `<span>Clicca per i dettagli</span>`;

    card.innerHTML = `
      <div class="card-img-wrapper">
        <img src="${ricetta.immagine}" alt="${ricetta.nome}" loading="lazy"
          onerror="this.src='https://www.themealdb.com/images/media/meals/placeholder.png'" />
        ${categoriaLabel}
      </div>
      <div class="card-body">
        <h3 class="card-title">${ricetta.nome}</h3>
        <div class="card-meta">
          ${paeseLabel}
          ${ingredientiLabel}
        </div>
        <div class="card-actions">
          <button class="btn-dettaglio" data-id="${ricetta.id}">Vedi ricetta →</button>
        </div>
      </div>
    `;

    card.querySelector(".btn-dettaglio").addEventListener("click", () => {
      ControllerRicette.apriDettaglio(ricetta.id);
    });

    return card;
  }

  // --------------------------------------------------
  //   RENDER CATEGORIE
  // --------------------------------------------------

  function renderCategorie(categorie) {
    const container = _els.categorie();
    if (!container) return;

    container.innerHTML = `<button class="filtro-btn active" data-category="all">Tutte</button>`;
    categorie.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "filtro-btn";
      btn.dataset.category = cat;
      btn.textContent = cat;
      container.appendChild(btn);
    });

    _bindCategorieBtns();
    _aggiornaFrecce("categorieContainer", "catLeft", "catRight");
  }

  // --------------------------------------------------
  //   RENDER BANDIERE
  // --------------------------------------------------

  function renderBandiere(aree) {
    const container = _els.bandiere();
    if (!container) return;

    container.innerHTML = `<button class="bandiera-btn active" data-area="all" title="Tutti i paesi">ALL</button>`;

    aree.forEach(area => {
      if (area === "Unknown") return;
      const bandiera = getBandiera(area);
      const btn = document.createElement("button");
      btn.className = "bandiera-btn";
      btn.dataset.area = area;
      btn.title = area;
      btn.textContent = bandiera;
      container.appendChild(btn);
    });

    _bindBandiereBtns();
    _aggiornaFrecce("bandiereContainer", "bandLeft", "bandRight");
  }

  // --------------------------------------------------
  //   SCROLL ARROWS
  // --------------------------------------------------

  function _setupScrollArrows(containerId, leftId, rightId) {
    const container = getById(containerId);
    const btnLeft  = getById(leftId);
    const btnRight = getById(rightId);
    if (!container || !btnLeft || !btnRight) return;

    btnLeft.addEventListener("click", () => {
      container.scrollBy({ left: -220, behavior: "smooth" });
    });

    btnRight.addEventListener("click", () => {
      container.scrollBy({ left: 220, behavior: "smooth" });
    });

    container.addEventListener("scroll", () => _aggiornaFrecce(containerId, leftId, rightId), { passive: true });
    new ResizeObserver(() => _aggiornaFrecce(containerId, leftId, rightId)).observe(container);

    _aggiornaFrecce(containerId, leftId, rightId);
  }

  function _aggiornaFrecce(containerId, leftId, rightId) {
    const container = getById(containerId);
    const btnLeft  = getById(leftId);
    const btnRight = getById(rightId);
    if (!container || !btnLeft || !btnRight) return;

    btnLeft.disabled  = container.scrollLeft <= 2;
    btnRight.disabled = container.scrollLeft + container.clientWidth >= container.scrollWidth - 2;
  }

  // --------------------------------------------------
  //   EVENT LISTENERS
  // --------------------------------------------------

  function bindEvents() {
    _els.searchBtn()?.addEventListener("click", _onSearch);
    _els.searchInput()?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") _onSearch();
    });

    let _debounceTimer = null;
    _els.searchInput()?.addEventListener("input", (e) => {
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(() => {
        ControllerRicette.cercaPerNome(e.target.value.trim());
      }, 400);
    });

    _els.retry()?.addEventListener("click", () => ControllerRicette.inizializza());

    // Setup frecce scroll
    _setupScrollArrows("categorieContainer", "catLeft", "catRight");
    _setupScrollArrows("bandiereContainer", "bandLeft", "bandRight");
  }

  function _bindCategorieBtns() {
    const container = _els.categorie();
    if (!container) return;
    container.querySelectorAll(".filtro-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        // Resetta bandiere
        const bc = _els.bandiere();
        if (bc) {
          bc.querySelectorAll(".bandiera-btn").forEach(b => b.classList.remove("active"));
          bc.querySelector('[data-area="all"]')?.classList.add("active");
        }
        ControllerRicette.filtraPerCategoria(btn.dataset.category);
      });
    });
  }

  function _bindBandiereBtns() {
    const container = _els.bandiere();
    if (!container) return;
    container.querySelectorAll(".bandiera-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".bandiera-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        // Resetta categorie
        const cc = _els.categorie();
        if (cc) {
          cc.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("active"));
          cc.querySelector('[data-category="all"]')?.classList.add("active");
        }
        ControllerRicette.filtraPerArea(btn.dataset.area);
      });
    });
  }

  function _onSearch() {
    const testo = _els.searchInput()?.value.trim() || "";
    ControllerRicette.cercaPerNome(testo);
  }

  // --------------------------------------------------
  //   INIT
  // --------------------------------------------------

  function init() {
    bindEvents();
    ControllerRicette.inizializza();
  }

  return {
    init,
    mostraLoading,
    mostraErrore,
    mostraVuoto,
    renderRicette,
    renderCategorie,
    renderBandiere
  };

})();


// ============================================
//   AVVIO
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  if (getById("ricetteGrid")) {
    ControllerUI.init();
  }
});
