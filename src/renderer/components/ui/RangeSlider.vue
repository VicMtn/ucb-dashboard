<template>
  <div class="mb-[14px]">
    <label class="block text-[11.5px] font-semibold text-gray-custom-600 mb-[5px]">
      {{ label }} — <span>{{ modelValue }}%</span>
    </label>
    <div
      class="range-slider"
      :style="{ '--min': 0, '--max': 100, '--value': Number(modelValue) || 0 }"
    >
      <div class="range-slider__progress" aria-hidden="true" />
      <input
        type="range"
        class="progress-range"
        min="0"
        max="100"
        :value="modelValue"
        @input="onInput"
      />
      <output class="range-output">{{ modelValue }}%</output>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Number, required: true },
  label: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

function onInput(e) {
  emit('update:modelValue', Number(e.target.value))
}
</script>
