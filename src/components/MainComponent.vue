<script setup lang="ts">
import HelloWorld from './HelloWorld.vue';
import LoginModalComponent from './LoginModalComponent.vue';
import RegisterModalComponent from './RegisterModalComponent.vue';

</script>
<template>
  <div class="header">
    <div class="block justify-center align-middle w-full h-full mt-3 mb-3">
        <div class="flex justify-center">
          <img alt="Firebase logo" src="@/assets/logo-logomark.svg" width="60" height="60" />
        </div>
        <div class="flex justify-center">
          <img alt="Vue logo" src="@/assets/logo.svg" width="120" height="120" />
        </div>
      </div>
      <div class="inline-block text-center align-middle justify-center w-full h-full">
        <HelloWorld msg="VueChat" />
        <div class="mt-3 flex justify-center w-full align-middle">
          <LoginModalComponent />
          <RegisterModalComponent />
        </div>
      </div>
  </div>
</template>

<style>
.header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 0rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 0rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  .header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  .header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  } 
}
</style>