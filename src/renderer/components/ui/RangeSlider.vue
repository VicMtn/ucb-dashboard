<template>
  <div class="mb-3.5">
    <label class="block text-[11.5px] font-semibold text-gray-custom-600 mb-1.5">
      {{ label }} — <span class="font-mono text-ucb-dark">{{ modelValue }}%</span>
    </label>
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
