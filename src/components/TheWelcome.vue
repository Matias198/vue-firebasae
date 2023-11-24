<script setup lang="ts">
import WelcomeItem from './WelcomeItem.vue'
import IconChat from './icons/IconChat.vue'
import IconUser from './icons/IconUser.vue';
</script>

<template> 
  <div class="sm:pt-5 hidden sm:block">
    <WelcomeItem>
      <template #icon>
        <IconUser />
      </template>
      <template #heading>Crea tu cuenta</template>
      Al crear tu cuenta de usuario podras acceder a todas las funciones de Vue Chat.
    </WelcomeItem>
  
    <WelcomeItem>
      <template #icon>
        <IconChat />
      </template>
      <template #heading>Mensajes en tiempo real</template>
      Habla con tus amigos en tiempo real con el sistema de mensajes instantaneos de Vue Chat.
    </WelcomeItem>
  
    <WelcomeItem>
      <template #icon>
        <img alt="Firebase Auth" src="@/assets/firebase-authentication.svg" width="40" height="40" />
      </template>
      <template #heading>Autenticacion con Firebase Authentication</template>
      Vue Chat utiliza Firebase Authentication para la autenticacion de usuarios.
    </WelcomeItem>
    
    <WelcomeItem>
      <template #icon>
        <img alt="Firebase Auth" src="@/assets/firebase-realtimedatabase.svg" width="40" height="40" />
      </template>
      <template #heading>Velocidad en tiempo real con Realtime Database</template>
      Vue Chat utiliza Firebase Realtime Database para la gestion de mensajes en tiempo real.
    </WelcomeItem>
  </div>
</template>
