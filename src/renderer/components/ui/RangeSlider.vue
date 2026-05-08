<template>
  <div class="mb-3.5">
    <div class="flex items-center justify-between mb-1.5">
      <label class="text-[11.5px] font-semibold text-gray-custom-600">{{ label }}</label>
      <span class="text-[11.5px] font-semibold text-ucb-dark font-mono">{{ modelValue }}%</span>
    </div>
    <input
      type="range"
      class="range range-primary range-sm"
      min="0"
      max="100"
      :value="modelValue"
      @input="emit('update:modelValue', +$event.target.value)"
    />
  </div>
</template>

<script setup>
defineProps({ modelValue: { type: Number, required: true }, label: { type: String, required: true } })
const emit = defineEmits(['update:modelValue'])
</script>
