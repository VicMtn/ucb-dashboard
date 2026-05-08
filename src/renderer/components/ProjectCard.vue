<template>
  <div
    class="bg-white/[7%] border border-white/[12%] rounded-xl p-[22px] cursor-pointer backdrop-blur-sm transition-all duration-200 hover:bg-white/[12%] hover:border-white/25 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
    @click="emit('open', project.id)"
  >
    <div class="flex items-start justify-between">
      <div>
        <div class="text-[15px] font-bold text-white">{{ project.name }}</div>
        <div class="text-[12px] text-white/45 mt-1">{{ project.lot || '—' }}</div>
      </div>
      <div class="flex gap-1">
        <button
          class="bg-white/[8%] border-0 text-white/50 w-[26px] h-[26px] rounded-[5px] cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-white/[18%] hover:text-white"
          title="Renommer"
          @click.stop="emit('rename', project.id)"
        >
          <HeroIcon name="pencil-square" :size="16" />
        </button>
        <button
          class="bg-white/[8%] border-0 text-white/50 w-[26px] h-[26px] rounded-[5px] cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-danger/40 hover:text-[#ff8a7a]"
          title="Supprimer"
          @click.stop="emit('delete', project.id)"
        >
          <HeroIcon name="trash" :size="16" />
        </button>
      </div>
    </div>

    <div class="text-[11px] text-white/35 mt-4">
      Créé le {{ new Date(project.createdAt).toLocaleDateString('fr-CH') }}
    </div>

    <div class="flex items-center gap-[10px] mt-[10px]">
      <div class="flex-1 h-[6px] bg-white/[12%] rounded-full overflow-hidden">
        <div
          class="h-full bg-white/[72%] rounded-full"
          :style="{ width: `${Math.max(0, Math.min(100, Number(project.progressPct ?? 0)))}%` }"
        />
      </div>
      <div class="min-w-[34px] text-right text-[11px] font-semibold text-white/55">
        {{ Number.isFinite(Number(project.progressPct)) ? `${Math.round(Number(project.progressPct))}%` : '—' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import HeroIcon from './ui/HeroIcon.vue'

defineProps({ project: { type: Object, required: true } })
const emit = defineEmits(['open', 'rename', 'delete'])
</script>
