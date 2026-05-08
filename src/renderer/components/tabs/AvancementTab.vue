<template>
  <div class="px-6 py-6 max-w-[1280px] mx-auto" v-if="d">
    <!-- KPIs -->
    <div class="text-[12px] font-bold text-gray-custom-400 uppercase tracking-[0.7px] mb-[14px] flex items-center gap-2 section-title">
      Indicateurs clés
    </div>
    <div class="bg-white rounded-[10px] border border-gray-custom-200 p-5 shadow-card mb-5">
      <div class="grid gap-3" style="grid-template-columns: 1fr 1fr">
        <div v-for="f in kpiFields" :key="f.key" class="mb-[14px]">
          <label class="block text-[11.5px] font-semibold text-gray-custom-600 mb-[5px]">{{ f.label }}</label>
          <input
            class="w-full px-[11px] py-2 border border-gray-custom-200 rounded-[7px] text-[13px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid focus:shadow-[0_0_0_3px_rgba(46,109,164,0.1)]"
            :type="f.type ?? 'number'"
            :value="d.kpi[f.key]"
            @input="onKpi(f.key, $event.target.value)"
          />
        </div>
      </div>
    </div>

    <!-- Avancement par domaine -->
    <div class="text-[12px] font-bold text-gray-custom-400 uppercase tracking-[0.7px] mb-[14px] flex items-center gap-2 section-title">
      Avancement par domaine
    </div>
    <div class="bg-white rounded-[10px] border border-gray-custom-200 p-5 shadow-card mb-5">
      <div class="grid gap-3" style="grid-template-columns: 1fr 1fr">
        <RangeSlider label="Finance" :model-value="Number(d.avancement.finance)" @update:model-value="onRange('avancement', 'finance', $event)" />
        <RangeSlider label="Documentation" :model-value="Number(d.avancement.doc)" @update:model-value="onRange('avancement', 'doc', $event)" />
        <RangeSlider label="Automation" :model-value="Number(d.avancement.auto)" @update:model-value="onRange('avancement', 'auto', $event)" />
      </div>
    </div>

    <!-- Détail technique -->
    <div class="text-[12px] font-bold text-gray-custom-400 uppercase tracking-[0.7px] mb-[14px] flex items-center gap-2 section-title">
      Détail technique
    </div>
    <div class="bg-white rounded-[10px] border border-gray-custom-200 p-5 shadow-card mb-5">
      <div class="grid gap-3" style="grid-template-columns: 1fr 1fr">
        <RangeSlider label="Programmation automatique" :model-value="Number(d.technique.prog)" @update:model-value="onRange('technique', 'prog', $event)" />
        <RangeSlider label="Supervision" :model-value="Number(d.technique.sup)" @update:model-value="onRange('technique', 'sup', $event)" />
        <RangeSlider label="Batch (%)" :model-value="Number(d.technique.batch)" @update:model-value="onRange('technique', 'batch', $event)" />
        <div class="mb-[14px]">
          <label class="block text-[11.5px] font-semibold text-gray-custom-600 mb-[5px]">Batch programmées</label>
          <input class="w-full px-[11px] py-2 border border-gray-custom-200 rounded-[7px] text-[13px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid" type="number" :value="d.technique.batchProg" @input="onTechnique('batchProg', $event.target.value)" />
        </div>
        <div class="mb-[14px]">
          <label class="block text-[11.5px] font-semibold text-gray-custom-600 mb-[5px]">Batch total</label>
          <input class="w-full px-[11px] py-2 border border-gray-custom-200 rounded-[7px] text-[13px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid" type="number" :value="d.technique.batchTotal" @input="onTechnique('batchTotal', $event.target.value)" />
        </div>
        <div class="mb-[14px]">
          <label class="block text-[11.5px] font-semibold text-gray-custom-600 mb-[5px]">Batch prêtes</label>
          <input class="w-full px-[11px] py-2 border border-gray-custom-200 rounded-[7px] text-[13px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid" type="number" :value="d.technique.batchPrete" @input="onTechnique('batchPrete', $event.target.value)" />
        </div>
      </div>
    </div>

    <!-- Documentation -->
    <div class="text-[12px] font-bold text-gray-custom-400 uppercase tracking-[0.7px] mb-[14px] flex items-center gap-2 section-title">
      Documentation
    </div>
    <div class="bg-white rounded-[10px] border border-gray-custom-200 p-5 shadow-card">
      <div class="grid gap-3" style="grid-template-columns: 1fr 1fr">
        <div v-for="f in docFields" :key="f.key" class="mb-[14px]">
          <label class="block text-[11.5px] font-semibold text-gray-custom-600 mb-[5px]">{{ f.label }}</label>
          <input class="w-full px-[11px] py-2 border border-gray-custom-200 rounded-[7px] text-[13px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid" type="number" :value="d.documentation[f.key]" @input="onDoc(f.key, $event.target.value)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { state, markDirty } from '../../store.js'
import RangeSlider from '../ui/RangeSlider.vue'

const d = computed(() => state.data)

const kpiFields = [
  { key: 'docs', label: 'Nombre de documents' },
  { key: 'docsRef', label: 'Référence dossier', type: 'text' },
  { key: 'io', label: 'Points I/O total' },
  { key: 'ioDelta', label: 'Variation depuis départ' },
  { key: 'fs', label: 'FS EM (optimisé)' },
  { key: 'fsInit', label: 'FS EM initial' },
  { key: 'jalPaid', label: 'Jalons payés' },
  { key: 'jalTotal', label: 'Jalons total' },
]

const docFields = [
  { key: 'appro', label: 'Approuvés' },
  { key: 'revue', label: 'En revue' },
  { key: 'attente', label: 'En attente' },
  { key: 'nouvelles', label: 'Nouvelles' },
]

function onKpi(key, value) {
  state.data.kpi[key] = value
  markDirty()
}
function onRange(table, key, value) {
  state.data[table][key] = value
  markDirty()
}
function onTechnique(key, value) {
  state.data.technique[key] = value
  markDirty()
}
function onDoc(key, value) {
  state.data.documentation[key] = value
  markDirty()
}
</script>
