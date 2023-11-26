<script setup lang="ts">
import { onMounted, ref as vueRef } from 'vue'
import { getFirestore, doc, getDoc, collection, onSnapshot, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { initFlowbite } from 'flowbite';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from '@firebase/auth';
import { useLoading } from 'vue3-loading-overlay';

const Toast = Swal.mixin({
    toast: true,
    position: "bottom-start",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});
// Obtengo el UID del usuario actual
const user = JSON.parse(localStorage.getItem('user') || '{}');
const uid = user.uid;
// Obtener el nombre de usuario desde Cloud Firestore
const db = getFirestore();
const usuarioDoc = doc(db, 'usuarios', uid);

var mensaje = vueRef("");
var usuarios = vueRef({});
var usuarioAux: any;
var correo = vueRef("");
var nombre = vueRef("");
var base64 = vueRef("");
base64.value = "";
var busqueda = vueRef("");
var listaUsuarios: any = [];
var chateandoCon = "";
const auth = getAuth();
let loader = useLoading();
loader.hide();

const input = document.getElementsByName('inputFile')[0];
var base64Image = "";

function cargarImagen(event: any) {
    const archivo = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (event: any) => {
        base64Image = event.target.result; // Aquí tienes la imagen en formato base64
        //console.log(base64Image);
    };
    reader.readAsDataURL(archivo); // Convierte la imagen a base64 cuando se carga el archivo
};

// initialize components based on data attribute selectors
onMounted(() => {
    initFlowbite();
})

function subirImagenFirebaseStorage() {
    const user = auth.currentUser;

    if (user) {
        const uid = user.uid;
        const storage = getStorage();

        //Borra la imagen anterior
        const imagesRef = ref(storage, `imagenes/${uid}.jpg`);

        try {
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
        } catch (error) {
            console.error('Error al subir la imagen a Firestore Storage:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al subir la imagen a Firestore Storage',
                text: 'Intente nuevamente',
                confirmButtonText: 'Aceptar'
            })
            setTimeout(() => {
                loader.hide();
            }, 1000);
            return Promise.reject(error);
        }
    } else {
        return Promise.reject(new Error('Usuario no autenticado'));
    }
}

function actualizarUsuario() {
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
    // Obtener el usuario actualmente autenticado
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Si el usuario está autenticado
    if (user) {
        const uid = user.uid;

        const db = getFirestore();
        const usuarioDoc = doc(db, 'usuarios', uid); // Referencia al documento del usuario en Firestore

        // Si se seleccionó una imagen
        subirImagenFirebaseStorage().then((downloadURL) => {
            // Actualizar solo los campos necesarios (nombre de usuario y/o imagen)
            const dataToUpdate = {
                //username: nombre.value,
                base64Image: downloadURL
            };
            console.log(dataToUpdate);

            // Actualizar el documento del usuario en Firestore con los nuevos datos
            updateDoc(usuarioDoc, dataToUpdate)
                .then(() => {
                    console.log('Usuario actualizado correctamente');
                    // Crear la alerta de Swal para mostrar el estado
                    setTimeout(() => {
                        loader.hide();
                    }, 1000);
                    Swal.fire({
                        icon: 'success',
                        title: 'Usuario actualizado correctamente',
                        text: 'Puede continuar chateando',
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
                    setTimeout(() => {
                        loader.hide();
                    }, 1000);
                    console.error('Error al actualizar el usuario:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al actualizar el usuario',
                        text: 'Intente nuevamente',
                        confirmButtonText: 'Aceptar'
                    })
                });
        }).catch((error) => {
            setTimeout(() => {
                loader.hide();
            }, 1000);
            console.error('Error al subir la imagen a Firestore Storage:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al subir la imagen a Firestore Storage',
                text: 'Intente nuevamente',
                confirmButtonText: 'Aceptar'
            })
        });
    }
}

getDoc(usuarioDoc)
    .then((docSnapshot) => {
        if (docSnapshot.exists()) {
            // Si el documento existe, obtén el nombre de usuario
            nombre.value = docSnapshot.data().username;
            // Obtener la imagen de perfil del usuario
            base64.value = docSnapshot.data().base64Image;
            //console.log("base64Image: " + base64.value);
            // Obtener el correo del usuario
            correo.value = user.email;
        } else {
            console.log('No se encontró el usuario en Firestore');
        }
    })
    .catch((error) => {
        console.error('Error al obtener el nombre de usuario:', error);
    });

// Obtener todos los usuarios
const usuariosCollection = collection(db, 'usuarios');

onSnapshot(usuariosCollection, (snapshot) => {
    usuarios.value = snapshot.docs.map(doc => doc.data());
    snapshot.docs.map(doc => doc.data()).forEach((usuario: any) => {
        if (usuario !== nombre.value) {
            listaUsuarios.push(usuario);
        }
    });
    usuarioAux = usuarios.value;
});




function logout() {
    localStorage.removeItem('user');
    window.location.href = "/";
}

function buscar() {
    let listaAuxiliar = listaUsuarios;
    let arrayAuxiliar: any = [];
    let usuariosFiltrados: any = [];
    listaAuxiliar.forEach((usuario: any) => {
        arrayAuxiliar.push(usuario);
    });
    usuariosFiltrados = arrayAuxiliar.filter((user: any) =>
        user.username.toString().toLowerCase().includes(busqueda.value.toString().toLowerCase())
    );
    usuarios.value = usuariosFiltrados;
    if (usuariosFiltrados.length === 0) {
        usuarios.value = usuarioAux.value;
    }
}

function abrirChat(usuario: any) {
    // guardar el nombre del usuario con el que se está chateando
    chateandoCon = usuario.username;

    //console.log(usuario);
    // Swal toast de "Chateando con"
    Toast.fire({
        icon: 'success',
        title: 'Chateando con ' + usuario.username,
    });

    //Obtener todos los mensajes de firestore
    const conversacionID = generarConversacionID(nombre.value, usuario.username);
    const mensajesRef = collection(db, 'mensajes', conversacionID, 'mensajes');

    onSnapshot(mensajesRef, (snapshot) => {
        // Guardar los mensajes en una lista
        var mensajes: any = [];

        snapshot.docs.map(doc => doc.data()).forEach((mensaje: any) => {
            mensajes.push(mensaje);
        });
        //console.log(mensajes);

        // Ordenar los mensajes por fecha
        mensajes.sort((a: any, b: any) => a.timestamp - b.timestamp);
        //console.log(mensajes);

        // Recorrer todos los mensajes cambiando el timestamp a una fecha legible
        mensajes.forEach((doc: any) => {
            if (doc.timestamp === null) {
                doc.timestamp = Date.now().toLocaleString();
            } else {
                // Convertir el timestamp a una fecha legible
                var fecha = new Date(doc.timestamp.seconds * 1000);
                // Guardar la fecha en el mensaje
                doc.timestamp = fecha.toLocaleString();
            }
        });

        //Limpiar el chat
        document.getElementsByName("chatContainer")[0].innerHTML = "";
        mensaje.value = "";

        //Mostrar los mensajes
        mensajes.forEach((doc: any) => {
            //console.log(doc);
            if (doc.remitente === nombre.value) {
                // Mensaje enviado por el usuario actual
                document.getElementsByName("chatContainer")[0].innerHTML += `
                    <div class="w-full pl-5 pr-5 rounded-lg bg-white text-black">
                        <div class="flex justify-between aling-middle">
                            <label class="nombre-usuario">Vos:</label>
                            <label class="fecha-msg">${doc.timestamp}</label>    
                        </div>
                        <p>${doc.contenido}</p>
                    </div>
                    <br>
                `;
            } else {
                // Mensaje enviado por el usuario con el que se está chateando
                document.getElementsByName("chatContainer")[0].innerHTML += `
                    <div class="w-full pl-5 pr-5 rounded-lg bg-gray-100 text-black">
                        <div class="flex justify-between aling-middle">
                            <label class="nombre-usuario">De: ${doc.remitente}:</label>
                            <label class="fecha-msg">${doc.timestamp}</label>    
                        </div>
                        <p>${doc.contenido}</p>
                    </div>
                    <br>
                `;
            }
        });
        scrollHaciaUltimoMensaje();
    });
}

function scrollHaciaUltimoMensaje() {
    const containerElement = document.getElementsByName('chatContainer')[0];
    if (containerElement) {
        // Acceder al último mensaje después de limpiar el contenedor
        const ultimoMensaje = containerElement.lastElementChild;
        if (ultimoMensaje) {
            ultimoMensaje.scrollIntoView({ behavior: 'instant' });
        }
    }
}

function enviarMensaje(usuario1: any, usuario2: any, message: any) {
    if (chateandoCon === '') {
        // Swal toast de "Chateando con"
        Toast.fire({
            icon: 'error',
            title: 'No estas chateando con ningun usuario',
        });
        return;
    }
    // Si el mensaje no contiene caracteres o solo espacios
    if (!message.replace(/\s/g, '').length) {
        Toast.fire({
            icon: 'error',
            title: 'No puedes enviar un mensaje vacio',
        });
        return;
    }

    try {
        const conversacionID = generarConversacionID(usuario1, usuario2);

        // Referencia a la colección de mensajes para la conversación
        const mensajesRef = collection(db, 'mensajes', conversacionID, 'mensajes');

        addDoc(mensajesRef, {
            contenido: message,
            remitente: usuario1,
            receptor: usuario2,
            timestamp: serverTimestamp()
        });
        console.log('Mensaje enviado correctamente');
        mensaje.value = "";
        // Obtener el text area y limpiarlo
        const chat = document.getElementById('chat') as HTMLTextAreaElement;
        chat.value = '';
    } catch (error) {
        console.error('Error al enviar el mensaje:', error);
    }
}

function generarConversacionID(usuario1: any, usuario2: any) {
    return usuario1 < usuario2 ? `${usuario1}_${usuario2}` : `${usuario2}_${usuario1}`;
}
</script>
<template >
    <div class="bg-white">
        <nav class="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div class="px-3 py-3 lg:px-5 lg:pl-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center justify-start rtl:justify-end">
                        <button data-drawer-target="logo-sidebar" data-drawer-toggle="logo-sidebar"
                            aria-controls="logo-sidebar" type="button"
                            class="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                            <span class="sr-only">Open sidebar</span>
                            <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg">
                                <path clip-rule="evenodd" fill-rule="evenodd"
                                    d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z">
                                </path>
                            </svg>
                        </button>
                        <a href="#" class="flex ms-2 md:me-24" target="_blank">
                            <img src="@/assets/logo.svg" class="h-8 me-3" alt="Vue Logo" />
                            <span
                                class="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">VueChat</span>
                        </a>
                    </div>
                    <div class="flex items-center">
                        <div class="flex items-center ms-3">
                            <div class="flex w-full justify-center align-middle">
                                <span v-if="JSON.stringify(usuarios) == '{}'" class="v-center">
                                    <p class="px-1 text-center text-sm text-green-600">Cargando perfil</p>
                                    <svg aria-hidden="true" class="px-1 w-8 h-8 text-gray-200 animate-spin fill-green-600"
                                        viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                            fill="currentColor" />
                                        <path
                                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                            fill="currentFill" />
                                    </svg>
                                    <span class="sr-only">Loading...</span>

                                </span>
                                <button type="button"
                                    class="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                                    aria-expanded="false" data-dropdown-toggle="dropdown-user">
                                    <span class="sr-only">Open user menu</span>
                                    <img v-if="base64 === ''" class="w-8 h-8 rounded-full" src="@/assets/perfil.jpg"
                                        alt="default user photo">
                                    <img v-if="base64 !== ''" class="w-8 h-8 rounded-full" :src="base64" alt="user photo">
                                </button>
                            </div>
                            <div class="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded shadow dark:bg-gray-700 dark:divide-gray-600"
                                id="dropdown-user">
                                <div class="px-4 py-3" role="none">
                                    <p class="text-sm text-gray-900 dark:text-white" role="none">
                                        {{ nombre }}
                                    </p>
                                    <p class="text-sm font-medium text-gray-900 truncate dark:text-gray-300" role="none">
                                        {{ correo }}
                                    </p>
                                </div>
                                <ul class="py-1" role="none">
                                    <li class="flex justify-center">
                                        <button id="burronActualizar" data-modal-toggle="modal-actualizar"
                                            data-modal-target="modal-actualizar"
                                            class="block px-4 py-2 text-sm text-green-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-600 dark:hover:text-white"
                                            role="menuitem">Configuración</button>
                                    </li>
                                    <li class="flex justify-center">
                                        <button @click.prevent="logout"
                                            class="block px-4 py-2 text-sm text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-600 dark:hover:text-white"
                                            role="menuitem">Salir</button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <aside id="logo-sidebar"
            class="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
            aria-label="Sidebar">
            <div class="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
                <ul class="space-y-2 font-medium">
                    <li>
                        <form @submit.prevent="buscar" class="border-b pb-3">

                            <div class="relative">
                                <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                    <svg class="w-4 h-4 text-green-500" aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                            stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                    </svg>
                                </div>
                                <input type="text" v-model="busqueda" @input="buscar" placeholder="Buscar usuario..."
                                    class="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500">
                            </div>
                        </form>
                    </li>
                    <li v-if="JSON.stringify(usuarios) == '{}'">
                        <p class="text-center text-sm text-green-600">Cargando usuarios</p>
                        <div class="mt-3 flex w-full justify-center align-middle">
                            <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin fill-green-600"
                                viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                    fill="currentColor" />
                                <path
                                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                    fill="currentFill" />
                            </svg>
                            <span class="sr-only">Loading...</span>
                        </div>
                    </li>
                    <li v-else v-for="(usuario) in JSON.parse(JSON.stringify(usuarios))">
                        <a v-if="usuario.username != nombre" :name="usuario" @click.prevent="abrirChat(usuario)"
                            type="button"
                            class="cursor-pointer flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                            <img v-if="usuario.base64Image === ''" class="w-8 h-8 rounded-full" src="@/assets/perfil.jpg"
                                alt="default user photo">
                            <img v-if="usuario.base64Image !== ''" class="w-8 h-8 rounded-full" :src="usuario.base64Image"
                                alt="user photo">
                            <span class="flex-1 ms-3 whitespace-nowrap">{{ usuario.username }}</span>
                        </a>
                    </li>
                </ul>
            </div>
        </aside>

        <div class="contenedor-padre p-4 sm:ml-64">
            <div name="chatContainer"
                class="border border-gray-300 border-b-0 div-arriba p-4 mt-14 bg-green-200 rounded-t-lg overflow-y-scroll">
                <div v-if="chateandoCon === ''" class="v-center justify-center h-full w-full">
                    <div class="block">
                        <div class="justify-center align-middle mt-3 mb-3">
                            <div class="flex justify-center">
                                <img alt="Firebase logo" src="@/assets/logo-logomark.svg" width="60" height="60" />
                            </div>
                            <div class="flex justify-center">
                                <img alt="Vue logo" src="@/assets/logo.svg" width="120" height="120" />
                            </div>
                        </div>
                        <h1 class="text-center text-2xl font-bold text-green-600">Bienvenido a VueChat</h1>
                        <p class="text-center text-lg text-green-600">Seleccione un usuario para comenzar a
                            chatear</p>
                        <span v-if="JSON.stringify(usuarios) == '{}'" class="v-center">
                            <p class="px-1 text-center text-sm text-green-600">Cargando contenido</p>
                            <svg aria-hidden="true" class="px-1 w-8 h-8 text-gray-200 animate-spin fill-green-600"
                                viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                    fill="currentColor" />
                                <path
                                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                    fill="currentFill" />
                            </svg>
                            <span class="sr-only">Loading...</span>

                        </span>
                    </div>
                </div>
            </div>
            <div class="div-abajo border border-gray-300 border-t-0 bg-green-200 overflow-hidden">
                <form>
                    <label for="chat" class="sr-only ">Su mensaje</label>
                    <div class="flex items-center px-3 py-2 rounded-t-lg bg-white dark:bg-gray-700">
                        <button type="button"
                            class="inline-flex justify-center p-2 text-green-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                                viewBox="0 0 20 18">
                                <path fill="currentColor"
                                    d="M13 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM7.565 7.423 4.5 14h11.518l-2.516-3.71L11 13 7.565 7.423Z" />
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M18 1H2a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z" />
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM7.565 7.423 4.5 14h11.518l-2.516-3.71L11 13 7.565 7.423Z" />
                            </svg>
                            <span class="sr-only">Upload image</span>
                        </button>
                        <button type="button"
                            class="p-2 text-green-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                                viewBox="0 0 20 20">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13.408 7.5h.01m-6.876 0h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM4.6 11a5.5 5.5 0 0 0 10.81 0H4.6Z" />
                            </svg>
                            <span class="sr-only">Add emoji</span>
                        </button>
                        <textarea name="sendChat" id="chat" rows="1" v-model="mensaje"
                            class="block mx-4 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                            placeholder="Escriba un mensaje..."></textarea>
                        <a type="button" @click.prevent="enviarMensaje(nombre, chateandoCon, mensaje)"
                            class="inline-flex justify-center p-2 text-green-600 rounded-full cursor-pointer hover:bg-green-100 dark:text-green-500 dark:hover:bg-gray-600">
                            <svg class="w-5 h-5 rotate-90 rtl:-rotate-90" aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20">
                                <path
                                    d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z" />
                            </svg>
                            <span class="sr-only">Enviar</span>
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div id="modal-actualizar" tabindex="-1" aria-hidden="true"
        class="fixed top-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div class="relative w-full max-w-2xl max-h-full">
            <!-- Modal content -->
            <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                <!-- Modal header -->
                <div class="flex items-start justify-between p-5 border-b rounded-t dark:border-gray-600">
                    <h3 class="text-xl font-semibold text-gray-900 lg:text-2xl dark:text-white">
                        Actualizar perfil
                    </h3>
                    <button id="closeButton" data-modal-hide="modal-actualizar" type="button"
                        class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>
                <!-- Modal body -->
                <form @submit.prevent="actualizarUsuario" class="max-w-sm mx-auto">
                    <div class="p-6 space-y-6">
                        <!--<div class="mb-5">
                                                                                                            <label for="nombre"
                                                                                                                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre</label>
                                                                                                            <input v-model="nombre" name="nombre" type="text" id="nombre"
                                                                                                                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                                                                                                                placeholder="Nombre" required>
                                                                                                        </div>-->
                        <div class="mb-5">
                            <label for="imagen" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Imagen
                                de perfil</label>
                            <input name="inputFile" type="file" id="imagen" @change.prevent="event => cargarImagen(event)"
                                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500">
                        </div>
                    </div>
                    <!-- Modal footer -->
                    <div
                        class="flex justify-center items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
                        <button
                            class="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">Actualizar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style>
.mensaje-izquierda {
    display: block;
    background-color: white;
    color: black;
    border-radius: 0px 10px 10px 10px;
    padding: 10px;
    margin: 10px;
    float: left;
}

.mensaje-derecha {
    display: block;
    background-color: white;
    color: black;
    border-radius: 10px 0px 10px 10px;
    padding: 10px;
    margin: 10px;
    float: right;
}

.nombre-usuario {
    font-weight: bold;
    /* Otros estilos deseados para el nombre del usuario */
}

.fecha-msg {
    font-size: 0.8em;
    /* Otros estilos deseados para la fecha del mensaje */
}

.contenedor-padre {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.div-arriba {
    flex: 1;
}

.div-abajo {
    height: 59px;
}

.v-center {
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>