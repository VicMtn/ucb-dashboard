<template>
  <div class="h-screen overflow-hidden flex flex-col">
    <HomeScreen v-if="state.screen === 'home'" />
    <ProjectScreen v-else-if="state.screen === 'project'" />
    <ProjectModal />
    <DeleteModal />
    <TheToast />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { state, saveAll, showErrorToast } from './actions.js'
import HomeScreen from './components/HomeScreen.vue'
import ProjectScreen from './components/ProjectScreen.vue'
import ProjectModal from './components/modals/ProjectModal.vue'
import DeleteModal from './components/modals/DeleteModal.vue'
import TheToast from './components/TheToast.vue'

function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    if (state.dirty) saveAll()
  }
}

function onUnhandledRejection(event) {
  event.preventDefault()
  showErrorToast('Une erreur inattendue s\'est produite', event.reason)
}

onMounted(() => {
  // Apply to body so body.os-mac / body.os-win CSS selectors resolve correctly
  const ua = navigator.userAgent || ''
  if (/\bWindows\b/i.test(ua)) document.body.classList.add('os-win')
  else if (/\bMacintosh\b|\bMac OS X\b/i.test(ua)) document.body.classList.add('os-mac')
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('unhandledrejection', onUnhandledRejection)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('unhandledrejection', onUnhandledRejection)
})
</script>
