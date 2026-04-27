"use strict";
// All DOM interaction — talks to main via window.api (preload bridge)

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let state = {
  projects: [],
  activeProject: null, // { id, name, lot }
  data: null, // full snapshot
  dirty: false,
};

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n).toLocaleString("fr-CH");
const icon = (name, opts) =>
  window.HeroIcon ? window.HeroIcon.svg(name, opts) : "";

function showToast(msg, kind = "success") {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove("show"), 2800);
}

function errMsg(error) {
  if (!error) return "Erreur inconnue";
  if (typeof error === "string") return error;
  return error.message || "Erreur inconnue";
}

function showErrorToast(message, error) {
  console.error(message, error);
  const details = error ? `: ${errMsg(error)}` : "";
  showToast(`${message}${details}`, "error");
}

function markDirty() {
  state.dirty = true;
  $("save-bar").classList.remove("hidden");
}

function clearDirty() {
  state.dirty = false;
  $("save-bar").classList.add("hidden");
}

// ─────────────────────────────────────────────
// SCREEN SWITCHING
// ─────────────────────────────────────────────
function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
}

// ─────────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────────
async function loadHome() {
  try {
    showScreen("screen-home");
    state.activeProject = null;
    state.data = null;
    clearDirty();
    state.projects = await window.api.projects.list();
    renderProjectGrid();
  } catch (error) {
    showErrorToast("Impossible de charger la liste des projets", error);
  }
}

function renderProjectGrid() {
  const grid = $("projects-grid");
  if (!state.projects.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        ${icon("plus", { size: 22, className: "empty-hi" })}
        <div class="empty-state-text">Aucun projet — cliquez sur "Nouveau projet" pour commencer</div>
      </div>`;
    return;
  }
  grid.innerHTML = state.projects
    .map(
      (p) => `
    <div class="project-card" data-id="${p.id}">
      <div class="project-card-header">
        <div>
          <div class="project-card-name">${esc(p.name)}</div>
          <div class="project-card-lot">${esc(p.lot || "—")}</div>
        </div>
        <div class="project-card-menu">
          <button class="card-menu-btn" type="button" title="Renommer" data-action="rename" data-id="${p.id}">${icon(
            "pencil-square",
            { size: 16 },
          )}</button>
          <button class="card-menu-btn delete" type="button" title="Supprimer" data-action="delete" data-id="${p.id}">${icon(
            "trash",
            { size: 16 },
          )}</button>
        </div>
      </div>
      <div class="project-card-date">Créé le ${new Date(p.createdAt).toLocaleDateString("fr-CH")}</div>
      <div class="project-card-progress" title="Avancement global">
        <div class="progress-mini">
          <div class="progress-mini-fill" style="width:${Math.max(0, Math.min(100, Number(p.progressPct ?? 0)))}%"></div>
        </div>
        <div class="progress-mini-label">${Number.isFinite(Number(p.progressPct)) ? `${Math.round(Number(p.progressPct))}%` : "—"}</div>
      </div>
    </div>`,
    )
    .join("");

  grid.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", () => openProject(card.dataset.id));
  });

  grid.querySelectorAll('button[data-action="rename"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openRenameModal(btn.dataset.id);
    });
  });
  grid.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDeleteModal(btn.dataset.id);
    });
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────
// OPEN PROJECT
// ─────────────────────────────────────────────
async function openProject(id) {
  try {
    const result = await window.api.projects.open(id);
    state.activeProject = { id: result.id, name: result.name, lot: result.lot };
    state.data = result.data;
    clearDirty();
    showScreen("screen-project");
    renderProjectHeader();
    renderDashboard();
    renderAvancementForms();
    renderBudgetView();
    renderEtapesView();
    renderRisquesView();
    showTab("dashboard");
  } catch (error) {
    showErrorToast("Impossible d'ouvrir le projet", error);
  }
}

function renderProjectHeader() {
  const p = state.activeProject;
  $("proj-name").textContent = p.name;
  $("proj-lot").textContent = p.lot
    ? `Tableau de bord — ${p.lot}`
    : "Tableau de bord";
  const m = state.data.meta;
  $("status-text").textContent = m.statut || "En cours";
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  const now = new Date();
  $("dateLabel").textContent = months[now.getMonth()] + " " + now.getFullYear();
}

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
function showTab(name) {
  document
    .querySelectorAll(".nav-tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".tab-view")
    .forEach((v) => v.classList.remove("active"));
  document
    .querySelector(`.nav-tab[data-tab="${name}"]`)
    .classList.add("active");
  $(`view-${name}`).classList.add("active");
}

// ─────────────────────────────────────────────
// SAVE
// ─────────────────────────────────────────────
async function saveAll() {
  try {
    const d = state.data;
    // Patch simple tables
    await window.api.data.patch("kpi", d.kpi);
    await window.api.data.patch("avancement", d.avancement);
    await window.api.data.patch("technique", d.technique);
    await window.api.data.patch("documentation", d.documentation);
    await window.api.meta.update(d.meta);
    clearDirty();
    renderDashboard();
    showToast("Données sauvegardées");
  } catch (error) {
    showErrorToast("Échec de la sauvegarde", error);
  }
}

// ─────────────────────────────────────────────
// ── DASHBOARD VIEW ──────────────────────────
// ─────────────────────────────────────────────
function renderDashboard() {
  const d = state.data;
  const kpi = d.kpi;
  const av = d.avancement;
  const tec = d.technique;
  const doc = d.documentation;

  const budgetTotal = d.budget.reduce((a, b) => a + +b.budget_reel, 0);
  const utiliseTotal = d.budget.reduce((a, b) => a + +b.utilise, 0);
  const pctGlobal =
    budgetTotal > 0 ? ((utiliseTotal / budgetTotal) * 100).toFixed(1) : 0;

  const C = 194.8;
  const fPct = (+av.finance / 100) * C;
  const docPct = (+av.doc / 100) * C;
  const autoPct = (+av.auto / 100) * C;

  const crBadges = d.cr
    .map((c) => {
      const cls =
        c.statut === "approuve"
          ? "approuve"
          : c.statut === "attention"
            ? "attention"
            : "ouvert";
      const label =
        c.statut === "approuve"
          ? "Approuvé"
          : c.statut === "attention"
            ? "Attention"
            : "Ouvert";
      return `<span class="cr-badge ${cls}">${label} · ${esc(c.ref)}</span>`;
    })
    .join("");

  const etapesHtml = d.etapes
    .map(
      (e) => `
    <div class="etape-item">
      <div class="etape-dot ${e.priorite}"></div>
      <div class="etape-body">
        <div class="etape-title">${esc(e.titre)}</div>
        <div class="etape-desc">${esc(e.description)}</div>
      </div>
      <div class="etape-date ${e.priorite === "red" ? "urgent" : ""}">${esc(e.date_label)}</div>
    </div>`,
    )
    .join("");

  const budgetRows =
    d.budget
      .map((r) => {
        const pct =
          +r.budget_reel > 0
            ? ((+r.utilise / +r.budget_reel) * 100).toFixed(0)
            : 0;
        const cls = pct >= 100 ? "danger" : pct >= 65 ? "warn" : "";
        return `<tr>
      <td>${esc(r.categorie)}</td>
      <td>${fmt(r.budget_reel)}</td>
      <td>${fmt(r.utilise)}</td>
      <td><div class="pct-bar"><div class="mini-bar"><div class="mini-fill ${cls}" style="width:${Math.min(pct, 100)}%"></div></div>${pct}%</div></td>
    </tr>`;
      })
      .join("") +
    `<tr class="total">
    <td>Total</td><td>${fmt(budgetTotal)}</td><td>${fmt(utiliseTotal)}</td>
    <td><div class="pct-bar"><div class="mini-bar"><div class="mini-fill" style="width:${Math.min(pctGlobal, 100)}%"></div></div>${pctGlobal}%</div></td>
  </tr>`;

  $("view-dashboard").innerHTML = `
  <div class="main">
    <!-- KPIs -->
    <div class="grid-4 mb-20">
      <div class="kpi-card"><div class="kpi-value">${esc(kpi.docs)}</div><div class="kpi-label">Documents</div><div class="kpi-sub">Dossier ${esc(kpi.docsRef)}</div></div>
      <div class="kpi-card accent"><div class="kpi-value">${fmt(kpi.io)}</div><div class="kpi-label">Points I/O</div><div class="kpi-sub">+${esc(kpi.ioDelta)} depuis départ</div></div>
      <div class="kpi-card"><div class="kpi-value">${esc(kpi.fs)}</div><div class="kpi-label">FS EM</div><div class="kpi-sub">Optimisé ${esc(kpi.fsInit)} → ${esc(kpi.fs)}</div></div>
      <div class="kpi-card"><div class="kpi-value">${esc(kpi.jalPaid)}/${esc(kpi.jalTotal)}</div><div class="kpi-label">Jalons Payés</div></div>
    </div>

    <!-- Row 2 -->
    <div class="grid-3 mb-20">
      <!-- Avancement général -->
      <div class="card">
        <div class="card-title">Avancement général</div>
        <div class="donut-wrap">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#f0f2f4" stroke-width="14"/>
            <circle cx="50" cy="50" r="38" fill="none" stroke="#4caf85" stroke-width="14"
              stroke-dasharray="${fPct} ${C}" transform="rotate(-90 50 50)"/>
            <circle cx="50" cy="50" r="38" fill="none" stroke="#2d7a5e" stroke-width="14"
              stroke-dasharray="${docPct} ${C}" transform="rotate(-90 50 50)"
              style="stroke-dashoffset:${-fPct}"/>
            <circle cx="50" cy="50" r="38" fill="none" stroke="#3a8c7e" stroke-width="14"
              stroke-dasharray="${autoPct} ${C}" transform="rotate(-90 50 50)"
              style="stroke-dashoffset:${-(fPct + docPct)}"/>
            <text x="50" y="54" text-anchor="middle" font-size="13" font-weight="700" fill="#2c3340" font-family="DM Sans,sans-serif">${av.auto}%</text>
          </svg>
          <div class="donut-legend">
            <div class="legend-item"><div class="legend-dot" style="background:#4caf85"></div><span>Finance · <b>${av.finance}%</b></span></div>
            <div class="legend-item"><div class="legend-dot" style="background:#2d7a5e"></div><span>Documentation · <b>${av.doc}%</b></span></div>
            <div class="legend-item"><div class="legend-dot" style="background:#3a8c7e"></div><span>Automation · <b>${av.auto}%</b></span></div>
          </div>
        </div>
      </div>

      <!-- Détail technique -->
      <div class="card">
        <div class="card-title">Détail avancement</div>
        <div class="progress-row">
          <div class="progress-header"><span class="progress-name">Programmation automatique</span><span class="progress-pct">${tec.prog}%</span></div>
          <div class="progress-track"><div class="progress-fill" style="width:${tec.prog}%"></div></div>
        </div>
        <div class="progress-row">
          <div class="progress-header"><span class="progress-name">Supervision</span><span class="progress-pct">${tec.sup}%</span></div>
          <div class="progress-track"><div class="progress-fill amber" style="width:${tec.sup}%"></div></div>
        </div>
        <div class="progress-row">
          <div class="progress-header"><span class="progress-name">Batch</span><span class="progress-pct">${tec.batch}%</span></div>
          <div class="progress-track"><div class="progress-fill blue" style="width:${tec.batch}%"></div></div>
          <div style="font-size:11px;color:var(--gray-400);margin-top:3px;">${tec.batchProg}/${tec.batchTotal} programmées · ${tec.batchPrete} prêtes</div>
        </div>
      </div>

      <!-- Documentation -->
      <div class="card">
        <div class="card-title">${icon("document-text", { size: 18 })} Documentation</div>
        <div class="donut-wrap">
          <svg width="90" height="90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#f0f2f4" stroke-width="14"/>
            ${(() => {
              const total =
                +doc.appro + +doc.revue + +doc.attente + +doc.nouvelles || 1;
              const a = (+doc.appro / total) * C,
                b = (+doc.revue / total) * C,
                c = (+doc.attente / total) * C,
                dd = (+doc.nouvelles / total) * C;
              return `
                <circle cx="50" cy="50" r="38" fill="none" stroke="#4caf85" stroke-width="14" stroke-dasharray="${a} ${C}" transform="rotate(-90 50 50)"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#e8a020" stroke-width="14" stroke-dasharray="${b} ${C}" transform="rotate(-90 50 50)" style="stroke-dashoffset:${-a}"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#9aa3ad" stroke-width="14" stroke-dasharray="${c} ${C}" transform="rotate(-90 50 50)" style="stroke-dashoffset:${-(a + b)}"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#2e6da4" stroke-width="14" stroke-dasharray="${dd} ${C}" transform="rotate(-90 50 50)" style="stroke-dashoffset:${-(a + b + c)}"/>`;
            })()}
          </svg>
          <div class="donut-legend" style="font-size:11.5px;">
            <div class="legend-item"><div class="legend-dot" style="background:#4caf85"></div><span>Approuvés (<b>${doc.appro}</b>)</span></div>
            <div class="legend-item"><div class="legend-dot" style="background:#e8a020"></div><span>En revue (<b>${doc.revue}</b>)</span></div>
            <div class="legend-item"><div class="legend-dot" style="background:#9aa3ad"></div><span>En attente (<b>${doc.attente}</b>)</span></div>
            <div class="legend-item"><div class="legend-dot" style="background:#2e6da4"></div><span>Nouvelles (<b>${doc.nouvelles}</b>)</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Budget + Utilisation -->
    <div class="grid-2 mb-20">
      <div class="card">
        <div class="card-title">Budget par catégorie</div>
        <table class="budget-table"><thead><tr><th>Catégorie</th><th>Budget Réel</th><th>Utilisé</th><th>%</th></tr></thead>
        <tbody>${budgetRows}</tbody></table>
      </div>
      <div class="card" style="display:flex;flex-direction:column;gap:16px;">
        <div class="card-title">${icon("globe-alt", { size: 18 })} Utilisation Globale</div>
        <div style="text-align:center;">
          <svg width="120" height="120" viewBox="0 0 100 100" style="display:block;margin:auto;">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e6ea" stroke-width="14"/>
            <circle cx="50" cy="50" r="38" fill="none" stroke="#3a8c7e" stroke-width="14"
              stroke-dasharray="${(Math.min(pctGlobal, 100) / 100) * C} ${C}" transform="rotate(-90 50 50)"/>
          </svg>
          <div style="font-size:24px;font-weight:700;margin-top:8px;color:var(--green-dark)">${fmt(utiliseTotal)} CHF</div>
          <div style="font-size:12px;color:var(--gray-400);margin-top:3px;">utilisé sur ${fmt(budgetTotal)} CHF</div>
          <div style="font-size:13px;font-weight:600;color:var(--gray-600);margin-top:2px;">${pctGlobal}%</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Change Requests</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">${crBadges || '<span style="font-size:12px;color:var(--gray-400)">Aucun CR</span>'}</div>
        </div>
      </div>
    </div>

    <!-- Étapes + Risques -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Prochaines étapes</div>
        ${etapesHtml || '<div style="font-size:13px;color:var(--gray-400);">Aucune étape enregistrée</div>'}
      </div>
      <div class="card">
        <div class="card-title">${icon("exclamation-triangle", { size: 18 })} Risques Majeurs</div>
        <table class="budget-table">
          <thead><tr><th>Risque</th><th>Domaine</th><th>Impact</th></tr></thead>
          <tbody>${
            d.risques
              .map(
                (r) => `
            <tr>
              <td style="font-weight:500;">${esc(r.risque)}</td>
              <td><span class="risk-badge ${esc(r.domaine)}">${esc(r.domaine)}</span></td>
              <td style="font-size:12px;color:var(--gray-600);">${esc(r.impact)}</td>
            </tr>`,
              )
              .join("") ||
            '<tr><td colspan="3" style="color:var(--gray-400);font-size:13px;">Aucun risque enregistré</td></tr>'
          }
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// ── AVANCEMENT FORMS ─────────────────────────
// ─────────────────────────────────────────────
function renderAvancementForms() {
  const d = state.data;
  const kpi = d.kpi;
  const av = d.avancement;
  const tec = d.technique;
  const doc = d.documentation;

  $("view-avancement").innerHTML = `
  <div class="main">
    <div class="section-title">Indicateurs clés</div>
    <div class="card mb-20">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Nombre de documents</label><input class="form-input" type="number" data-bind="kpi.docs" value="${kpi.docs}"></div>
        <div class="form-group"><label class="form-label">Référence dossier</label><input class="form-input" type="text" data-bind="kpi.docsRef" value="${esc(kpi.docsRef)}"></div>
        <div class="form-group"><label class="form-label">Points I/O total</label><input class="form-input" type="number" data-bind="kpi.io" value="${kpi.io}"></div>
        <div class="form-group"><label class="form-label">Variation depuis départ</label><input class="form-input" type="number" data-bind="kpi.ioDelta" value="${kpi.ioDelta}"></div>
        <div class="form-group"><label class="form-label">FS EM (optimisé)</label><input class="form-input" type="number" data-bind="kpi.fs" value="${kpi.fs}"></div>
        <div class="form-group"><label class="form-label">FS EM initial</label><input class="form-input" type="number" data-bind="kpi.fsInit" value="${kpi.fsInit}"></div>
        <div class="form-group"><label class="form-label">Jalons payés</label><input class="form-input" type="number" data-bind="kpi.jalPaid" value="${kpi.jalPaid}"></div>
        <div class="form-group"><label class="form-label">Jalons total</label><input class="form-input" type="number" data-bind="kpi.jalTotal" value="${kpi.jalTotal}"></div>
      </div>
    </div>

    <div class="section-title">Avancement par domaine</div>
    <div class="card mb-20">
      <div class="form-row">
        ${rangeField("Finance", "avancement.finance", av.finance)}
        ${rangeField("Documentation", "avancement.doc", av.doc)}
        ${rangeField("Automation", "avancement.auto", av.auto)}
      </div>
    </div>

    <div class="section-title">Détail technique</div>
    <div class="card mb-20">
      <div class="form-row">
        ${rangeField("Programmation automatique", "technique.prog", tec.prog)}
        ${rangeField("Supervision", "technique.sup", tec.sup)}
        ${rangeField("Batch (%)", "technique.batch", tec.batch)}
        <div class="form-group"><label class="form-label">Batch programmées</label><input class="form-input" type="number" data-bind="technique.batchProg" value="${tec.batchProg}"></div>
        <div class="form-group"><label class="form-label">Batch total</label><input class="form-input" type="number" data-bind="technique.batchTotal" value="${tec.batchTotal}"></div>
        <div class="form-group"><label class="form-label">Batch prêtes</label><input class="form-input" type="number" data-bind="technique.batchPrete" value="${tec.batchPrete}"></div>
      </div>
    </div>

    <div class="section-title">${icon("document-text", { size: 18 })} Documentation</div>
    <div class="card">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Approuvés</label><input class="form-input" type="number" data-bind="documentation.appro" value="${doc.appro}"></div>
        <div class="form-group"><label class="form-label">En revue</label><input class="form-input" type="number" data-bind="documentation.revue" value="${doc.revue}"></div>
        <div class="form-group"><label class="form-label">En attente</label><input class="form-input" type="number" data-bind="documentation.attente" value="${doc.attente}"></div>
        <div class="form-group"><label class="form-label">Nouvelles</label><input class="form-input" type="number" data-bind="documentation.nouvelles" value="${doc.nouvelles}"></div>
      </div>
    </div>
  </div>`;

  // Bind all inputs/ranges
  $("view-avancement")
    .querySelectorAll("[data-bind]")
    .forEach((el) => {
      // Initialize pretty fill for range inputs
      if (el.type === "range") {
        const v = Math.max(0, Math.min(100, Number(el.value) || 0));
        el.style.setProperty("--pct", `${v}%`);
        const slider = el.closest(".range-slider");
        if (slider) slider.style.setProperty("--value", String(v));
        const out = el.parentElement?.querySelector?.(".range-output");
        if (out) out.textContent = v + "%";
      }
      el.addEventListener("input", () => {
        const [table, key] = el.getAttribute("data-bind").split(".");
        state.data[table][key] = el.type === "range" ? +el.value : el.value;
        // live-update range labels
        if (el.type === "range") {
          const lbl = el.parentElement.querySelector(".range-lbl");
          if (lbl) lbl.textContent = el.value + "%";
          const v = Math.max(0, Math.min(100, Number(el.value) || 0));
          el.style.setProperty("--pct", `${v}%`);
          const slider = el.closest(".range-slider");
          if (slider) slider.style.setProperty("--value", String(v));
          const out = el.parentElement?.querySelector?.(".range-output");
          if (out) out.textContent = v + "%";
        }
        markDirty();
      });
    });
}

function rangeField(label, bind, val) {
  return `<div class="form-group">
    <label class="form-label">${label} — <span class="range-lbl">${val}%</span></label>
    <div class="range-slider" style="--min:0;--max:100;--value:${Number(val) || 0}">
      <div class="range-slider__progress" aria-hidden="true"></div>
      <input class="form-input progress-range" type="range" min="0" max="100" data-bind="${bind}" value="${val}" style="--pct:${Number(val) || 0}%">
      <output class="range-output">${Number(val) || 0}%</output>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// ── BUDGET VIEW ──────────────────────────────
// ─────────────────────────────────────────────
function renderBudgetView() {
  const d = state.data;
  $("view-budget").innerHTML = `
  <div class="main">
    <div class="section-title">Budget par catégorie</div>
    <div class="card mb-20">
      <table class="editable-table">
        <thead><tr><th>Catégorie</th><th>Budget Réel (CHF)</th><th>Utilisé (CHF)</th><th></th></tr></thead>
        <tbody id="budget-tbody"></tbody>
      </table>
      <button class="add-btn" id="budget-add-btn">${icon("plus", {
        size: 16,
      })} Ajouter une catégorie</button>
    </div>

    <div class="section-title">Change Requests</div>
    <div class="card">
      <table class="editable-table">
        <thead><tr><th>Référence</th><th>Statut</th><th>Description</th><th></th></tr></thead>
        <tbody id="cr-tbody"></tbody>
      </table>
      <button class="add-btn" id="cr-add-btn">${icon("plus", {
        size: 16,
      })} Ajouter un CR</button>
    </div>
  </div>`;

  renderBudgetRows();
  renderCRRows();
  $("budget-add-btn").onclick = addBudgetRow;
  $("cr-add-btn").onclick = addCRRow;
}

function renderBudgetRows() {
  $("budget-tbody").innerHTML = state.data.budget
    .map(
      (r, i) => `
    <tr>
      <td><input class="form-input" value="${esc(r.categorie)}" onchange="updateBudget(${i},'categorie',this.value)"></td>
      <td><input class="form-input" type="number" value="${r.budget_reel}" onchange="updateBudget(${i},'budget_reel',+this.value)"></td>
      <td><input class="form-input" type="number" value="${r.utilise}" onchange="updateBudget(${i},'utilise',+this.value)"></td>
      <td><button class="del-btn" onclick="deleteBudget(${i})" title="Supprimer">${icon(
        "x-mark",
        { size: 16 },
      )}</button></td>
    </tr>`,
    )
    .join("");
}

async function updateBudget(i, field, value) {
  try {
    state.data.budget[i][field] = value;
    await window.api.budget.update(state.data.budget[i]);
    renderDashboard();
    showToast("Budget mis à jour");
  } catch (error) {
    showErrorToast("Impossible de mettre à jour le budget", error);
  }
}
async function addBudgetRow() {
  try {
    const row = await window.api.budget.add({
      categorie: "Nouvelle catégorie",
      budget_reel: 0,
      utilise: 0,
    });
    state.data.budget.push(row);
    renderBudgetRows();
    renderDashboard();
  } catch (error) {
    showErrorToast("Impossible d'ajouter une catégorie budget", error);
  }
}
async function deleteBudget(i) {
  try {
    await window.api.budget.delete(state.data.budget[i].id);
    state.data.budget.splice(i, 1);
    renderBudgetRows();
    renderDashboard();
  } catch (error) {
    showErrorToast("Impossible de supprimer la catégorie budget", error);
  }
}

function renderCRRows() {
  $("cr-tbody").innerHTML = state.data.cr
    .map(
      (r, i) => `
    <tr>
      <td><input class="form-input" value="${esc(r.ref)}" onchange="updateCR(${i},'ref',this.value)"></td>
      <td>
        <select class="form-select" onchange="updateCR(${i},'statut',this.value)">
          <option value="approuve"  ${r.statut === "approuve" ? "selected" : ""}>Approuvé</option>
          <option value="attention" ${r.statut === "attention" ? "selected" : ""}>Attention</option>
          <option value="ouvert"    ${r.statut === "ouvert" ? "selected" : ""}>Ouvert</option>
        </select>
      </td>
      <td><input class="form-input" value="${esc(r.description)}" onchange="updateCR(${i},'description',this.value)"></td>
      <td><button class="del-btn" onclick="deleteCR(${i})" title="Supprimer">${icon(
        "x-mark",
        { size: 16 },
      )}</button></td>
    </tr>`,
    )
    .join("");
}

async function updateCR(i, field, value) {
  try {
    state.data.cr[i][field] = value;
    await window.api.cr.update(state.data.cr[i]);
    renderDashboard();
  } catch (error) {
    showErrorToast("Impossible de mettre à jour le CR", error);
  }
}
async function addCRRow() {
  try {
    const n = state.data.cr.length + 1;
    const row = await window.api.cr.add({
      ref: `CRS-${String(n).padStart(3, "0")}`,
      statut: "ouvert",
      description: "",
    });
    state.data.cr.push(row);
    renderCRRows();
    renderDashboard();
  } catch (error) {
    showErrorToast("Impossible d'ajouter un CR", error);
  }
}
async function deleteCR(i) {
  try {
    await window.api.cr.delete(state.data.cr[i].id);
    state.data.cr.splice(i, 1);
    renderCRRows();
    renderDashboard();
  } catch (error) {
    showErrorToast("Impossible de supprimer le CR", error);
  }
}

// ─────────────────────────────────────────────
// ── ÉTAPES VIEW ──────────────────────────────
// ─────────────────────────────────────────────
function renderEtapesView() {
  $("view-etapes").innerHTML = `
  <div class="main">
    <div class="section-title">Prochaines étapes</div>
    <div class="card">
      <table class="editable-table">
        <thead><tr><th>Titre</th><th>Date / Période</th><th>Description</th><th>Priorité</th><th></th></tr></thead>
        <tbody id="etapes-tbody"></tbody>
      </table>
      <button class="add-btn" id="etapes-add-btn">${icon("plus", {
        size: 16,
      })} Ajouter une étape</button>
    </div>
  </div>`;
  renderEtapesRows();
  $("etapes-add-btn").onclick = addEtapeRow;
}

function renderEtapesRows() {
  $("etapes-tbody").innerHTML = state.data.etapes
    .map(
      (r, i) => `
    <tr>
      <td><input class="form-input" value="${esc(r.titre)}" onchange="updateEtape(${i},'titre',this.value)"></td>
      <td><input class="form-input" value="${esc(r.date_label)}" onchange="updateEtape(${i},'date_label',this.value)"></td>
      <td><input class="form-input" value="${esc(r.description)}" onchange="updateEtape(${i},'description',this.value)"></td>
      <td>
        <select class="form-select" onchange="updateEtape(${i},'priorite',this.value)">
          <option value="dark"   ${r.priorite === "dark" ? "selected" : ""}>Normal</option>
          <option value="orange" ${r.priorite === "orange" ? "selected" : ""}>Attention</option>
          <option value="red"    ${r.priorite === "red" ? "selected" : ""}>Urgent</option>
        </select>
      </td>
      <td><button class="del-btn" onclick="deleteEtape(${i})" title="Supprimer">${icon(
        "x-mark",
        { size: 16 },
      )}</button></td>
    </tr>`,
    )
    .join("");
}

async function updateEtape(i, field, value) {
  try {
    state.data.etapes[i][field] = value;
    await window.api.etapes.update(state.data.etapes[i]);
    renderDashboard();
  } catch (error) {
    showErrorToast("Impossible de mettre à jour l'étape", error);
  }
}
async function addEtapeRow() {
  try {
    const row = await window.api.etapes.add({
      titre: "Nouvelle étape",
      date_label: "",
      description: "",
      priorite: "dark",
    });
    state.data.etapes.push(row);
    renderEtapesRows();
    renderDashboard();
  } catch (error) {
    showErrorToast("Impossible d'ajouter une étape", error);
  }
}
async function deleteEtape(i) {
  try {
    await window.api.etapes.delete(state.data.etapes[i].id);
    state.data.etapes.splice(i, 1);
    renderEtapesRows();
    renderDashboard();
  } catch (error) {
    showErrorToast("Impossible de supprimer l'étape", error);
  }
}

// ─────────────────────────────────────────────
// ── RISQUES VIEW ─────────────────────────────
// ─────────────────────────────────────────────
function renderRisquesView() {
  $("view-risques").innerHTML = `
  <div class="main">
    <div class="section-title">${icon("exclamation-triangle", { size: 18 })} Risques majeurs</div>
    <div class="card">
      <table class="editable-table">
        <thead><tr><th>Risque</th><th>Domaine</th><th>Impact</th><th></th></tr></thead>
        <tbody id="risques-tbody"></tbody>
      </table>
      <button class="add-btn" id="risques-add-btn">${icon("plus", {
        size: 16,
      })} Ajouter un risque</button>
    </div>
  </div>`;
  renderRisquesRows();
  $("risques-add-btn").onclick = addRisqueRow;
}

function renderRisquesRows() {
  $("risques-tbody").innerHTML = state.data.risques
    .map(
      (r, i) => `
    <tr>
      <td><input class="form-input" value="${esc(r.risque)}" onchange="updateRisque(${i},'risque',this.value)"></td>
      <td>
        <select class="form-select" onchange="updateRisque(${i},'domaine',this.value)">
          ${["Technique", "Fournisseur", "Financier", "Planning", "Autre"]
            .map(
              (d) =>
                `<option value="${d}" ${r.domaine === d ? "selected" : ""}>${d}</option>`,
            )
            .join("")}
        </select>
      </td>
      <td><input class="form-input" value="${esc(r.impact)}" onchange="updateRisque(${i},'impact',this.value)"></td>
      <td><button class="del-btn" onclick="deleteRisque(${i})" title="Supprimer">${icon(
        "x-mark",
        { size: 16 },
      )}</button></td>
    </tr>`,
    )
    .join("");
}

async function updateRisque(i, field, value) {
  try {
    state.data.risques[i][field] = value;
    await window.api.risques.update(state.data.risques[i]);
    renderDashboard();
  } catch (error) {
    showErrorToast("Impossible de mettre à jour le risque", error);
  }
}
async function addRisqueRow() {
  try {
    const row = await window.api.risques.add({
      risque: "Nouveau risque",
      domaine: "Technique",
      impact: "",
    });
    state.data.risques.push(row);
    renderRisquesRows();
    renderDashboard();
  } catch (error) {
    showErrorToast("Impossible d'ajouter un risque", error);
  }
}
async function deleteRisque(i) {
  try {
    await window.api.risques.delete(state.data.risques[i].id);
    state.data.risques.splice(i, 1);
    renderRisquesRows();
    renderDashboard();
  } catch (error) {
    showErrorToast("Impossible de supprimer le risque", error);
  }
}

// ─────────────────────────────────────────────
// ── MODALS ───────────────────────────────────
// ─────────────────────────────────────────────
let _editProjectId = null;

function openNewProjectModal() {
  _editProjectId = null;
  $("modal-project-title").textContent = "Nouveau projet";
  $("modal-project-confirm").textContent = "Créer";
  $("modal-proj-name").value = "";
  $("modal-proj-lot").value = "";
  $("modal-project").classList.remove("hidden");
  $("modal-proj-name").focus();
}

function openRenameModal(id) {
  const p = state.projects.find((x) => x.id === id);
  if (!p) return;
  _editProjectId = id;
  $("modal-project-title").textContent = "Renommer le projet";
  $("modal-project-confirm").textContent = "Enregistrer";
  $("modal-proj-name").value = p.name;
  $("modal-proj-lot").value = p.lot || "";
  $("modal-project").classList.remove("hidden");
  $("modal-proj-name").focus();
}

async function confirmProjectModal() {
  try {
    const name = $("modal-proj-name").value.trim();
    const lot = $("modal-proj-lot").value.trim();
    if (!name) {
      $("modal-proj-name").focus();
      return;
    }
    $("modal-project").classList.add("hidden");

    if (_editProjectId) {
      await window.api.projects.rename(_editProjectId, name, lot);
      state.projects = await window.api.projects.list();
      renderProjectGrid();
      showToast("Projet renommé");
    } else {
      const proj = await window.api.projects.create(name, lot);
      state.projects.push(proj);
      renderProjectGrid();
      showToast("Projet créé");
      await openProject(proj.id);
    }
  } catch (error) {
    showErrorToast("Impossible d'enregistrer le projet", error);
  }
}

let _deleteId = null;
let _deleteName = "";

function normalizeForMatch(s) {
  return String(s || "")
    .trim()
    .toLocaleLowerCase("fr-CH");
}

function deleteConfirmationOk() {
  const input = $("modal-delete-input");
  const typed = normalizeForMatch(input?.value);
  const name = normalizeForMatch(_deleteName);
  if (!typed || !name) return false;
  return typed.includes(name);
}

function updateDeleteConfirmState() {
  const btn = $("modal-delete-confirm");
  const input = $("modal-delete-input");
  const ok = deleteConfirmationOk();
  if (btn) btn.disabled = !ok;
  if (input) input.setAttribute("aria-invalid", ok ? "false" : "true");
}

function openDeleteModal(id) {
  const p = state.projects.find((x) => x.id === id);
  _deleteId = id;
  _deleteName = p?.name || "";
  $("modal-delete-text").textContent =
    `Supprimer "${p?.name}" ? Cette action est irréversible, toutes les données seront perdues.`;
  $("modal-delete-input").value = "";
  updateDeleteConfirmState();
  $("modal-delete").classList.remove("hidden");
  $("modal-delete-input").focus();
}

async function confirmDelete() {
  try {
    if (!deleteConfirmationOk()) {
      updateDeleteConfirmState();
      $("modal-delete-input").focus();
      showToast(`Veuillez saisir le nom du projet: "${_deleteName}"`, "error");
      return;
    }
    await window.api.projects.delete(_deleteId);
    $("modal-delete").classList.add("hidden");
    state.projects = await window.api.projects.list();
    renderProjectGrid();
    showToast("Projet supprimé");
  } catch (error) {
    showErrorToast("Impossible de supprimer le projet", error);
  }
}

// ─────────────────────────────────────────────
// ── EVENT LISTENERS ──────────────────────────
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // OS-specific layout tweaks (Electron titlebar / traffic lights)
  const ua = navigator.userAgent || "";
  if (/\bWindows\b/i.test(ua)) document.body.classList.add("os-win");
  if (/\bMacintosh\b|\bMac OS X\b/i.test(ua))
    document.body.classList.add("os-mac");

  // Static icons (HTML placeholders)
  const setIcon = (selector, name, size) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.innerHTML = icon(name, { size });
  };
  setIcon("#btn-new-project .btn-icon", "plus", 16);
  setIcon("#btn-back .back-icon", "arrow-left", 16);
  setIcon("#btn-settings .icon-btn-icon", "ellipsis-horizontal", 18);
  setIcon("#btn-open-data-folder .link-icon", "folder-open", 15);
  setIcon("#btn-open-logs-folder .link-icon", "document-text", 15);
  setIcon("#btn-check-updates .link-icon", "arrow-path-rounded-square", 15);

  window.addEventListener("unhandledrejection", (event) => {
    event.preventDefault();
    showErrorToast("Erreur inattendue", event.reason);
  });

  // Home
  $("btn-new-project").onclick = openNewProjectModal;
  $("btn-open-data-folder").onclick = async () => {
    try {
      await window.api.shell.openDataFolder();
    } catch (error) {
      showErrorToast("Impossible d'ouvrir le dossier de données", error);
    }
  };
  $("btn-open-logs-folder").onclick = async () => {
    try {
      await window.api.shell.openLogsFolder();
    } catch (error) {
      showErrorToast("Impossible d'ouvrir le dossier de logs", error);
    }
  };
  $("btn-check-updates").onclick = async () => {
    try {
      const result = await window.api.updater.check();
      if (result?.skipped) {
        showToast(
          "Vérification des mises à jour indisponible en mode développement",
        );
        return;
      }
      if (result?.version) {
        showToast(`Mise à jour détectée: v${result.version}`);
        return;
      }
      showToast("Application déjà à jour");
    } catch (error) {
      showErrorToast("Échec de la vérification des mises à jour", error);
    }
  };

  // Modal project
  $("modal-project-cancel").onclick = () =>
    $("modal-project").classList.add("hidden");
  $("modal-project-confirm").onclick = confirmProjectModal;
  $("modal-proj-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") confirmProjectModal();
  });

  // Modal delete
  $("modal-delete-cancel").onclick = () =>
    $("modal-delete").classList.add("hidden");
  $("modal-delete-confirm").onclick = confirmDelete;
  $("modal-delete-input").addEventListener("input", updateDeleteConfirmState);
  $("modal-delete-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") confirmDelete();
  });

  // Close modals on backdrop click
  ["modal-project", "modal-delete"].forEach((id) => {
    $(id).addEventListener("click", (e) => {
      if (e.target === $(id)) $(id).classList.add("hidden");
    });
  });

  // Back btn
  $("btn-back").onclick = loadHome;

  // Nav tabs
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => showTab(tab.dataset.tab));
  });

  // Save
  $("btn-save").onclick = saveAll;

  // Settings btn → could open a project settings modal in v2
  $("btn-settings").onclick = () => {
    if (state.activeProject) openRenameModal(state.activeProject.id);
  };

  // Keyboard shortcut: Cmd/Ctrl+S
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      if (state.dirty) saveAll();
    }
  });

  // Boot
  loadHome();
});
