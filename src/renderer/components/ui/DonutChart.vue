<template>
  <div class="flex items-center gap-5">
    <svg :width="size" :height="size" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="38" fill="none" stroke="#f0f2f4" stroke-width="14" />
      <circle
        v-for="(seg, i) in computed_segments"
        :key="i"
        cx="50" cy="50" r="38"
        fill="none"
        :stroke="seg.color"
        stroke-width="14"
        :stroke-dasharray="`${seg.dash} ${C}`"
        transform="rotate(-90 50 50)"
        :style="{ strokeDashoffset: -seg.offset }"
      />
      <text
        v-if="centerText"
        x="50" y="54"
        text-anchor="middle"
        font-size="13"
        font-weight="700"
        fill="#2c3340"
        font-family="DM Sans,sans-serif"
      >{{ centerText }}</text>
    </svg>
    <div class="flex flex-col gap-[7px]">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const C = 194.8

const props = defineProps({
  segments: { type: Array, required: true }, // [{ value, color }]
  total: { type: Number, default: 100 },
  size: { type: Number, default: 100 },
  centerText: { type: String, default: '' },
})

const computed_segments = computed(() => {
  let offset = 0
  return props.segments.map((seg) => {
    const dash = (seg.value / props.total) * C
    const result = { ...seg, dash, offset }
    offset += dash
    return result
  })
})
</script>
