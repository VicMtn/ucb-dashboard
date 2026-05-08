<template>
  <Teleport to="body">
    <div
      v-if="modals.project.visible"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm"
      @click.self="modals.project.visible = false"
    >
      <div class="bg-white rounded-[14px] p-7 w-[420px] shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <div class="text-base font-bold mb-5">
          {{ modals.project.mode === 'create' ? 'Nouveau projet' : 'Renommer le projet' }}
        </div>

        <div class="mb-[14px]">
          <label class="block text-[11.5px] font-semibold text-gray-custom-600 mb-[5px]">Nom du projet *</label>
          <input
            ref="nameInput"
            v-model="name"
            class="w-full px-[11px] py-2 border border-gray-custom-200 rounded-[7px] text-[13px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid focus:shadow-[0_0_0_3px_rgba(45,122,94,0.1)]"
            placeholder="ex. PEG2BUL · Automation"
            @keydown.enter="confirm"
          />
        </div>

        <div class="mb-[14px]">
          <label class="block text-[11.5px] font-semibold text-gray-custom-600 mb-[5px]">Lot / Référence</label>
          <input
            v-model="lot"
            class="w-full px-[11px] py-2 border border-gray-custom-200 rounded-[7px] text-[13px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid focus:shadow-[0_0_0_3px_rgba(45,122,94,0.1)]"
            placeholder="ex. Lot 411"
          />
        </div>

        <div class="flex gap-[10px] justify-end mt-5">
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-[7px] text-[13px] font-semibold font-sans cursor-pointer border-0 bg-gray-custom-100 text-gray-custom-600 border border-gray-custom-200 hover:bg-gray-custom-200 transition-all"
            @click="modals.project.visible = false"
          >Annuler</button>
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-[7px] text-[13px] font-semibold font-sans cursor-pointer border-0 bg-ucb-dark text-white hover:bg-ucb-mid transition-all"
            @click="confirm"
          >{{ modals.project.mode === 'create' ? 'Créer' : 'Enregistrer' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { modals, confirmProjectModal } from '../../actions.js'

const name = ref('')
const lot = ref('')
const nameInput = ref(null)

watch(() => modals.project.visible, (visible) => {
  if (visible) {
    name.value = modals.project.name
    lot.value = modals.project.lot
    nextTick(() => nameInput.value?.focus())
  }
})

function confirm() {
  if (!name.value.trim()) {
    nameInput.value?.focus()
    return
  }
  confirmProjectModal(name.value.trim(), lot.value.trim())
}
</script>
