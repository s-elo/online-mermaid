<script setup lang="ts">
import { ref } from 'vue';
import MermaidPreview from './components/MermaidPreview.vue';

const content = ref(`graph TB\na-->b`);
</script>

<template>
  <div class="container">
    <MermaidPreview :content="content" />
  </div>
</template>

<style scoped></style>
