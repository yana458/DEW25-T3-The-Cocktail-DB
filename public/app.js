//"use strict";

const API_BASE = "https://www.thecocktaildb.com/api/json/v1/1";

// Elementos del DOM
const letterSelector = document.getElementById("letter-selector");
const cocktailListEl = document.getElementById("cocktail-list");
const noResultsEl = document.getElementById("no-results");

const cocktailDetailEl = document.getElementById("cocktail-detail");
const ingredientCocktailListEl = document.getElementById("ingredient-cocktail-list");
const ingredientEmptyEl = document.getElementById("ingredient-empty");

// Inicio
document.addEventListener("DOMContentLoaded", () => {
  initLetterButtons();
  loadLastSelectedCocktail();
});

/* --------- Selector de letras A-Z --------- */

function initLetterButtons() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  letters.forEach((letter) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = letter;
    btn.classList.add("letter-btn");
    btn.dataset.letter = letter;

    btn.addEventListener("click", () => {
      setActiveLetter(letter);
      fetchCocktailsByLetter(letter);
    });

    letterSelector.appendChild(btn);
  });
}

function setActiveLetter(letter) {
  letterSelector.querySelectorAll(".letter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.letter === letter);
  });
}

/* --------Llamada API: cócteles por letra ----------*/

async function fetchCocktailsByLetter(letter) {
  cocktailListEl.innerHTML = "<p>Cargando cócteles...</p>";
  noResultsEl.classList.add("hidden");

  try {
    const response = await fetch(`${API_BASE}/search.php?f=${letter}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const drinks = data.drinks;

    if (!drinks) {
      cocktailListEl.innerHTML = "";
      noResultsEl.classList.remove("hidden");
      return;
    }

    renderCocktailList(drinks);
  } catch (err) {
    console.error("Error en fetchCocktailsByLetter:", err);
    cocktailListEl.innerHTML = "<p>Error cargando los cócteles.</p>";
  }
}

function renderCocktailList(drinks) {
  cocktailListEl.innerHTML = "";
  noResultsEl.classList.add("hidden");

  drinks.forEach((drink) => {
    const card = document.createElement("article");
    card.className = "card clickable";
    card.dataset.id = drink.idDrink;

    card.innerHTML = `
      <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}">
      <div class="card-body">
        <h3 class="card-title">${drink.strDrink}</h3>
        <p class="card-subtitle">${drink.strAlcoholic || ""}</p>
      </div>
    `;

    // Al hacer clic en un cóctel se muestra el detalle
    card.addEventListener("click", () => {
      fetchCocktailDetail(drink.idDrink);
    });

    cocktailListEl.appendChild(card);
  });
}

/* --------- Llamada API: detalle de un cóctel por id -------- */

async function fetchCocktailDetail(idDrink) {
  cocktailDetailEl.innerHTML = "<p>Cargando detalle del cóctel...</p>";

  try {
    const response = await fetch(`${API_BASE}/lookup.php?i=${idDrink}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.drinks || !data.drinks[0]) {
      cocktailDetailEl.innerHTML =
        "<p>No se ha encontrado el detalle del cóctel.</p>";
      return;
    }

    const drink = data.drinks[0];
    renderCocktailDetail(drink);
    
    // Guardar en localStorage el último cóctel (envuelto en try para evitar que rompa)
    try {
      localStorage.setItem("lastCocktailId", idDrink);
    } catch (e) {
      console.warn("No se pudo guardar en localStorage:", e);
    }
  } catch (err) {
    console.error("Error en fetchCocktailDetail:", err);
    cocktailDetailEl.innerHTML =
      "<p>Error cargando los detalles del cóctel.</p>";
  }
}

/* -------- Mostrar detalle + ingredientes con fotos ---------- */

function renderCocktailDetail(drink) {
  const ingredients = [];

  // La API tiene strIngredient1..15 y strMeasure1..15
  for (let i = 1; i <= 15; i++) {
    const name = drink[`strIngredient${i}`];
    const measure = drink[`strMeasure${i}`];

    if (name && name.trim()) {
      ingredients.push({
        name: name.trim(),
        measure: measure ? measure.trim() : "",
      });
    }
  }

  cocktailDetailEl.innerHTML = "";

  // Cabecera del detalle
  const detailHeader = document.createElement("div");
  detailHeader.className = "detail-header";

  const img = document.createElement("img");
  img.src = drink.strDrinkThumb;
  img.alt = drink.strDrink;

  const info = document.createElement("div");
  info.className = "detail-info";
  info.innerHTML = `
    <h3>${drink.strDrink}</h3>
    <p><strong>Tipo:</strong> ${drink.strAlcoholic || "Sin definir"}</p>
    <p><strong>Categoría:</strong> ${drink.strCategory || "Sin categoría"}</p>
    <p><strong>Vaso:</strong> ${drink.strGlass || "Sin definir"}</p>
    <p><strong>Instrucciones:</strong> ${
      drink.strInstructionsES ||
      drink.strInstructions ||
      "Sin instrucciones disponibles."
    }</p>
  `;

  detailHeader.appendChild(img);
  detailHeader.appendChild(info);

  // Ingredientes
  const ingredientsTitle = document.createElement("h4");
  ingredientsTitle.textContent = "Ingredientes:";

  const ingredientsGrid = document.createElement("div");
  ingredientsGrid.className = "ingredients-grid";

  ingredients.forEach((ing) => {
    const ingCard = document.createElement("article");
    ingCard.className = "card ingredient-card clickable";

    const imgUrl = `https://www.thecocktaildb.com/images/ingredients/${encodeURIComponent(
      ing.name
    )}-Medium.png`;

    ingCard.innerHTML = `
      <img src="${imgUrl}" alt="${ing.name}">
      <div class="card-body">
        <p class="ingredient-name">${ing.name}</p>
        <p class="card-subtitle">${ing.measure}</p>
      </div>
    `;

    // Al hacer clic en un ingrediente se miestran los resultados en la 3ª columna
    ingCard.addEventListener("click", () => {
      fetchCocktailsByIngredient(ing.name);
    });

    ingredientsGrid.appendChild(ingCard);
  });

  cocktailDetailEl.appendChild(detailHeader);
  cocktailDetailEl.appendChild(ingredientsTitle);
  cocktailDetailEl.appendChild(ingredientsGrid);
}

/* ------------ Llamada API: cócteles por ingrediente --------------*/

async function fetchCocktailsByIngredient(ingredient) {
  ingredientEmptyEl.classList.add("hidden");
  ingredientCocktailListEl.innerHTML = `<p>Buscando cócteles con "${ingredient}"...</p>`;

  try {
    // La API usa guiones bajos para espacios en muchos filtros (Ordinary_Drink, etc.)
    const ingredientParam = ingredient.trim().replace(/\s+/g, "_");

    const response = await fetch(
      `${API_BASE}/filter.php?i=${encodeURIComponent(ingredientParam)}`
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const drinks = data.drinks;

    if (!drinks) {
      ingredientCocktailListEl.innerHTML = `<p>No se han encontrado cócteles con ${ingredient}.</p>`;
      return;
    }

    renderIngredientCocktails(drinks, ingredient);
  } catch (err) {
    console.error("Error en fetchCocktailsByIngredient:", err);
    ingredientCocktailListEl.innerHTML =
      "<p>Error cargando cócteles por ingrediente.</p>";
  }
}

function renderIngredientCocktails(drinks, ingredient) {
  ingredientCocktailListEl.innerHTML = "";

  drinks.forEach((drink) => {
    const card = document.createElement("article");
    card.className = "card clickable";

    card.innerHTML = `
      <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}">
      <div class="card-body">
        <h3 class="card-title">${drink.strDrink}</h3>
        <p class="card-subtitle">Incluye: ${ingredient}</p>
      </div>
    `;

    // Si hacemos clic en uno de estos vuelve a mostrar el detalle en la columna central
    card.addEventListener("click", () => {
      fetchCocktailDetail(drink.idDrink);
    });

    ingredientCocktailListEl.appendChild(card);
  });
}

/* ------------ Cargar último cóctel desde localStorage ----------*/

function loadLastSelectedCocktail() {
  try {
    const lastId = localStorage.getItem("lastCocktailId");
    if (lastId) {
      fetchCocktailDetail(lastId);
    } else {
      ingredientEmptyEl.classList.remove("hidden");
    }
  } catch (err) {
    console.warn("No se pudo acceder a localStorage:", err);
    ingredientEmptyEl.classList.remove("hidden");
  }
}
