import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue' 
import HomeChat from '../views/HomeChat.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/chat',
      name: 'chat',
      component: HomeChat,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  // Verificar si la ruta a la que se intenta acceder requiere autenticación
  if (to.meta.requiresAuth) {
    // Verificar la autenticación del usuario (por ejemplo, si está logueado)
    const usuarioAutenticado = checkUserAuthentication(); // Debes implementar esta lógica

    if (usuarioAutenticado) {
      // El usuario está autenticado, permite la navegación
      next();
    } else {
      // El usuario no está autenticado, redirigir a la página de inicio de sesión u otra página
      next('/'); // Cambia '/login' por la ruta de tu página de inicio de sesión
    }
  } else {
    // La ruta no requiere autenticación, permite la navegación
    next();
  }
});

function checkUserAuthentication(){
  // Verificar si el usuario está autenticado en local storage
  const user = localStorage.getItem('user');
  if (user) {
    return true;
  } else {
    return false;
  }
}

export default router
