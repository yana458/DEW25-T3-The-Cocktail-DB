const API_BASE = "https://www.thecocktaildb.com/api/json/v1/1";

const letterSelector = document.getElementById('letter-selector');
const cocktailList = document.getElementById('cocktail-list');
const noResultsText = document.getElementById("no-results");

const cocktailDetail = document.getElementById('cocktail-detail');
const cocktailDetailSection = document.getElementById("cocktail-detail-section");

const ingredientCocktailList = document.getElementById("ingredient-cocktail-list");
const ingredientEmptyText = document.getElementById("ingredient-empty");

//Inicio: crear botones A-Z y cargar último cóctel guardado
createLetterButtons();
loadLastSelectedCocktail();

// Función para crear botones de la A a la Z
function createLetterButtons() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (const letter of letters) {
    const button = document.createElement('button');
    button.textContent = letter;
    button.classList.add("letter-btn");
    button.dataset.letter = letter;


    button.addEventListener('click', () => {
      setActiveLetterButton(letter);
      fetchCocktailsByLetter(letter);
    });

    letterSelector.append(button);
  };
}

function setActiveLetterButton(letter) {
  const allButtons = document.querySelectorAll(".letter-btn");
  allButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.letter === letter);
  });
}


// Llamada API 1: obtener cócteles por letra 
async function fetchCocktailsByLetter(letter) {
  try {
    cocktailList.innerHTML = "Cargando cócteles...";
    noResultsText.classList.add("hidden");

    const response = await fetch(`${API_BASE}/search.php?f=${letter}`);

    if (!response.ok) {
      throw new Error('Error en la red');
    }

    const data = await response.json();

    if (!data.drinks) {
      cocktailList.innerHTML = "";
      noResultsText.classList.remove("hidden");
      return;
    }

    renderCocktailList(data.drinks);
  } catch (err) {
    console.error(err);
    cocktailList.innerHTML = "Error cargando los cócteles.";
  }
}

// Mostrar la lista de cócteles (nombre + foto)
function renderCocktailList(drinks) {
  cocktailList.innerHTML = "";
  noResultsText.classList.add("hidden");

  drinks.forEach(drink => {
    const card = document.createElement("article");
    card.classList.add("card", "clickable");

    card.innerHTML = `
      <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}">
      <div class="card-body">
        <h3 class="card-title">${drink.strDrink}</h3>
        <p class="card-subtitle">${drink.strAlcoholic || ""}</p>
      </div>
    `;

    // Al hacer click, segunda llamada API para obtener detalle completo
    card.addEventListener("click", () => {
      fetchCocktailDetail(drink.idDrink);
    });

    cocktailList.appendChild(card);
  });
}


//Llamada API 2: detalle de un cóctel por id
async function fetchCocktailDetail(idDrink) {
  try {
    cocktailDetail.classList.remove("empty");
    cocktailDetail.innerHTML = "<p>Cargando detalle...</p>";

    const response = await fetch(`${API_BASE}/lookup.php?i=${idDrink}`);
    if (!response.ok) {
      throw new Error('Error en la red');
    }

    const details = await response.json();

    if (!details.drinks || !details.drinks[0]) {
      cocktailDetail.innerHTML = "<p>No se ha encontrado el detalle del cóctel.</p>";
      return;
    }

    const drink = details.drinks[0];
    renderCocktailDetail(drink);

    // Guardar en localStorage el último cóctel seleccionado
    localStorage.setItem("lastCocktailId", id);


  } catch (err) {
    console.error(err);
    cocktailList.innerHTML = "Error cargando los detalles del cóctel.";
  }
}

// Mostrar detalle + ingredientes con fotos
function renderCocktailDetail(drink) {
  const ingredients = [];

  //En la API el máximo de ingredientes y medidas es 15 y al ser propiedades separadas (no array) las recorremos con un for

  for (let i = 1; i <= 15; i++) {
    const ingredient = drink[`strIngredient${i}`];
    const measure = drink[`strMeasure${i}`];

    if (ingredient && ingredient.trim() !== "") {
      ingredients.push({
        name: ingredient.trim(),
        measure: measure ? measure.trim() : ""
      });
    }
  }

 cocktailDetail.innerHTML = "";

  const detailHeader = document.createElement("div");
  detailHeader.classList.add("detail-header");

  const img = document.createElement("img");
  img.src = drink.strDrinkThumb;
  img.alt = drink.strDrink;

  const info = document.createElement("div");
  info.classList.add("detail-info");
  info.innerHTML = `
    <h3>${drink.strDrink}</h3>
    <p><strong>Tipo:</strong> ${drink.strAlcoholic || "Sin definir"}</p>
    <p><strong>Categoría:</strong> ${drink.strCategory || "Sin categoría"}</p>
    <p><strong>Vaso:</strong> ${drink.strGlass || "Sin definir"}</p>
    <p><strong>Instrucciones:</strong> ${drink.strInstructionsES || "No dispone de instrucciones en español"}</p>
  `;

  detailHeader.appendChild(img);
  detailHeader.appendChild(info);

  // Ingredientes
  const ingredientsTitle = document.createElement("h4");
  ingredientsTitle.textContent = "Ingredientes:";

  const ingredientsGrid = document.createElement("div");
  ingredientsGrid.classList.add("ingredients-grid");

  ingredients.forEach(ing => {
    const ingCard = document.createElement("article");
    ingCard.classList.add("card", "ingredient-card", "clickable");

    // URL de imagen de ingredientes de TheCocktailDB
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
   // Al pinchar un ingrediente, mostramos otros cócteles que lo utilizan
    ingCard.addEventListener("click", () => {
      fetchCocktailsByIngredient(ing.name);
    });

    ingredientsGrid.appendChild(ingCard);
  });

  cocktailDetail.appendChild(detailHeader);
  cocktailDetail.appendChild(ingredientsTitle);
  cocktailDetail.appendChild(ingredientsGrid);
}