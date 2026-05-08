<template>
  <div class="relative h-full overflow-hidden flex flex-col">
    <!-- Background -->
    <div class="fixed inset-0 z-0" style="background: linear-gradient(135deg, #0f2338 0%, #1f4f7a 50%, #2e6da4 100%)">
      <div class="fixed inset-0" style="background: radial-gradient(ellipse 80% 60% at 70% 40%, rgba(74,144,226,0.14) 0%, transparent 70%)" />
    </div>

    <!-- Content -->
    <div
      class="relative z-10 flex flex-col h-full overflow-hidden px-[52px] pb-10"
      :style="{ paddingTop: `calc(40px + var(--window-top-padding))` }"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-12">
        <div class="flex items-center gap-[18px]">
          <img
            :src="logoUrl"
            alt="UCB-Automation"
            class="w-14 h-14 rounded-[12px] bg-white border border-black/[8%] object-contain block"
          />
          <div>
            <div class="text-[22px] font-bold text-white">UCB-Automation Dashboard</div>
            <div class="text-[13px] text-white/50 mt-0.5">Gestion de projets Automation</div>
          </div>
        </div>
        <button
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-[7px] text-[13px] font-semibold font-sans cursor-pointer bg-ucb-dark text-white border-0 hover:bg-ucb-mid transition-all"
          @click="openNewProjectModal"
        >
          <HeroIcon name="plus" :size="16" />
          Nouveau projet
        </button>
      </div>

      <!-- Projects grid -->
      <div class="grid gap-4 overflow-y-auto flex-1 p-2 pb-4" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))">
        <div
          v-if="!state.projects.length"
          class="flex flex-col items-center justify-center h-[280px] text-white/30 border border-dashed border-white/[12%] rounded-xl gap-[10px]"
          style="grid-column: 1/-1"
        >
          <HeroIcon name="plus" :size="40" class="opacity-55" />
          <div class="text-[14px]">Aucun projet — cliquez sur "Nouveau projet" pour commencer</div>
        </div>

        <ProjectCard
          v-for="project in state.projects"
          :key="project.id"
          :project="project"
          @open="openProject"
          @rename="openRenameModal"
          @delete="openDeleteModal"
        />
      </div>

      <!-- Footer -->
      <div class="mt-6 flex justify-end gap-[18px]">
        <button
          class="bg-transparent border-0 cursor-pointer text-white/70 text-[12px] font-sans transition-colors inline-flex items-center gap-2 hover:text-white/82"
          @click="onOpenDataFolder"
        >
          <HeroIcon name="folder-open" :size="15" />
          Ouvrir le dossier de données
        </button>
        <button
          class="bg-transparent border-0 cursor-pointer text-white/70 text-[12px] font-sans transition-colors inline-flex items-center gap-2 hover:text-white/82"
          @click="onOpenLogsFolder"
        >
          <HeroIcon name="document-text" :size="15" />
          Ouvrir les logs
        </button>
        <button
          class="bg-transparent border-0 cursor-pointer text-white/70 text-[12px] font-sans transition-colors inline-flex items-center gap-2 hover:text-white/82"
          @click="onCheckUpdates"
        >
          <HeroIcon name="arrow-path-rounded-square" :size="15" />
          Vérifier les mises à jour
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { state, openProject, openNewProjectModal, openRenameModal, openDeleteModal, showToast, showErrorToast } from '../actions.js'
import ProjectCard from './ProjectCard.vue'
import HeroIcon from './ui/HeroIcon.vue'
import logoUrl from '../../assets/UCB_logo.png'

onMounted(() => {
  loadProjects()
})

async function loadProjects() {
  try {
    state.projects = await window.api.projects.list()
  } catch (error) {
    showErrorToast('Impossible de charger la liste des projets', error)
  }
}

async function onOpenDataFolder() {
  try { await window.api.shell.openDataFolder() }
  catch (error) { showErrorToast("Impossible d'ouvrir le dossier de données", error) }
}

async function onOpenLogsFolder() {
  try { await window.api.shell.openLogsFolder() }
  catch (error) { showErrorToast("Impossible d'ouvrir le dossier de logs", error) }
}

async function onCheckUpdates() {
  try {
    const result = await window.api.updater.check()
    if (result?.skipped) { showToast('Vérification des mises à jour indisponible en mode développement'); return }
    if (result?.version) { showToast(`Mise à jour détectée: v${result.version}`); return }
    showToast('Application déjà à jour')
  } catch (error) {
    showErrorToast('Échec de la vérification des mises à jour', error)
  }
}
</script>
