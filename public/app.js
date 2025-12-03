const letterSelector = document.getElementById('letter-selector');
const cocktailList = document.getElementById('cocktail-list');
const cocktailDetail = document.getElementById('cocktail-detail');
const cocktailIngredientsList = document.getElementById('ingredient-cocktail-list');

createLetterButtons();

function createLetterButtons() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (const letter of letters) {
        const boton = document.createElement('button');
        boton.textContent = letter;
        boton.classList.add("letter-btn");
        boton.dataset.letter = letter;


        letterSelector.addEventListener('click', () => {
            setActiveLetterButton(letter);
            fetchCocktailsByLetter(letter);
        });

        letterSelector.append(boton);
    };

   
}

function setActiveLetterButton(letter) {
    const allButtons = document.querySelectorAll(".letter-btn");
    allButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.letter === letter);
    });
}

const API_BASE = "https://www.thecocktaildb.com/api/json/v1/1";
// Llamada 1: obtener cócteles por letra 
async function fetchCocktailsByLetter(letter){
try {
    cocktailList.innerHTML = "Cargando cócteles...";
    noResultsText.classList.add("hidden");

    const res = await fetch(`${API_BASE}/search.php?f=${letter}`);
    const data = await res.json();

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
