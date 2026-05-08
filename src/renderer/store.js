import { reactive } from 'vue'

export const state = reactive({
  screen: 'home', // 'home' | 'project'
  projects: [],
  activeProject: null, // { id, name, lot }
  data: null, // full project snapshot
  dirty: false,
})

export const modals = reactive({
  project: {
    visible: false,
    mode: 'create', // 'create' | 'edit'
    editId: null,
    name: '',
    lot: '',
  },
  delete: {
    visible: false,
    projectId: null,
    projectName: '',
  },
})

export const toast = reactive({ visible: false, message: '', kind: 'success' })
let _toastTimer = null

export function showToast(msg, kind = 'success') {
  Object.assign(toast, { visible: true, message: msg, kind })
  clearTimeout(_toastTimer)
  _toastTimer = setTimeout(() => { toast.visible = false }, 2800)
}

export function showErrorToast(message, error) {
  console.error(message, error)
  const details = error ? `: ${error?.message || String(error)}` : ''
  showToast(`${message}${details}`, 'error')
}

export function markDirty() { state.dirty = true }
export function clearDirty() { state.dirty = false }

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
export function currentMonthLabel() {
  const now = new Date()
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
}
