const currentYear = document.querySelector("[data-current-year]");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

const serviceSearch = document.querySelector("[data-service-search]");
const serviceCards = [...document.querySelectorAll("[data-service-card]")];
const serviceGroups = [...document.querySelectorAll("[data-service-group]")];
const categoryFilters = [...document.querySelectorAll("[data-category-filter]")];
const filterStatus = document.querySelector("[data-filter-status]");
const noResults = document.querySelector("[data-no-results]");
const copyButtons = [...document.querySelectorAll("[data-copy-url]")];

let activeCategory = "all";

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function updateServiceFilters() {
  if (!serviceCards.length) {
    return;
  }

  const searchTerm = normalizeText(serviceSearch ? serviceSearch.value.trim() : "");
  let visibleCards = 0;

  serviceCards.forEach((card) => {
    const category = card.dataset.category || "";
    const searchText = normalizeText(card.dataset.searchText || card.textContent || "");
    const matchesCategory = activeCategory === "all" || category === activeCategory;
    const matchesSearch = !searchTerm || searchText.includes(searchTerm);
    const isVisible = matchesCategory && matchesSearch;

    card.hidden = !isVisible;

    if (isVisible) {
      visibleCards += 1;
    }
  });

  serviceGroups.forEach((group) => {
    const visibleInGroup = group.querySelector("[data-service-card]:not([hidden])");
    group.hidden = !visibleInGroup;
  });

  if (noResults) {
    noResults.hidden = visibleCards !== 0;
  }

  if (!filterStatus) {
    return;
  }

  const labels = {
    all: "todos los accesos",
    servicios: "los servicios de trabajo",
    administracion: "los accesos de administración",
  };

  if (visibleCards === 0) {
    filterStatus.textContent = "No hay resultados para los criterios seleccionados.";
    return;
  }

  if (searchTerm) {
    filterStatus.textContent = `Mostrando ${visibleCards} resultado(s) en ${labels[activeCategory]}.`;
    return;
  }

  filterStatus.textContent = activeCategory === "all"
    ? "Mostrando todos los accesos."
    : `Mostrando ${labels[activeCategory]}.`;
}

if (serviceSearch && serviceCards.length) {
  serviceSearch.addEventListener("input", updateServiceFilters);
}

if (categoryFilters.length && serviceCards.length) {
  categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.categoryFilter || "all";

      categoryFilters.forEach((filterButton) => {
        const isActive = filterButton === button;
        filterButton.classList.toggle("is-active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
      });

      updateServiceFilters();
    });
  });
}

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const url = button.dataset.copyUrl;
    const label = button.dataset.copyLabel || "URL";

    if (!url || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      const originalText = button.textContent;

      button.textContent = "URL copiada";
      button.classList.add("is-copied");
      button.setAttribute("aria-label", `URL de ${label} copiada`);

      window.setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("is-copied");
        button.setAttribute("aria-label", `Copiar URL de ${label}`);
      }, 1800);
    } catch (error) {
      button.textContent = "No se pudo copiar";

      window.setTimeout(() => {
        button.textContent = "Copiar URL";
      }, 1800);
    }
  });
});

updateServiceFilters();
