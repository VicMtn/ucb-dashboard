<template>
  <div class="mb-3.5">
    <div class="flex items-center justify-between mb-1.5">
      <label class="text-[11.5px] font-semibold text-gray-custom-600">{{ label }}</label>
      <span class="text-[11.5px] font-semibold text-ucb-dark font-mono">{{ modelValue }}%</span>
    </div>
    <div class="wrap">
      <div class="track">
        <div class="fill" :style="{ width: modelValue + '%' }" />
      </div>
      <input
        type="range"
        class="input"
        min="0"
        max="100"
        :value="modelValue"
        @input="emit('update:modelValue', +$event.target.value)"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({ modelValue: { type: Number, required: true }, label: { type: String, required: true } })
const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>
.wrap {
  position: relative;
  height: 20px;
}

/* Track sits dead-centre regardless of thumb size */
.track {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 8px;
  background: #f0f2f4;
  border-radius: 999px;
  overflow: hidden;
  pointer-events: none;
}
.fill {
  height: 100%;
  background: #2e6da4;
  border-radius: 999px;
  transition: width 0.08s linear;
}

/* Transparent input stretched over the track */
.input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: grab;
  z-index: 1;
}
.input:active { cursor: grabbing; }
.input:focus { outline: none; }
.input:focus-visible { outline: 2px solid #2e6da4; outline-offset: 3px; border-radius: 4px; }

/* Thumb */
.input::-webkit-slider-runnable-track { background: transparent; }
.input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #2e6da4;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  margin-top: -5px; /* (8px track - 18px thumb) / 2 */
  transition: transform 0.1s, box-shadow 0.1s;
}
.input:hover::-webkit-slider-thumb {
  transform: scale(1.12);
  box-shadow: 0 2px 8px rgba(46, 109, 164, 0.35);
}
.input:active::-webkit-slider-thumb {
  transform: scale(0.95);
}

/* Firefox */
.input::-moz-range-track {
  background: transparent;
  height: 8px;
}
.input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #2e6da4;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}
</style>
