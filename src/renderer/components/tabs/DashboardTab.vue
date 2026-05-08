<template>
  <div class="px-6 py-6 max-w-[1280px] mx-auto" v-if="d">
    <!-- KPI row -->
    <div class="grid gap-[14px] mb-5" style="grid-template-columns: repeat(4, 1fr)">
      <div class="bg-white rounded-[10px] border border-gray-custom-200 px-5 py-[18px] shadow-card">
        <div class="text-[28px] font-bold leading-none">{{ d.kpi.docs }}</div>
        <div class="text-[10.5px] font-bold uppercase tracking-[0.6px] text-gray-custom-400 mt-1">Documents</div>
        <div class="text-[11.5px] text-gray-custom-400 mt-[5px]">Dossier {{ d.kpi.docsRef }}</div>
      </div>
      <div class="bg-ucb-pale border border-[#b8d0ee] rounded-[10px] px-5 py-[18px] shadow-card">
        <div class="text-[28px] font-bold leading-none text-ucb-dark">{{ fmt(d.kpi.io) }}</div>
        <div class="text-[10.5px] font-bold uppercase tracking-[0.6px] text-gray-custom-400 mt-1">Points I/O</div>
        <div class="text-[11.5px] text-gray-custom-400 mt-[5px]">+{{ d.kpi.ioDelta }} depuis départ</div>
      </div>
      <div class="bg-white rounded-[10px] border border-gray-custom-200 px-5 py-[18px] shadow-card">
        <div class="text-[28px] font-bold leading-none">{{ d.kpi.fs }}</div>
        <div class="text-[10.5px] font-bold uppercase tracking-[0.6px] text-gray-custom-400 mt-1">FS EM</div>
        <div class="text-[11.5px] text-gray-custom-400 mt-[5px]">Optimisé {{ d.kpi.fsInit }} → {{ d.kpi.fs }}</div>
      </div>
      <div class="bg-white rounded-[10px] border border-gray-custom-200 px-5 py-[18px] shadow-card">
        <div class="text-[28px] font-bold leading-none">{{ d.kpi.jalPaid }}/{{ d.kpi.jalTotal }}</div>
        <div class="text-[10.5px] font-bold uppercase tracking-[0.6px] text-gray-custom-400 mt-1">Jalons Payés</div>
      </div>
    </div>

    <!-- Row 2: Avancement + Détail + Documentation -->
    <div class="grid gap-[14px] mb-5" style="grid-template-columns: repeat(3, 1fr)">
      <!-- Avancement général -->
      <div class="bg-white rounded-[10px] border border-gray-custom-200 p-5 shadow-card">
        <div class="text-[11px] font-bold uppercase tracking-[0.6px] text-gray-custom-400 mb-4">Avancement général</div>
        <DonutChart :segments="avancementSegments" :center-text="`${d.avancement.auto}%`">
          <div class="flex items-center gap-[7px] text-[12px]">
            <div class="w-[9px] h-[9px] rounded-full shrink-0" style="background:#4caf85" />
            <span>Finance · <b>{{ d.avancement.finance }}%</b></span>
          </div>
          <div class="flex items-center gap-[7px] text-[12px]">
            <div class="w-[9px] h-[9px] rounded-full shrink-0" style="background:#2d7a5e" />
            <span>Documentation · <b>{{ d.avancement.doc }}%</b></span>
          </div>
          <div class="flex items-center gap-[7px] text-[12px]">
            <div class="w-[9px] h-[9px] rounded-full shrink-0" style="background:#3a8c7e" />
            <span>Automation · <b>{{ d.avancement.auto }}%</b></span>
          </div>
        </DonutChart>
      </div>

      <!-- Détail avancement -->
      <div class="bg-white rounded-[10px] border border-gray-custom-200 p-5 shadow-card">
        <div class="text-[11px] font-bold uppercase tracking-[0.6px] text-gray-custom-400 mb-4">Détail avancement</div>
        <div v-for="bar in techniqueBars" :key="bar.label" class="mb-[14px]">
          <div class="flex justify-between items-center mb-1.5">
            <span class="text-[13px] font-medium">{{ bar.label }}</span>
            <span class="text-[13px] font-semibold text-ucb-dark font-mono">{{ bar.value }}%</span>
          </div>
          <div class="h-2 bg-gray-custom-100 rounded-[10px] overflow-hidden">
            <div class="h-full rounded-[10px] transition-[width] duration-300" :class="bar.colorClass" :style="{ width: `${bar.value}%` }" />
          </div>
          <div v-if="bar.sub" class="text-[11px] text-gray-custom-400 mt-[3px]">{{ bar.sub }}</div>
        </div>
      </div>

      <!-- Documentation -->
      <div class="bg-white rounded-[10px] border border-gray-custom-200 p-5 shadow-card">
        <div class="text-[11px] font-bold uppercase tracking-[0.6px] text-gray-custom-400 mb-4 flex items-center gap-[7px]">
          <HeroIcon name="document-text" :size="18" /> Documentation
        </div>
        <DonutChart :segments="docSegments" :total="docTotal" :size="90">
          <div class="flex items-center gap-[7px] text-[11.5px]">
            <div class="w-[9px] h-[9px] rounded-full shrink-0" style="background:#4caf85" />
            <span>Approuvés (<b>{{ d.documentation.appro }}</b>)</span>
          </div>
          <div class="flex items-center gap-[7px] text-[11.5px]">
            <div class="w-[9px] h-[9px] rounded-full shrink-0" style="background:#e8a020" />
            <span>En revue (<b>{{ d.documentation.revue }}</b>)</span>
          </div>
          <div class="flex items-center gap-[7px] text-[11.5px]">
            <div class="w-[9px] h-[9px] rounded-full shrink-0" style="background:#9aa3ad" />
            <span>En attente (<b>{{ d.documentation.attente }}</b>)</span>
          </div>
          <div class="flex items-center gap-[7px] text-[11.5px]">
            <div class="w-[9px] h-[9px] rounded-full shrink-0" style="background:#2e6da4" />
            <span>Nouvelles (<b>{{ d.documentation.nouvelles }}</b>)</span>
          </div>
        </DonutChart>
      </div>
    </div>

    <!-- Row 3: Budget + Utilisation globale -->
    <div class="grid gap-[14px] mb-5" style="grid-template-columns: repeat(2, 1fr)">
      <!-- Budget table -->
      <div class="bg-white rounded-[10px] border border-gray-custom-200 p-5 shadow-card">
        <div class="text-[11px] font-bold uppercase tracking-[0.6px] text-gray-custom-400 mb-4">Budget par catégorie</div>
        <table class="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th class="text-left px-[10px] py-2 text-[10.5px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] border-b-2 border-gray-custom-200">Catégorie</th>
              <th class="text-right px-[10px] py-2 text-[10.5px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] border-b-2 border-gray-custom-200">Budget Réel</th>
              <th class="text-right px-[10px] py-2 text-[10.5px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] border-b-2 border-gray-custom-200">Utilisé</th>
              <th class="text-right px-[10px] py-2 text-[10.5px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] border-b-2 border-gray-custom-200">%</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in d.budget" :key="row.id" class="border-b border-gray-custom-100">
              <td class="px-[10px] py-[10px]">{{ row.categorie }}</td>
              <td class="px-[10px] py-[10px] text-right font-mono text-[12.5px]">{{ fmt(row.budget_reel) }}</td>
              <td class="px-[10px] py-[10px] text-right font-mono text-[12.5px]">{{ fmt(row.utilise) }}</td>
              <td class="px-[10px] py-[10px] text-right">
                <div class="flex items-center gap-2 justify-end">
                  <div class="w-[60px] h-[5px] bg-gray-custom-200 rounded-[3px] overflow-hidden">
                    <div class="h-full rounded-[3px]" :class="barClass(row)" :style="{ width: `${barPct(row)}%` }" />
                  </div>
                  {{ barPct(row) }}%
                </div>
              </td>
            </tr>
            <tr class="font-bold border-t-2 border-gray-custom-200">
              <td class="px-[10px] py-[10px]">Total</td>
              <td class="px-[10px] py-[10px] text-right font-mono text-[12.5px]">{{ fmt(budgetTotal) }}</td>
              <td class="px-[10px] py-[10px] text-right font-mono text-[12.5px]">{{ fmt(utiliseTotal) }}</td>
              <td class="px-[10px] py-[10px] text-right">
                <div class="flex items-center gap-2 justify-end">
                  <div class="w-[60px] h-[5px] bg-gray-custom-200 rounded-[3px] overflow-hidden">
                    <div class="h-full bg-ucb-mid rounded-[3px]" :style="{ width: `${Math.min(Number(pctGlobal), 100)}%` }" />
                  </div>
                  {{ pctGlobal }}%
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Utilisation globale + CR -->
      <div class="bg-white rounded-[10px] border border-gray-custom-200 p-5 shadow-card flex flex-col gap-4">
        <div class="text-[11px] font-bold uppercase tracking-[0.6px] text-gray-custom-400 flex items-center gap-[7px]">
          <HeroIcon name="globe-alt" :size="18" /> Utilisation Globale
        </div>
        <div class="text-center">
          <svg width="120" height="120" viewBox="0 0 100 100" class="block mx-auto">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e6ea" stroke-width="14" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#3a8c7e" stroke-width="14"
              :stroke-dasharray="`${(Math.min(Number(pctGlobal), 100) / 100) * 194.8} 194.8`"
              transform="rotate(-90 50 50)" />
          </svg>
          <div class="text-[24px] font-bold mt-2 text-ucb-dark">{{ fmt(utiliseTotal) }} CHF</div>
          <div class="text-[12px] text-gray-custom-400 mt-[3px]">utilisé sur {{ fmt(budgetTotal) }} CHF</div>
          <div class="text-[13px] font-semibold text-gray-custom-600 mt-0.5">{{ pctGlobal }}%</div>
        </div>
        <div>
          <div class="text-[11px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] mb-2">Change Requests</div>
          <div class="flex gap-2 flex-wrap">
            <span v-if="!d.cr.length" class="text-[12px] text-gray-custom-400">Aucun CR</span>
            <span
              v-for="cr in d.cr"
              :key="cr.id"
              class="inline-flex items-center gap-[5px] px-[9px] py-[3px] rounded-[5px] text-[11.5px] font-semibold border"
              :class="crBadgeClass(cr.statut)"
            >{{ crLabel(cr.statut) }} · {{ cr.ref }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 4: Étapes + Risques -->
    <div class="grid gap-[14px]" style="grid-template-columns: repeat(2, 1fr)">
      <!-- Étapes -->
      <div class="bg-white rounded-[10px] border border-gray-custom-200 p-5 shadow-card">
        <div class="text-[11px] font-bold uppercase tracking-[0.6px] text-gray-custom-400 mb-4">Prochaines étapes</div>
        <div v-if="!d.etapes.length" class="text-[13px] text-gray-custom-400">Aucune étape enregistrée</div>
        <div v-for="e in d.etapes" :key="e.id" class="flex items-start gap-3 py-3 border-b border-gray-custom-100 last:border-b-0">
          <div class="w-[10px] h-[10px] rounded-full mt-1 shrink-0" :class="dotClass(e.priorite)" />
          <div class="flex-1">
            <div class="text-[13px] font-semibold">{{ e.titre }}</div>
            <div class="text-[12px] text-gray-custom-400 mt-0.5">{{ e.description }}</div>
          </div>
          <span
            class="text-[11px] font-medium rounded-[4px] px-2 py-0.5 whitespace-nowrap"
            :class="e.priorite === 'red' ? 'bg-danger-pale text-danger' : 'bg-gray-custom-100 text-gray-custom-600'"
          >{{ e.date_label }}</span>
        </div>
      </div>

      <!-- Risques -->
      <div class="bg-white rounded-[10px] border border-gray-custom-200 p-5 shadow-card">
        <div class="text-[11px] font-bold uppercase tracking-[0.6px] text-gray-custom-400 mb-4 flex items-center gap-[7px]">
          <HeroIcon name="exclamation-triangle" :size="18" /> Risques Majeurs
        </div>
        <table class="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th class="text-left px-[10px] py-2 text-[10.5px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] border-b-2 border-gray-custom-200">Risque</th>
              <th class="text-left px-[10px] py-2 text-[10.5px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] border-b-2 border-gray-custom-200">Domaine</th>
              <th class="text-left px-[10px] py-2 text-[10.5px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] border-b-2 border-gray-custom-200">Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!d.risques.length">
              <td colspan="3" class="px-[10px] py-[10px] text-gray-custom-400 text-[13px]">Aucun risque enregistré</td>
            </tr>
            <tr v-for="r in d.risques" :key="r.id" class="border-b border-gray-custom-100">
              <td class="px-[10px] py-[10px] font-medium">{{ r.risque }}</td>
              <td class="px-[10px] py-[10px]">
                <span class="inline-block px-[9px] py-[2px] rounded-[4px] text-[11px] font-semibold" :class="riskBadgeClass(r.domaine)">{{ r.domaine }}</span>
              </td>
              <td class="px-[10px] py-[10px] text-[12px] text-gray-custom-600">{{ r.impact }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { state } from '../../store.js'
import HeroIcon from '../ui/HeroIcon.vue'
import DonutChart from '../ui/DonutChart.vue'

const d = computed(() => state.data)
const fmt = (n) => Number(n).toLocaleString('fr-CH')

const budgetTotal = computed(() => (d.value?.budget ?? []).reduce((a, b) => a + +b.budget_reel, 0))
const utiliseTotal = computed(() => (d.value?.budget ?? []).reduce((a, b) => a + +b.utilise, 0))
const pctGlobal = computed(() =>
  budgetTotal.value > 0 ? ((utiliseTotal.value / budgetTotal.value) * 100).toFixed(1) : 0
)

const avancementSegments = computed(() => [
  { value: Number(d.value?.avancement.finance ?? 0), color: '#4caf85' },
  { value: Number(d.value?.avancement.doc ?? 0), color: '#2d7a5e' },
  { value: Number(d.value?.avancement.auto ?? 0), color: '#3a8c7e' },
])

const techniqueBars = computed(() => [
  { label: 'Programmation automatique', value: d.value?.technique.prog ?? 0, colorClass: 'bg-ucb-mid' },
  { label: 'Supervision', value: d.value?.technique.sup ?? 0, colorClass: 'bg-amber-custom' },
  { label: 'Batch', value: d.value?.technique.batch ?? 0, colorClass: 'bg-ucb-light',
    sub: `${d.value?.technique.batchProg}/${d.value?.technique.batchTotal} programmées · ${d.value?.technique.batchPrete} prêtes` },
])

const docTotal = computed(() => {
  const doc = d.value?.documentation ?? {}
  return +doc.appro + +doc.revue + +doc.attente + +doc.nouvelles || 1
})
const docSegments = computed(() => {
  const doc = d.value?.documentation ?? {}
  const total = docTotal.value
  return [
    { value: +doc.appro / total * 100, color: '#4caf85' },
    { value: +doc.revue / total * 100, color: '#e8a020' },
    { value: +doc.attente / total * 100, color: '#9aa3ad' },
    { value: +doc.nouvelles / total * 100, color: '#2e6da4' },
  ]
})

function barPct(row) {
  return +row.budget_reel > 0 ? Math.min(100, Math.round((+row.utilise / +row.budget_reel) * 100)) : 0
}
function barClass(row) {
  const p = barPct(row)
  if (p >= 100) return 'bg-danger'
  if (p >= 65) return 'bg-amber-custom'
  return 'bg-ucb-mid'
}

function crLabel(s) {
  return s === 'approuve' ? 'Approuvé' : s === 'attention' ? 'Attention' : 'Ouvert'
}
function crBadgeClass(s) {
  if (s === 'approuve') return 'text-ucb-dark bg-ucb-pale border-[#b8d0ee]'
  if (s === 'attention') return 'text-[#a06010] bg-amber-pale border-[#f0d080]'
  return 'text-ucb-mid bg-ucb-pale border-[#b8d0ee]'
}

function dotClass(priorite) {
  if (priorite === 'orange') return 'bg-amber-custom'
  if (priorite === 'red') return 'bg-danger'
  return 'bg-gray-custom-800'
}
function riskBadgeClass(domaine) {
  const map = {
    Technique: 'bg-ucb-pale text-ucb-mid',
    Fournisseur: 'bg-amber-pale text-[#a06010]',
    Financier: 'bg-danger-pale text-danger',
    Planning: 'bg-ucb-pale text-ucb-dark',
    Autre: 'bg-gray-custom-100 text-gray-custom-600',
  }
  return map[domaine] ?? 'bg-gray-custom-100 text-gray-custom-600'
}
</script>
