function iniciarApp() {
    const selectCategorias = document.querySelector('#categorias');
    const resultado = document.querySelector('#resultado');
    if (selectCategorias) {
        selectCategorias.addEventListener('change', seleccionarCategoria);
        obtenerCategorias();
    }

    const favoritosDiv = document.querySelector('.favoritos');
    if (favoritosDiv) {
        obtenerFavoritos();
    }

    const modal = new bootstrap.Modal('#modal',{});


    function obtenerCategorias() {
        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
        fetch(url)
            .then(respuesta => {
                return respuesta.json();
            })
            .then(resultado => {
                // console.log(respuesta);
                mostrarCategorias(resultado.categories);
            })
    }

  

    function mostrarCategorias(categorias=[]) {
        categorias.forEach(categoria =>{
            const {strCategory} = categoria;
            const option = document.createElement('OPTION');
            option.value = strCategory;
            option.textContent = strCategory;
            selectCategorias.appendChild(option);
        })
    }

    function seleccionarCategoria(e) {
        const categoria = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;
        
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => mostrarRecetas(resultado.meals))
    }

    function mostrarRecetas(recetas = []) {
        limpiarHTML(resultado);//limpia el html previo para motrar los resultados nuevos

        const heading = document.createElement('H2');
        heading.classList.add('text-center', 'text-black', 'my-5');
        heading.textContent = recetas.length ? `Se Encontraron ${recetas.length} Resultados` : 'No hay Resultados';
        resultado.appendChild(heading);

        //iterar en los resultados
        recetas.forEach(receta =>{
            //extrar el id, nombre y la img minitatura del plato
            const {idMeal,strMeal,strMealThumb}= receta;
            
            const recetaContenedor = document.createElement('DIV');
            recetaContenedor.classList.add('col-md-4');

            const recetaCard = document.createElement('DIV');
            recetaCard.classList.add('card','mb-4', 'receta-card');

            const recetaImagen = document.createElement('IMG');
            recetaImagen.classList.add('card-img-top');
            recetaImagen.alt = `Imagen de la receta ${strMeal ?? receta.titulo}`;
            recetaImagen.src = strMealThumb ?? receta.img;

            const recetaCardBody = document.createElement('DIV');
            recetaCardBody.classList.add('card-body');

            const recetaHeading = document.createElement('H3');
            recetaHeading.classList.add('card-title', 'mb-3');
            recetaHeading.textContent = strMeal ?? receta.titulo;

            const recetaButton = document.createElement('BUTTON');
            recetaButton.classList.add('btn', 'btn-danger', 'w-100');
            recetaButton.textContent = 'Ver Receta';
            // recetaButton.dataset.bsTarget='#modal';//para conectar el boton con el modal
            // recetaButton.dataset.bsToggle='modal';
            recetaButton.onclick=function(){
                seleccionarReceta(idMeal ?? receta.id);
            }


            //inyectar en el html
            recetaCardBody.appendChild(recetaHeading);
            recetaCardBody.appendChild(recetaButton);

            recetaCard.appendChild(recetaImagen);
            recetaCard.appendChild(recetaCardBody);

            recetaContenedor.appendChild(recetaCard);

            resultado.appendChild(recetaContenedor);
        })

        // Aplicar ScrollReveal a las nuevas tarjetas
        ScrollReveal().reveal('.receta-card', {
            distance: '50px',
            duration: 800,
            easing: 'ease-out',
            origin: 'bottom',
            interval: 200
        });
        
    }

    function seleccionarReceta(id) {
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => mostrarRecetaModal(resultado.meals[0]));
    }

    function mostrarRecetaModal(receta) {
        //para mostrar el modal 
        const {idMeal, strInstructions, strMeal, strMealThumb} = receta;
        // console.log(receta);

        //añadir contenido al modal
        const modalTitle = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');
        const modalFooter = document.querySelector('.modal-footer');
        modalTitle.textContent=strMeal;
        modalBody.innerHTML= `
            <img class="img-fluid rounded" src="${strMealThumb}" alt="receta ${strMeal}" />
            <h3 class="my-3">Instrucciones</h3>
            <p>${strInstructions}</p>
            <h3 class="my-3">Ingredientes y Cantidades</h3>
        `;

        const listGroup = document.createElement('UL');
        listGroup.classList.add('list-group');

        //mostrar cantidades de ingredientes (ya que en la api salen cantidades vacias)
        for (let i = 1; i <=20; i++) {
            if (receta[`strIngredient${i}`]) {
                const ingrediente = receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];

                const ingredientesLi = document.createElement('LI');
                ingredientesLi.classList.add('list-group-item');
                ingredientesLi.textContent = `${ingrediente} - ${cantidad}`
                listGroup.appendChild(ingredientesLi);
            }
            

        }

        modalBody.appendChild(listGroup);

        //crear btn favorito
        limpiarHTML(modalFooter);
       
        const btnFavorito = document.createElement('BUTTON');
        btnFavorito.classList.add('btn', 'btn-danger', 'col');
        //si la receta ya existe en localstorage aparece el btn como "eliminar de favoritos" caso contrario "guardar en favoritos" cada uno con su respectivo icono
        btnFavorito.innerHTML = existeStorage(idMeal) ? '<i class="ri-delete-bin-6-fill"></i> Eliminar de Favoritos': '<i class="ri-heart-fill"></i> Guardar en Favoritos';
        modalFooter.appendChild(btnFavorito);

        //localstorage
        btnFavorito.onclick = function() {
            if (existeStorage(idMeal)) {
                eliminarFavorito(idMeal);
                btnFavorito.innerHTML ='<i class="ri-heart-fill"></i> Guardar en Favoritos';//👈
                mostrarToast('Eliminado Correctamente');
                return
            }
                    //SE AÑADEN DE NUEVO LOS BOTONES (ICONO"👈") PARA QUE CAMBIEN DE MANERA DINAMICA AL DAR CLICK YA SEA PARA GUARDAR O ELIMINAR LA RECETA

            agregarFavorito({
                id: idMeal,
                titulo: strMeal,
                img: strMealThumb
                
            });
            btnFavorito.innerHTML ='<i class="ri-delete-bin-6-fill"></i> Eliminar de Favoritos';//👈
            mostrarToast('Agregado correctamente');
        }

        //muestra el modal
        modal.show();
        
    }

    function agregarFavorito(receta) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]));

    }

    function eliminarFavorito(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        const nuevosFavoritos = favoritos.filter(favorito => favorito.id !== id);
        localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
         // Si esta en favoritos.html, recarga la página
        if (window.location.pathname.includes('favoritos.html')) {
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    }

    //esta funcion es para la validacion si existe ya un elemento almacenado y no repetirlo
    function existeStorage(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        return favoritos.some(favorito => favorito.id === id);
    }

    function obtenerFavoritos() {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        if (favoritos.length) {
            mostrarRecetas(favoritos);
            return
        }

        const noFavoritos = document.createElement('P');
        noFavoritos.textContent= 'No hay favoritos agregados aun 😱';
        noFavoritos.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');
        favoritosDiv.appendChild(noFavoritos);
    }

    function mostrarToast(mensaje) {
        const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            }
          });
          Toast.fire({
            icon: "success",
            title: `${mensaje}`
          });
    }
    function limpiarHTML(selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    }
}
document.addEventListener('DOMContentLoaded',iniciarApp);