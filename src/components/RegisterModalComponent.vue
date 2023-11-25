<script setup lang="ts">
import { onMounted } from 'vue'
import { initFlowbite } from 'flowbite'
import { ref as vueRef } from 'vue'
import { createUserWithEmailAndPassword, getAuth } from '@firebase/auth';
import Swal from 'sweetalert2';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getFirestore, setDoc } from '@firebase/firestore';
import { useLoading } from 'vue3-loading-overlay';

const email = vueRef("");
const password = vueRef("");
const repassword = vueRef("");
const nombre = vueRef("");
const input = document.getElementsByName('inputFile')[0];
const auth = getAuth(); 
var base64Image = "";
let loader = useLoading();

function cargarImagen(event: any) {
    const archivo = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (event: any) => {
        base64Image = event.target.result; // Aquí tienes la imagen en formato base64
        //console.log(base64Image);
    };
    reader.readAsDataURL(archivo); // Convierte la imagen a base64 cuando se carga el archivo
};

function subirImagenFirebaseStorage() {
    const user = auth.currentUser;

    if (user) {
        const uid = user.uid;
        const storage = getStorage();
        // Create a child reference
        const imagesRef = ref(storage, `imagenes/${uid}.jpg`)

        // Convertir la base64 a un blob
        const byteCharacters = atob(base64Image.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        //Subir el blob a Firestore Storage
        return uploadBytes(imagesRef, blob)
            .then(() => {
                console.log('Imagen subida a Firestore Storage');
                // Obtener la URL de descarga de la imagen
                return getDownloadURL(imagesRef);
            })
            .then((downloadURL) => {
                console.log('URL de descarga obtenida:', downloadURL);
                return downloadURL; // Retornar la URL de descarga
            })
            .catch((error) => {
                console.error('Error al subir la imagen a Firestore Storage:', error);
                return Promise.reject(error);
            });
    } else {
        return Promise.reject(new Error('Usuario no autenticado'));
    }
}

function register() {
    loader.show({
        canCancel: false,
        color: '#ffffff',
        loader: 'spinner',
        width: 64,
        height: 64,
        backgroundColor: '#000000',
        opacity: 0.5,
        zIndex: 999,
    });
    console.log("Registrando usuario con correo: " + email.value + " y contraseña: " + password.value)
    if (password.value === repassword.value) {
        createUserWithEmailAndPassword(auth, email.value, password.value)
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;

                //Agregar nombre de usuario
                const uid = user.uid;

                // 3. Guardar información adicional (nombre de usuario) en Cloud Firestore
                const db = getFirestore();
                const usuarioDoc = doc(db, 'usuarios', uid); // 'usuarios' es el nombre de la colección 

                // Suponiendo que 'username' es el nombre de usuario ingresado por el usuario
                const username = nombre.value || '';

                subirImagenFirebaseStorage().then((downloadURL) => {
                    const url = downloadURL;
                    setDoc(usuarioDoc, { username, url }) // Guardar el nombre de usuario en Cloud Firestore
                        .then(() => {
                            console.log('Usuario registrado con nombre de usuario en Cloud Firestore');
                            // Guardar en la memoria local el usuario
                            localStorage.setItem('user', JSON.stringify(user));
                            // Crear la alerta de Swal para mostrar el estado
                            Swal.fire({
                                icon: 'success',
                                title: 'Usuario creado correctamente',
                                text: 'Bienvenido a VueChat',
                                confirmButtonText: 'Aceptar'
                            })
                                //redireccionar a la pagina de chat luego de confirmar la alerta
                                .then((result) => {
                                    if (result.isConfirmed) {
                                        window.location.href = "/chat";
                                    }
                                })
                        })
                        .catch((error) => {
                            console.error('Error al guardar el nombre de usuario:', error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Error al crear usuario',
                                text: 'No se pudo guardar el nombre de usuario',
                                confirmButtonText: 'Aceptar'
                            })
                        });
                });
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                // Crear la alerta de Swal para mostrar el error
                Swal.fire({
                    icon: 'error',
                    title: 'Error al crear usuario' + (errorCode ? ' (' + errorCode + ')' : ''),
                    text: errorMessage,
                    confirmButtonText: 'Aceptar'
                })
            });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Error al crear usuario',
            text: 'Las contraseñas no coinciden',
            confirmButtonText: 'Aceptar'
        })
    }
    loader.hide();
}

// initialize components based on data attribute selectors
onMounted(() => {
    initFlowbite();
})

</script>
<template>
    <div>
        <loading></loading>
        <div class="flex justify-center p-4">
            <button id="buttonRegister" data-modal-toggle="modal-register" data-modal-target="modal-register" type="button"
                class="text-white mt-2 ml-3 bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
                <svg class="w-3.5 h-3.5 me-2 text-white dark:text-white" aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                    <path
                        d="M6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Zm11-3h-2V5a1 1 0 0 0-2 0v2h-2a1 1 0 1 0 0 2h2v2a1 1 0 0 0 2 0V9h2a1 1 0 1 0 0-2Z" />
                </svg>
                Registrarme
            </button>
        </div>

        <div id="modal-register" tabindex="-1" aria-hidden="true"
            class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
            <div class="relative w-full max-w-2xl max-h-full">
                <!-- Modal content -->
                <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                    <!-- Modal header -->
                    <div class="flex items-start justify-between p-5 border-b rounded-t dark:border-gray-600">
                        <h3 class="text-xl font-semibold text-gray-900 lg:text-2xl dark:text-white">
                            Registrar usuario
                        </h3>
                        <button id="closeButton" data-modal-hide="modal-register" type="button"
                            class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clip-rule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                    <!-- Modal body -->
                    <form @submit.prevent="register" class="max-w-sm mx-auto">
                        <div class="p-6 space-y-6">
                            <div class="mb-5">
                                <label for="nombre"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre</label>
                                <input v-model="nombre" name="nombre" type="text" id="nombre"
                                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                                    placeholder="Nombre" required>
                            </div>
                            <div class="mb-5">
                                <label for="imagen"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Imagen de perfil
                                    (Opcional)</label>
                                <input name="inputFile" type="file" id="imagen"
                                    @change.prevent="event => cargarImagen(event)" accept="image/*"
                                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500">
                            </div>
                            <div class="mb-5">
                                <label for="email"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Correo</label>
                                <input v-model="email" name="email" type="email" id="email"
                                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                                    placeholder="nombre@mail.com" required>
                            </div>
                            <div class="mb-5">
                                <label for="password"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contraseña</label>
                                <input v-model="password" name="password" type="password" id="password"
                                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                                    required>
                            </div>
                            <div class="mb-5">
                                <label for="repassword"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Vuelva a ingresar
                                    la contraseña</label>
                                <input v-model="repassword" name="repassword" type="password" id="repassword"
                                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                                    required>
                            </div>
                        </div>
                        <!-- Modal footer -->
                        <div
                            class="flex justify-center items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
                            <button
                                class="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">Registrarme</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>