<template>
  <Teleport to="body">
    <div
      v-if="modals.delete.visible"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm"
      @click.self="modals.delete.visible = false"
    >
      <div class="bg-white rounded-[14px] p-7 w-[360px] shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <div class="text-base font-bold mb-5 text-danger">Supprimer le projet</div>

        <p class="text-[13px] text-gray-custom-600 mb-5">
          Supprimer "{{ modals.delete.projectName }}" ? Cette action est irréversible, toutes les données seront perdues.
        </p>

        <div class="mb-[14px]">
          <label class="block text-[11.5px] font-semibold text-gray-custom-600 mb-[5px]">Tapez le nom du projet pour confirmer</label>
          <input
            ref="deleteInput"
            v-model="typed"
            class="w-full px-[11px] py-2 border border-gray-custom-200 rounded-[7px] text-[13px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid"
            placeholder="Nom du projet"
            autocomplete="off"
            @keydown.enter="confirm"
          />
          <div class="text-[11.5px] text-gray-custom-400 mt-1.5">Cette action est irréversible.</div>
        </div>

        <div class="flex gap-[10px] justify-end mt-5">
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-[7px] text-[13px] font-semibold font-sans cursor-pointer bg-gray-custom-100 text-gray-custom-600 border border-gray-custom-200 hover:bg-gray-custom-200 transition-all"
            @click="modals.delete.visible = false"
          >Annuler</button>
          <button
            :disabled="!canConfirm"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-[7px] text-[13px] font-semibold font-sans cursor-pointer bg-danger-pale text-danger border border-[#f0b8b4] hover:bg-[#fbd5d0] disabled:opacity-55 disabled:cursor-not-allowed transition-all"
            @click="confirm"
          >Supprimer définitivement</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { modals, confirmDelete } from '../../actions.js'

const typed = ref('')
const deleteInput = ref(null)

watch(() => modals.delete.visible, (visible) => {
  if (visible) {
    typed.value = ''
    nextTick(() => deleteInput.value?.focus())
  }
})

const canConfirm = computed(() => {
  const t = typed.value.trim().toLocaleLowerCase('fr-CH')
  const n = (modals.delete.projectName || '').trim().toLocaleLowerCase('fr-CH')
  return t && n && t.includes(n)
})

function confirm() {
  if (!canConfirm.value) return
  confirmDelete()
}
</script>
