<script setup lang="ts">
import TheWelcome from '../components/TheWelcome.vue'
import MainComponent from '@/components/MainComponent.vue'
</script>

<template>
  <div>
    <div>
      <MainComponent />
    </div>
    <div class="flex justify-center">
      <TheWelcome />
    </div>
  </div>
</template>