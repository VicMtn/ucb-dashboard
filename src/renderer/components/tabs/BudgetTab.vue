<template>
  <div class="px-6 py-6 max-w-[1280px] mx-auto" v-if="d">
    <!-- Budget -->
    <div class="text-[12px] font-bold text-gray-custom-400 uppercase tracking-[0.7px] mb-[14px] flex items-center gap-2 section-title">
      Budget par catégorie
    </div>
    <div class="bg-white rounded-[10px] border border-gray-custom-200 p-5 shadow-card mb-5">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="text-left px-[10px] py-2 text-[10.5px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] border-b-2 border-gray-custom-200">Catégorie</th>
            <th class="text-left px-[10px] py-2 text-[10.5px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] border-b-2 border-gray-custom-200">Budget Réel (CHF)</th>
            <th class="text-left px-[10px] py-2 text-[10.5px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] border-b-2 border-gray-custom-200">Utilisé (CHF)</th>
            <th class="border-b-2 border-gray-custom-200" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in d.budget" :key="row.id" class="border-b border-gray-custom-100">
            <td class="px-2 py-[5px]">
              <input class="w-full px-[9px] py-1.5 border border-gray-custom-200 rounded-[7px] text-[12.5px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid" :value="row.categorie" @change="updateBudget(i, 'categorie', $event.target.value)" />
            </td>
            <td class="px-2 py-[5px]">
              <input class="w-full px-[9px] py-1.5 border border-gray-custom-200 rounded-[7px] text-[12.5px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid" type="number" :value="row.budget_reel" @change="updateBudget(i, 'budget_reel', +$event.target.value)" />
            </td>
            <td class="px-2 py-[5px]">
              <input class="w-full px-[9px] py-1.5 border border-gray-custom-200 rounded-[7px] text-[12.5px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid" type="number" :value="row.utilise" @change="updateBudget(i, 'utilise', +$event.target.value)" />
            </td>
            <td class="px-2 py-[5px] w-10">
              <button class="text-gray-custom-400 border-0 bg-transparent cursor-pointer inline-flex items-center justify-center px-1.5 py-0.5 transition-colors hover:text-danger" @click="deleteBudget(i)">
                <HeroIcon name="x-mark" :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <button
        class="flex items-center gap-[7px] text-ucb-mid text-[12.5px] font-semibold cursor-pointer py-2 border-0 bg-transparent font-sans transition-colors hover:text-ucb-dark"
        @click="addBudgetRow"
      >
        <HeroIcon name="plus" :size="16" />
        Ajouter une catégorie
      </button>
    </div>

    <!-- Change Requests -->
    <div class="text-[12px] font-bold text-gray-custom-400 uppercase tracking-[0.7px] mb-[14px] flex items-center gap-2 section-title">
      Change Requests
    </div>
    <div class="bg-white rounded-[10px] border border-gray-custom-200 p-5 shadow-card">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="text-left px-[10px] py-2 text-[10.5px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] border-b-2 border-gray-custom-200">Référence</th>
            <th class="text-left px-[10px] py-2 text-[10.5px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] border-b-2 border-gray-custom-200">Statut</th>
            <th class="text-left px-[10px] py-2 text-[10.5px] font-bold text-gray-custom-400 uppercase tracking-[0.5px] border-b-2 border-gray-custom-200">Description</th>
            <th class="border-b-2 border-gray-custom-200" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in d.cr" :key="row.id" class="border-b border-gray-custom-100">
            <td class="px-2 py-[5px]">
              <input class="w-full px-[9px] py-1.5 border border-gray-custom-200 rounded-[7px] text-[12.5px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid" :value="row.ref" @change="updateCR(i, 'ref', $event.target.value)" />
            </td>
            <td class="px-2 py-[5px]">
              <select class="w-full px-[9px] py-1.5 border border-gray-custom-200 rounded-[7px] text-[12.5px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid" :value="row.statut" @change="updateCR(i, 'statut', $event.target.value)">
                <option value="approuve">Approuvé</option>
                <option value="attention">Attention</option>
                <option value="ouvert">Ouvert</option>
              </select>
            </td>
            <td class="px-2 py-[5px]">
              <input class="w-full px-[9px] py-1.5 border border-gray-custom-200 rounded-[7px] text-[12.5px] font-sans text-gray-custom-800 bg-white outline-none focus:border-ucb-mid" :value="row.description" @change="updateCR(i, 'description', $event.target.value)" />
            </td>
            <td class="px-2 py-[5px] w-10">
              <button class="text-gray-custom-400 border-0 bg-transparent cursor-pointer inline-flex items-center justify-center px-1.5 py-0.5 transition-colors hover:text-danger" @click="deleteCR(i)">
                <HeroIcon name="x-mark" :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <button
        class="flex items-center gap-[7px] text-ucb-mid text-[12.5px] font-semibold cursor-pointer py-2 border-0 bg-transparent font-sans transition-colors hover:text-ucb-dark"
        @click="addCRRow"
      >
        <HeroIcon name="plus" :size="16" />
        Ajouter un CR
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { state } from '../../store.js'
import { updateBudget, addBudgetRow, deleteBudget, updateCR, addCRRow, deleteCR } from '../../actions.js'
import HeroIcon from '../ui/HeroIcon.vue'

const d = computed(() => state.data)
</script>
