<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div
      class="bg-white border-b border-gray-custom-200 flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.06)] shrink-0 header-drag"
      :style="{ paddingTop: `calc(10px + var(--window-top-padding))`, paddingBottom: '10px', paddingLeft: `calc(24px + var(--window-left-padding))`, paddingRight: '24px' }"
    >
      <div class="flex items-center gap-3 header-no-drag">
        <button
          class="bg-gray-custom-100 border border-gray-custom-200 text-gray-custom-600 px-3 py-1.5 rounded-[7px] text-[12.5px] font-medium cursor-pointer font-sans transition-all inline-flex items-center gap-2 hover:bg-gray-custom-200"
          @click="goBack"
        >
          <HeroIcon name="arrow-left" :size="16" />
          Projets
        </button>
        <div class="w-px h-6 bg-gray-custom-200" />
        <div>
          <div class="text-[14px] font-semibold">{{ state.activeProject?.name }}</div>
          <div class="text-[11.5px] text-gray-custom-400 mt-px">
            {{ state.activeProject?.lot ? `Tableau de bord — ${state.activeProject.lot}` : 'Tableau de bord' }}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3 header-no-drag">
        <span class="text-[12px] text-gray-custom-400 font-medium">{{ monthLabel }}</span>
        <div class="flex items-center gap-1.5 bg-ucb-pale text-ucb-dark border border-[#b8d0ee] text-[11.5px] font-medium px-[10px] py-1 rounded-full">
          <div class="w-[7px] h-[7px] rounded-full bg-ucb-light" />
          <span>{{ state.data?.meta?.statut || 'En cours' }}</span>
        </div>
        <button
          class="bg-gray-custom-100 border border-gray-custom-200 text-gray-custom-600 w-8 h-8 rounded-[7px] cursor-pointer flex items-center justify-center transition-all hover:bg-gray-custom-200"
          title="Paramètres du projet"
          @click="onSettings"
        >
          <HeroIcon name="ellipsis-horizontal" :size="18" />
        </button>
      </div>
    </div>

    <!-- Nav tabs -->
    <div class="bg-white border-b border-gray-custom-200 px-6 flex shrink-0">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        class="px-4 py-[11px] text-[13px] font-medium cursor-pointer border-b-2 transition-all user-select-none bg-transparent border-x-0 border-t-0"
        :class="activeTab === tab.key
          ? 'text-ucb-dark border-b-ucb-mid font-semibold'
          : 'text-gray-custom-400 border-b-transparent hover:text-ucb-dark'"
        @click="activeTab = tab.key"
      >{{ tab.label }}</button>
    </div>

    <!-- Save bar -->
    <div
      v-if="state.dirty"
      class="bg-ucb-dark text-white px-6 py-2 flex items-center justify-between text-[13px] shrink-0"
    >
      <span>Modifications non sauvegardées</span>
      <button
        class="bg-ucb-light text-white border-0 px-4 py-1.5 rounded-[6px] text-[13px] font-semibold cursor-pointer font-sans transition-colors hover:bg-[#255f8f]"
        @click="saveAll"
      >Sauvegarder</button>
    </div>

    <!-- Tab content -->
    <div class="flex-1 overflow-y-auto">
      <DashboardTab v-show="activeTab === 'dashboard'" />
      <AvancementTab v-show="activeTab === 'avancement'" />
      <BudgetTab v-show="activeTab === 'budget'" />
      <EtapesTab v-show="activeTab === 'etapes'" />
      <RisquesTab v-show="activeTab === 'risques'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { state, saveAll, openRenameModal, loadHome } from '../actions.js'
import HeroIcon from './ui/HeroIcon.vue'
import DashboardTab from './tabs/DashboardTab.vue'
import AvancementTab from './tabs/AvancementTab.vue'
import BudgetTab from './tabs/BudgetTab.vue'
import EtapesTab from './tabs/EtapesTab.vue'
import RisquesTab from './tabs/RisquesTab.vue'
import { currentMonthLabel } from '../store.js'

const TABS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'avancement', label: 'Avancement' },
  { key: 'budget', label: 'Budget' },
  { key: 'etapes', label: 'Étapes' },
  { key: 'risques', label: 'Risques' },
]

const activeTab = ref('dashboard')
const monthLabel = computed(() => currentMonthLabel())

function goBack() {
  loadHome()
}

function onSettings() {
  if (state.activeProject) openRenameModal(state.activeProject.id)
}
</script>
