<template>
  <div
    class="fixed bottom-6 right-6 bg-ucb-dark text-white px-5 py-3 rounded-lg text-[13px] font-medium shadow-[0_4px_20px_rgba(0,0,0,0.2)] z-[9999] pointer-events-none transition-all duration-250"
    :class="toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'"
  >
    {{ toast.message }}
  </div>
</template>

<script setup>
import { toast } from '../store.js'
</script>
