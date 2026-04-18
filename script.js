const currentYear = document.querySelector("[data-current-year]");
const accessGate = document.querySelector("[data-access-gate]");
const accessForm = document.querySelector("[data-access-form]");
const accessInput = document.querySelector("[data-access-input]");
const accessFeedback = document.querySelector("[data-access-feedback]");
const serviceSearch = document.querySelector("[data-service-search]");
const serviceCards = [...document.querySelectorAll("[data-service-card]")];
const serviceGroups = [...document.querySelectorAll("[data-service-group]")];
const categoryFilters = [...document.querySelectorAll("[data-category-filter]")];
const filterStatus = document.querySelector("[data-filter-status]");
const noResults = document.querySelector("[data-no-results]");
const copyButtons = [...document.querySelectorAll("[data-copy-url]")];
const statusMetricsContainer = document.querySelector("[data-status-metrics]");
const statusServiceList = document.querySelector("[data-service-health-list]");
const statusUpdated = document.querySelector("[data-status-updated]");
const statusFallback = document.querySelector("[data-status-fallback]");

// Temporal: esta clave compartida es visible en frontend y no es segura para producción.
// Reemplazar esta lógica por autenticación real del servidor cuando exista una solución institucional.
const SHARED_ACCESS_PASSWORD = "lamoge-idean";
const ACCESS_SESSION_KEY = "lamogeIntranetAccessGranted";
const STATUS_URL = "./status.json";

let activeCategory = "all";

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function unlockPage() {
  document.body.classList.remove("is-locked");

  if (accessGate) {
    accessGate.setAttribute("aria-hidden", "true");
  }
}

function lockPage() {
  document.body.classList.add("is-locked");

  if (accessGate) {
    accessGate.setAttribute("aria-hidden", "false");
  }
}

function setAccessFeedback(message, isSuccess = false) {
  if (!accessFeedback) {
    return;
  }

  accessFeedback.textContent = message;
  accessFeedback.classList.toggle("is-success", isSuccess);
}

function initializeAccessGate() {
  if (!accessGate || !accessForm || !accessInput) {
    return;
  }

  const hasSessionAccess = window.sessionStorage.getItem(ACCESS_SESSION_KEY) === "true";

  if (hasSessionAccess) {
    unlockPage();
    return;
  }

  lockPage();
  window.setTimeout(() => {
    accessInput.focus();
  }, 40);

  accessForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const submittedPassword = accessInput.value;

    if (submittedPassword === SHARED_ACCESS_PASSWORD) {
      window.sessionStorage.setItem(ACCESS_SESSION_KEY, "true");
      setAccessFeedback("Acceso habilitado.", true);
      unlockPage();
      accessForm.reset();
      return;
    }

    setAccessFeedback("La clave ingresada no es correcta.");
    accessInput.select();
  });
}

function formatNumber(value, decimals = 1) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function getUsageLevel(percent) {
  if (percent >= 90) {
    return { label: "Crítico", className: "status-critical" };
  }

  if (percent >= 75) {
    return { label: "Atención", className: "status-warn" };
  }

  return { label: "Bien", className: "status-good" };
}

function getMemoryLevel(availablePercent) {
  if (availablePercent <= 10) {
    return { label: "Crítico", className: "status-critical" };
  }

  if (availablePercent <= 25) {
    return { label: "Atención", className: "status-warn" };
  }

  return { label: "Bien", className: "status-good" };
}

function getLoadLevel(loadAverage) {
  if (loadAverage >= 8) {
    return { label: "Crítico", className: "status-critical" };
  }

  if (loadAverage >= 4) {
    return { label: "Atención", className: "status-warn" };
  }

  return { label: "Bien", className: "status-good" };
}

function getServiceLevel(serviceStatus) {
  if (serviceStatus === "up" || serviceStatus === "ok") {
    return { label: "Bien", className: "status-good" };
  }

  if (serviceStatus === "degraded" || serviceStatus === "warn") {
    return { label: "Atención", className: "status-warn" };
  }

  return { label: "Crítico", className: "status-critical" };
}

function buildMetricCard({ title, value, help, percent = null, level }) {
  const article = document.createElement("article");
  article.className = percent === null ? "status-card status-card-compact" : "status-card";

  const meterMarkup = percent === null
    ? ""
    : `<div class="status-meter" aria-hidden="true"><span class="${level.className}" style="width: ${Math.max(0, Math.min(percent, 100))}%"></span></div>`;

  article.innerHTML = `
    <div class="status-card-head">
      <h3>${title}</h3>
      <span class="status-pill ${level.className}">${level.label}</span>
    </div>
    <p class="status-value">${value}</p>
    ${meterMarkup}
    <p class="status-help">${help}</p>
  `;

  return article;
}

function renderServerStatus(status) {
  if (!statusMetricsContainer || !statusServiceList || !statusUpdated || !statusFallback) {
    return;
  }

  const memoryAvailablePercent = (status.memory_available_gb / status.memory_total_gb) * 100;
  const datosUsedPercent = (status.datos_used_tb / status.datos_total_tb) * 100;
  const backupUsedPercent = (status.backup_used_tb / status.backup_total_tb) * 100;
  const fastUsedPercent = (status.fast_used_gb / (status.fast_total_tb * 1024)) * 100;

  const metrics = [
    buildMetricCard({
      title: "Memoria disponible",
      value: `${formatNumber(status.memory_available_gb)} GB libres`,
      help: `${formatNumber(memoryAvailablePercent)}% de la memoria total disponible para nuevas tareas.`,
      percent: memoryAvailablePercent,
      level: getMemoryLevel(memoryAvailablePercent),
    }),
    buildMetricCard({
      title: "Uso de /datos",
      value: `${formatNumber(status.datos_used_tb)} de ${formatNumber(status.datos_total_tb)} TB`,
      help: "Espacio principal de trabajo para proyectos, resultados y datos activos.",
      percent: datosUsedPercent,
      level: getUsageLevel(datosUsedPercent),
    }),
    buildMetricCard({
      title: "Uso de /backup",
      value: `${formatNumber(status.backup_used_tb)} de ${formatNumber(status.backup_total_tb)} TB`,
      help: "Espacio de resguardo para copias de seguridad y archivo de información estable.",
      percent: backupUsedPercent,
      level: getUsageLevel(backupUsedPercent),
    }),
    buildMetricCard({
      title: "Uso de /fast",
      value: `${formatNumber(status.fast_used_gb)} de ${formatNumber(status.fast_total_tb * 1024, 0)} GB`,
      help: "Almacenamiento rápido para procesos temporales o flujos de trabajo intensivos.",
      percent: fastUsedPercent,
      level: getUsageLevel(fastUsedPercent),
    }),
    buildMetricCard({
      title: "Carga del sistema",
      value: formatNumber(status.load_average_1m, 2),
      help: "Promedio reciente de carga del sistema. Valores más altos implican más trabajo simultáneo.",
      level: getLoadLevel(status.load_average_1m),
    }),
    buildMetricCard({
      title: "Uptime",
      value: status.uptime_human,
      help: "Tiempo transcurrido desde el último reinicio del servidor.",
      level: { label: "Bien", className: "status-good" },
    }),
  ];

  statusMetricsContainer.replaceChildren(...metrics);

  const serviceLabels = {
    postgresql: "PostgreSQL",
    docker: "Docker",
    geoserver: "GeoServer",
    webodm: "WebODM",
    jupyter: "Jupyter",
  };

  const serviceItems = Object.entries(serviceLabels).map(([key, label]) => {
    const level = getServiceLevel(status.services?.[key]);
    const item = document.createElement("li");
    item.innerHTML = `<span>${label}</span><strong class="${level.className}">${level.label}</strong>`;
    return item;
  });

  statusServiceList.replaceChildren(...serviceItems);
  statusUpdated.textContent = `Última actualización: ${status.updated_at}.`;
  statusFallback.hidden = true;

  const serviceCardHead = statusServiceList.closest(".status-services-card")?.querySelector(".status-card-head .status-pill");

  if (serviceCardHead) {
    const hasCritical = Object.values(status.services || {}).some((value) => getServiceLevel(value).className === "status-critical");
    const hasWarn = Object.values(status.services || {}).some((value) => getServiceLevel(value).className === "status-warn");
    const overall = hasCritical
      ? { label: "Crítico", className: "status-critical" }
      : hasWarn
        ? { label: "Atención", className: "status-warn" }
        : { label: "Bien", className: "status-good" };

    serviceCardHead.textContent = overall.label;
    serviceCardHead.className = `status-pill ${overall.className}`;
  }
}

function showStatusFallback() {
  if (!statusFallback || !statusUpdated || !statusMetricsContainer || !statusServiceList) {
    return;
  }

  statusFallback.hidden = false;
  statusUpdated.textContent = "Última actualización: no disponible.";
}

async function initializeServerStatus() {
  if (!statusMetricsContainer || !statusServiceList) {
    return;
  }

  try {
    const response = await window.fetch(STATUS_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Status HTTP ${response.status}`);
    }

    const status = await response.json();
    renderServerStatus(status);
  } catch (error) {
    showStatusFallback();
  }
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
    administracion: "los accesos de administración y soporte",
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

initializeAccessGate();
initializeServerStatus();
updateServiceFilters();
