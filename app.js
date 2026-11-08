// Clase Tarea actualizada con soporte para imágenes
class Tarea {
    constructor(nombre, imagen = null, completada = false, id = Date.now()) {
        this.id = id;
        this.nombre = nombre;
        this.imagen = imagen; // Guarda el string en Base64 (ya comprimido)
        this.completada = completada;
    }

    toggleCompletada() {
        this.completada = !this.completada;
    }

    editarNuevoNombre(nuevoNombre) {
        this.nombre = nuevoNombre;
    }
}

class GestorDeTareas {
    constructor() {
        this.tareas = [];
        this.ul = document.getElementById('lista-tareas');
        this.inputTexto = document.getElementById('nueva-tarea');
        this.inputImagen = document.getElementById('imagen-tarea');
        this.form = document.getElementById('formulario-tarea');
        this.mensajeError = document.getElementById('mensaje-error');
        
        // Elementos para la vista previa
        this.previewContainer = document.getElementById('preview-container');
        this.imagenPreview = document.getElementById('imagen-preview');
        this.btnQuitarImagen = document.getElementById('quitar-imagen');
        this.base64Temporal = null; // Almacena la imagen comprimida antes de guardar

        this.cargarDeLocalStorage();
        this.inicializarEventos();
        this.render();
    }

    inicializarEventos() {
        // 1. Manejo de la imagen seleccionada, redimensionar y comprimir
        this.inputImagen.addEventListener('change', (e) => {
            const archivo = e.target.files[0];
            if (archivo) {
                const reader = new FileReader();
                
                reader.onload = (evento) => {
                    const img = new Image();
                    img.src = evento.target.result;
                    
                    img.onload = () => {
                        // Tamaño máximo deseado
                        const MAX_WIDTH = 400;
                        const MAX_HEIGHT = 400;
                        let width = img.width;
                        let height = img.height;

                        // Calcular nuevas proporciones
                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height = Math.round((height * MAX_WIDTH) / width);
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width = Math.round((width * MAX_HEIGHT) / height);
                                height = MAX_HEIGHT;
                            }
                        }

                        // Crear canvas y dibujar imagen redimensionada
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Exportar a Base64 comprimido (JPEG calidad 70%)
                        this.base64Temporal = canvas.toDataURL('image/jpeg', 0.7);
                        
                        // Mostrar vista previa
                        this.imagenPreview.src = this.base64Temporal;
                        this.previewContainer.classList.remove('hidden');
                    };
                };
                reader.readAsDataURL(archivo);
            }
        });

        // 2. Quitar imagen seleccionada antes de guardar
        this.btnQuitarImagen.addEventListener('click', () => {
            this.base64Temporal = null;
            this.inputImagen.value = ''; // Limpiar input file
            this.previewContainer.classList.add('hidden');
        });

        // 3. Enviar formulario (CREATE)
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const nombreTarea = this.inputTexto.value.trim();
            
            if (nombreTarea === '') {
                this.mensajeError.classList.remove('hidden');
                return;
            }

            this.mensajeError.classList.add('hidden');
            this.agregarTarea(nombreTarea, this.base64Temporal);
            
            // Limpiar formulario después de agregar
            this.inputTexto.value = '';
            this.inputImagen.value = '';
            this.base64Temporal = null;
            this.previewContainer.classList.add('hidden');
        });
    }

    agregarTarea(nombre, imagen) {
        const nuevaTarea = new Tarea(nombre, imagen);
        this.tareas.push(nuevaTarea);
        this.guardarEnLocalStorage();
        this.render();
    }

    eliminarTarea(id) {
        if(confirm('¿Estás seguro de eliminar esta tarea?')) {
            this.tareas = this.tareas.filter(tarea => tarea.id !== id);
            this.guardarEnLocalStorage();
            this.render();
        }
    }

    editarTarea(id) {
        const tarea = this.tareas.find(t => t.id === id);
        if (tarea) {
            const nuevoNombre = prompt('Edita el título de la tarea:', tarea.nombre);
            if (nuevoNombre !== null && nuevoNombre.trim() !== '') {
                tarea.editarNuevoNombre(nuevoNombre.trim());
                this.guardarEnLocalStorage();
                this.render();
            }
        }
    }

    toggleTarea(id) {
        const tarea = this.tareas.find(t => t.id === id);
        if (tarea) {
            tarea.toggleCompletada();
            this.guardarEnLocalStorage();
            this.render();
        }
    }

    // Persistencia (LocalStorage)
    guardarEnLocalStorage() {
        try {
            localStorage.setItem('tareas_pro', JSON.stringify(this.tareas));
        } catch (e) {
            console.error("Error al guardar. El almacenamiento está lleno.", e);
            alert("El almacenamiento del navegador está lleno. Intenta eliminar algunas tareas con imágenes.");
        }
    }

    cargarDeLocalStorage() {
        const tareasGuardadas = localStorage.getItem('tareas_pro');
        if (tareasGuardadas) {
            const tareasParseadas = JSON.parse(tareasGuardadas);
            this.tareas = tareasParseadas.map(t => new Tarea(t.nombre, t.imagen, t.completada, t.id));
        }
    }

    // Renderizado (READ / UPDATE en DOM)
    render() {
        this.ul.innerHTML = ''; 

        if (this.tareas.length === 0) {
            this.ul.innerHTML = '<p style="text-align:center; color:#6b7280; padding: 2rem;">No hay tareas pendientes. ¡Crea una nueva!</p>';
            return;
        }

        this.tareas.forEach((tarea) => {
            const li = document.createElement('li');
            if (tarea.completada) li.classList.add('completada');

            // HTML dinámico: Si hay imagen, la muestra.
            const imagenHTML = tarea.imagen 
                ? `<img src="${tarea.imagen}" alt="Imagen de la tarea" class="tarea-img">` 
                : '';

            li.innerHTML = `
                <div class="tarea-contenido" data-id="${tarea.id}">
                    ${imagenHTML}
                    <span class="texto-tarea">${tarea.nombre}</span>
                </div>
                <div class="acciones">
                    <button class="btn-editar" data-id="${tarea.id}">Editar</button>
                    <button class="btn-eliminar" data-id="${tarea.id}">Eliminar</button>
                </div>
            `;

            const btnEditar = li.querySelector('.btn-editar');
            const btnEliminar = li.querySelector('.btn-eliminar');
            const contenidoTarea = li.querySelector('.tarea-contenido');

            btnEditar.addEventListener('click', (e) => {
                e.stopPropagation(); 
                this.editarTarea(tarea.id);
            });
            
            btnEliminar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.eliminarTarea(tarea.id);
            });
            
            contenidoTarea.addEventListener('click', () => this.toggleTarea(tarea.id));

            this.ul.appendChild(li);
        });
    }
}

// Inicialización cuando el HTML esté listo
document.addEventListener('DOMContentLoaded', () => {
    new GestorDeTareas();
});