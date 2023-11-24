<script setup lang="ts">
import { ref } from 'vue'
import { getFirestore, doc, getDoc, collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';
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

var mensaje = ref("");
var usuarios = ref({});
var correo = ref("");
var nombre = ref("");
var busqueda = ref("");
var listaUsuarios: any = [];
var chateandoCon = "";

getDoc(usuarioDoc)
    .then((docSnapshot) => {
        if (docSnapshot.exists()) {
            // Si el documento existe, obtén el nombre de usuario
            nombre.value = docSnapshot.data().username;
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
    usuarios.value = snapshot.docs.map(doc => doc.data().username);
    snapshot.docs.map(doc => doc.data().username).forEach((usuario: any) => {
        if (usuario !== nombre.value) {
            listaUsuarios.push(usuario.toString().toUpperCase());
        }
    });
    console.log(listaUsuarios);
});

function logout() {
    localStorage.removeItem('user');
    window.location.href = "/";
}

function buscar() {
    console.log(busqueda.value);
    // eliminar espacios antes y despues
    busqueda.value = busqueda.value.trim();

    // Buscar en la lista de usuarios haciendo coincidir mayúsculas y minúsculas
    if (listaUsuarios.includes(busqueda.value.toUpperCase())) {
        console.log("Usuario encontrado");
        // Poner en camel case el valor de busqueda
        busqueda.value = busqueda.value.charAt(0).toUpperCase() + busqueda.value.slice(1);
        // Clickear en el usuario encontrado para abrir el chat
        document.getElementsByName(busqueda.value)[0].click();
    } else {
        console.log("Usuario no encontrado");
    }
}

function abrirChat(usuario: string) {
    // guardar el nombre del usuario con el que se está chateando
    chateandoCon = usuario;

    console.log(usuario);
    // Swal toast de "Chateando con"
    Toast.fire({
        icon: 'success',
        title: 'Chateando con ' + usuario,
    });

    //Obtener todos los mensajes de firestore
    const conversacionID = generarConversacionID(nombre.value, usuario);
    const mensajesRef = collection(db, 'mensajes', conversacionID, 'mensajes');

    onSnapshot(mensajesRef, (snapshot) => {
        // Guardar los mensajes en una lista
        var mensajes: any = [];
        snapshot.docs.map(doc => doc.data()).forEach((mensaje: any) => {
            mensajes.push(mensaje);
        });
        console.log(mensajes);
        
        // Ordenar los mensajes por fecha
        mensajes.sort((a: any, b: any) => a.timestamp - b.timestamp);
        console.log(mensajes);

        // Recorrer todos los mensajes cambiando el timestamp a una fecha legible
        mensajes.forEach((doc: any) => {
            // Convertir el timestamp a una fecha legible
            var fecha = new Date(doc.timestamp.seconds * 1000);
            // Guardar la fecha en el mensaje
            doc.timestamp = fecha.toLocaleString();
        });

        //Limpiar el chat
        document.getElementsByClassName("p-4 mt-14 bg-green-500 rounded-t-lg overflow-scroll")[0].innerHTML = "";
        
        //Mostrar los mensajes
        mensajes.forEach((doc:any) => {
            console.log(doc);
            if (doc.remitente === nombre.value) {
                // Mensaje enviado por el usuario actual
                document.getElementsByClassName("p-4 mt-14 bg-green-500 rounded-t-lg overflow-scroll")[0].innerHTML += `
                    <div class="w-full pl-5 pr-5 rounded-lg bg-gray-100 text-black">
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
                document.getElementsByClassName("p-4 mt-14 bg-green-500 rounded-t-lg overflow-scroll")[0].innerHTML += `
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
    });

}

function enviarMensaje(usuario1: any, usuario2: any, mensaje: any) {
    try {
        const conversacionID = generarConversacionID(usuario1, usuario2);

        // Referencia a la colección de mensajes para la conversación
        const mensajesRef = collection(db, 'mensajes', conversacionID, 'mensajes');

        addDoc(mensajesRef, {
            contenido: mensaje,
            remitente: usuario1,
            receptor: usuario2,
            timestamp: serverTimestamp()
        });
        console.log('Mensaje enviado correctamente');
    } catch (error) {
        console.error('Error al enviar el mensaje:', error);
    }
}

function generarConversacionID(usuario1: any, usuario2: any) {
    return usuario1 < usuario2 ? `${usuario1}_${usuario2}` : `${usuario2}_${usuario1}`;
}

</script>
<template>
    <nav class="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div class="px-3 py-3 lg:px-5 lg:pl-3">
            <div class="flex items-center justify-between">
                <div class="flex items-center justify-start rtl:justify-end">
                    <button data-drawer-target="logo-sidebar" data-drawer-toggle="logo-sidebar" aria-controls="logo-sidebar"
                        type="button"
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
                        <div>
                            <button type="button"
                                class="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                                aria-expanded="false" data-dropdown-toggle="dropdown-user">
                                <span class="sr-only">Open user menu</span>
                                <img class="w-8 h-8 rounded-full" src="@/assets/perfil.jpg" alt="user photo">
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
                    <form @submit.prevent="buscar">
                        <div class="relative">
                            <input v-model="busqueda" type="search" id="busqueda"
                                class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                                placeholder="Buscar amigos">
                            <button type="submit"
                                class="text-white absolute end-2.5 bottom-2.5 bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
                                <svg class="w-4 h-4 text-white dark:text-white" aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                        stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </li>
                <li v-for="(usuario, index) in usuarios" :key="index">
                    <a v-if="usuario !== nombre" :name="usuario" @click.prevent="abrirChat(usuario)" type="button" class="cursor-pointer flex items-center p-2 text-gray-900 rounded-lg dark:text-white
                                                hover:bg-gray-100 dark:hover:bg-gray-700 group">
                        <img class="w-8 h-8 rounded-full" src="@/assets/perfil.jpg" alt="user photo">
                        <span class="flex-1 ms-3 whitespace-nowrap">{{ usuario }}</span>
                    </a>
                </li>
            </ul>
        </div>
    </aside>

    <div class="p-4 sm:ml-64 bg-white">
        <div class="p-4 mt-14 bg-green-500 rounded-t-lg overflow-scroll" style="height: 100vh;">

        </div>

        <form>
            <label for="chat" class="sr-only ">Su mensaje</label>
            <div class="flex items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                <button type="button"
                    class="inline-flex justify-center p-2 text-gray-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
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
                    class="p-2 text-gray-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                    <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                        viewBox="0 0 20 20">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13.408 7.5h.01m-6.876 0h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM4.6 11a5.5 5.5 0 0 0 10.81 0H4.6Z" />
                    </svg>
                    <span class="sr-only">Add emoji</span>
                </button>
                <textarea id="chat" rows="1" v-model="mensaje"
                    class="block mx-4 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                    placeholder="Escriba un mensaje..."></textarea>
                <a type="button" @click.prevent="enviarMensaje(nombre, chateandoCon, mensaje)"
                    class="inline-flex justify-center p-2 text-green-600 rounded-full cursor-pointer hover:bg-green-100 dark:text-green-500 dark:hover:bg-gray-600">
                    <svg class="w-5 h-5 rotate-90 rtl:-rotate-90" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor" viewBox="0 0 18 20">
                        <path
                            d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z" />
                    </svg>
                    <span class="sr-only">Enviar</span>
                </a>
            </div>
        </form>

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
</style>