import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA82aDtMI0FTZBlhlko4X0gOTF-49Cxa6I",
  authDomain: "plyp2023.firebaseapp.com",
  databaseURL: "https://plyp2023-default-rtdb.firebaseio.com",
  projectId: "plyp2023",
  storageBucket: "plyp2023.appspot.com",
  messagingSenderId: "483779119777",
  appId: "1:483779119777:web:e487882f22d28e04f5fee0"
};

// Initialize Firebase
export const appFb = initializeApp(firebaseConfig);
export const auth = getAuth(appFb);
export const db = getDatabase(appFb);
export const dbRef = ref(db); 
export const dbFirestore = getFirestore(appFb);

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
