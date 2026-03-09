// ============================================
//   API SERVICE
// ============================================

const ApiService = (() => {

  const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

  async function _fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`[ApiService] HTTP ${response.status} — ${url}`);
    return response.json();
  }

  async function cercaPerNome(nome) {
    const data = await _fetchJSON(`${BASE_URL}/search.php?s=${encodeURIComponent(nome)}`);
    return _parseMeals(data.meals);
  }

  async function getPerID(id) {
    const data = await _fetchJSON(`${BASE_URL}/lookup.php?i=${id}`);
    const lista = _parseMeals(data.meals);
    return lista.length > 0 ? lista[0] : null;
  }

  async function getRandom() {
    const data = await _fetchJSON(`${BASE_URL}/random.php`);
    const lista = _parseMeals(data.meals);
    return lista.length > 0 ? lista[0] : null;
  }

  async function getPerCategoria(categoria) {
    const data = await _fetchJSON(`${BASE_URL}/filter.php?c=${encodeURIComponent(categoria)}`);
    return _parseMeals(data.meals);
  }

  async function getPerArea(area) {
    const data = await _fetchJSON(`${BASE_URL}/filter.php?a=${encodeURIComponent(area)}`);
    return _parseMeals(data.meals);
  }

  async function getCategorie() {
    const data = await _fetchJSON(`${BASE_URL}/categories.php`);
    return data.categories || [];
  }

  async function getListaCategorie() {
    const data = await _fetchJSON(`${BASE_URL}/list.php?c=list`);
    if (!data.meals) return [];
    return data.meals.map(m => m.strCategory);
  }

  async function getListaAree() {
    const data = await _fetchJSON(`${BASE_URL}/list.php?a=list`);
    if (!data.meals) return [];
    return data.meals.map(m => m.strArea);
  }

  async function getListaIngredienti() {
    const data = await _fetchJSON(`${BASE_URL}/list.php?i=list`);
    return data.meals || [];
  }

  async function getRicetteIniziali() {
    const lettere = ["a", "b", "c", "s", "p"];
    const promises = lettere.map(l =>
      _fetchJSON(`${BASE_URL}/search.php?f=${l}`)
        .then(data => _parseMeals(data.meals))
        .catch(() => [])
    );
    const risultati = await Promise.all(promises);
    const tutteRicette = risultati.flat();
    const mappa = new Map();
    tutteRicette.forEach(r => mappa.set(r.id, r));
    return Array.from(mappa.values());
  }

  function _parseMeals(meals) {
    if (!meals || !Array.isArray(meals)) return [];
    return meals.map(m => new Ricetta(m));
  }

  return {
    cercaPerNome,
    getPerID,
    getRandom,
    getPerCategoria,
    getPerArea,
    getCategorie,
    getListaCategorie,
    getListaAree,
    getListaIngredienti,
    getRicetteIniziali
  };

})();
