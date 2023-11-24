<script setup lang="ts">
import HelloWorld from './HelloWorld.vue';
import LoginModalComponent from './LoginModalComponent.vue';
import RegisterModalComponent from './RegisterModalComponent.vue';

</script>
<template>
  <div class="justify-center align-middle mt-3 mb-3">
    <div class="flex justify-center">
      <img alt="Firebase logo" src="@/assets/logo-logomark.svg" width="60" height="60" />
    </div>
    <div class="flex justify-center">
      <img alt="Vue logo" src="@/assets/logo.svg" width="120" height="120" />
    </div>
  </div>
  <div class="inline-block text-center align-middle justify-center w-full h-full">
    <div class="text-center justify-center w-full">
      <HelloWorld msg="VueChat" />
    </div>
    <div class="mt-3 flex justify-center w-full align-middle">
      <LoginModalComponent />
      <RegisterModalComponent />
    </div>
  </div>
</template>
