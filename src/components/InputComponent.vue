<template>
    <fwb-input
      v-model="name"
      placeholder="enter your first name"
      label="First name"
    />
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue'
  import { FwbInput } from 'flowbite-vue'
  
  const name = ref('')
  </script>