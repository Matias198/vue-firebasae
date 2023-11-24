<script setup lang="ts">
import { RouterView } from 'vue-router'

//import HelloWorld from './components/HelloWorld.vue';
//import LoginModalComponent from './components/LoginModalComponent.vue';
//import RegisterModalComponent from './components/RegisterModalComponent.vue';
/*
import { getDatabase, ref, onValue  } from 'firebase/database'

const h1 = document.getElementsByName('Hola')
const dbRef = ref(getDatabase(), 'text')

onValue(dbRef, (snapshot) => {
  if (snapshot.exists()) {
    h1[0].innerHTML = snapshot.val()
    console.log(snapshot.val());
  } else {
    console.log("No data available");
  }
})
*/
</script>
<template>
  <div>
    <RouterView /> 
  </div>
</template>
