<template>
  <div class="absolute top-0 p-2 text-xs">
    {{title}}
  </div>
</template>

<script setup>
import { computed } from 'vue';

const title = computed(() => {
  if ($slidev.nav.currentPage !== $slidev.nav.total + 1) {
    return $slidev.configs.where
  } else {
    return ''
  }
});

</script>