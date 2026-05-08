import { state, modals, showToast, showErrorToast, markDirty, clearDirty } from './store.js'

// ── Home ──────────────────────────────────────
export async function loadHome() {
  try {
    state.screen = 'home'
    state.activeProject = null
    state.data = null
    clearDirty()
    state.projects = await window.api.projects.list()
  } catch (error) {
    showErrorToast('Impossible de charger la liste des projets', error)
  }
}

// ── Project ───────────────────────────────────
export async function openProject(id) {
  try {
    const result = await window.api.projects.open(id)
    state.activeProject = { id: result.id, name: result.name, lot: result.lot }
    state.data = result.data
    clearDirty()
    state.screen = 'project'
  } catch (error) {
    showErrorToast("Impossible d'ouvrir le projet", error)
  }
}

// ── Save ──────────────────────────────────────
export async function saveAll() {
  try {
    const d = state.data
    await window.api.data.patch('kpi', d.kpi)
    await window.api.data.patch('avancement', d.avancement)
    await window.api.data.patch('technique', d.technique)
    await window.api.data.patch('documentation', d.documentation)
    await window.api.meta.update(d.meta)
    clearDirty()
    showToast('Données sauvegardées')
  } catch (error) {
    showErrorToast('Échec de la sauvegarde', error)
  }
}

// ── Project modal ─────────────────────────────
export function openNewProjectModal() {
  Object.assign(modals.project, { visible: true, mode: 'create', editId: null, name: '', lot: '' })
}

export function openRenameModal(id) {
  const p = state.projects.find((x) => x.id === id)
  if (!p) return
  Object.assign(modals.project, { visible: true, mode: 'edit', editId: id, name: p.name, lot: p.lot || '' })
}

export async function confirmProjectModal(name, lot) {
  try {
    const { editId } = modals.project
    modals.project.visible = false
    if (editId) {
      await window.api.projects.rename(editId, name, lot)
      state.projects = await window.api.projects.list()
      showToast('Projet renommé')
    } else {
      const proj = await window.api.projects.create(name, lot)
      state.projects.push(proj)
      showToast('Projet créé')
      await openProject(proj.id)
    }
  } catch (error) {
    showErrorToast("Impossible d'enregistrer le projet", error)
  }
}

// ── Delete modal ──────────────────────────────
export function openDeleteModal(id) {
  const p = state.projects.find((x) => x.id === id)
  Object.assign(modals.delete, { visible: true, projectId: id, projectName: p?.name || '' })
}

export async function confirmDelete() {
  try {
    const { projectId } = modals.delete
    await window.api.projects.delete(projectId)
    modals.delete.visible = false
    state.projects = await window.api.projects.list()
    showToast('Projet supprimé')
  } catch (error) {
    showErrorToast('Impossible de supprimer le projet', error)
  }
}

// ── Budget CRUD ───────────────────────────────
export async function updateBudget(index, field, value) {
  try {
    state.data.budget[index][field] = value
    await window.api.budget.update(state.data.budget[index])
  } catch (error) {
    showErrorToast('Impossible de mettre à jour le budget', error)
  }
}

export async function addBudgetRow() {
  try {
    const row = await window.api.budget.add({ categorie: 'Nouvelle catégorie', budget_reel: 0, utilise: 0 })
    state.data.budget.push(row)
  } catch (error) {
    showErrorToast("Impossible d'ajouter une catégorie budget", error)
  }
}

export async function deleteBudget(index) {
  try {
    await window.api.budget.delete(state.data.budget[index].id)
    state.data.budget.splice(index, 1)
  } catch (error) {
    showErrorToast('Impossible de supprimer la catégorie budget', error)
  }
}

// ── CR CRUD ───────────────────────────────────
export async function updateCR(index, field, value) {
  try {
    state.data.cr[index][field] = value
    await window.api.cr.update(state.data.cr[index])
  } catch (error) {
    showErrorToast('Impossible de mettre à jour le CR', error)
  }
}

export async function addCRRow() {
  try {
    const n = state.data.cr.length + 1
    const row = await window.api.cr.add({ ref: `CRS-${String(n).padStart(3, '0')}`, statut: 'ouvert', description: '' })
    state.data.cr.push(row)
  } catch (error) {
    showErrorToast("Impossible d'ajouter un CR", error)
  }
}

export async function deleteCR(index) {
  try {
    await window.api.cr.delete(state.data.cr[index].id)
    state.data.cr.splice(index, 1)
  } catch (error) {
    showErrorToast('Impossible de supprimer le CR', error)
  }
}

// ── Étapes CRUD ───────────────────────────────
export async function updateEtape(index, field, value) {
  try {
    state.data.etapes[index][field] = value
    await window.api.etapes.update(state.data.etapes[index])
  } catch (error) {
    showErrorToast("Impossible de mettre à jour l'étape", error)
  }
}

export async function addEtapeRow() {
  try {
    const row = await window.api.etapes.add({ titre: 'Nouvelle étape', date_label: '', description: '', priorite: 'dark' })
    state.data.etapes.push(row)
  } catch (error) {
    showErrorToast("Impossible d'ajouter une étape", error)
  }
}

export async function deleteEtape(index) {
  try {
    await window.api.etapes.delete(state.data.etapes[index].id)
    state.data.etapes.splice(index, 1)
  } catch (error) {
    showErrorToast("Impossible de supprimer l'étape", error)
  }
}

// ── Risques CRUD ──────────────────────────────
export async function updateRisque(index, field, value) {
  try {
    state.data.risques[index][field] = value
    await window.api.risques.update(state.data.risques[index])
  } catch (error) {
    showErrorToast('Impossible de mettre à jour le risque', error)
  }
}

export async function addRisqueRow() {
  try {
    const row = await window.api.risques.add({ risque: 'Nouveau risque', domaine: 'Technique', impact: '' })
    state.data.risques.push(row)
  } catch (error) {
    showErrorToast("Impossible d'ajouter un risque", error)
  }
}

export async function deleteRisque(index) {
  try {
    await window.api.risques.delete(state.data.risques[index].id)
    state.data.risques.splice(index, 1)
  } catch (error) {
    showErrorToast('Impossible de supprimer le risque', error)
  }
}

// Re-export state for convenience
export { state, modals, showToast, showErrorToast, markDirty, clearDirty }
