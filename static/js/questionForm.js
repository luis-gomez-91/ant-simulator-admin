// static/js/questionForm.js

// Asume que SERVER_URL es global y viene de config.js
// También asume que currentLicenceId, getAllQuestionTypes y renderPageContent
// están disponibles globalmente desde questions.js

let choiceIndexCounter = 0; // Para asegurar IDs únicos para cada campo de respuesta dinámicamente

/**
 * Añade un nuevo campo de respuesta al formulario.
 * @param {boolean} isDefaultCorrect Indica si esta respuesta debe ser marcada como correcta por defecto.
 */
function addChoiceField(isDefaultCorrect = false) {
    const choicesContainer = document.getElementById('choices-container');
    if (!choicesContainer) {
        console.error("Contenedor de respuestas no encontrado (#choices-container).");
        return;
    }

    const currentIndex = choiceIndexCounter++; // Obtener y luego incrementar para IDs únicos

    const choiceHtml = `
        <div class="choice-item mb-3 p-2 border border-secondary rounded">
            <label for="choice_text_${currentIndex}" class="form-label">Respuesta ${currentIndex + 1}</label>
            <textarea id="choice_text_${currentIndex}" class="form-control" rows="2" required placeholder="Texto de la respuesta"></textarea>
            <div class="form-check mt-2">
                <input class="form-check-input" type="radio" name="is_correct_choice" id="is_correct_${currentIndex}" value="${currentIndex}" ${isDefaultCorrect ? 'checked' : ''}>
                <label class="form-check-label" for="is_correct_${currentIndex}">
                    Es Correcta
                </label>
            </div>
            <button type="button" class="btn btn-danger btn-sm mt-2 remove-choice-btn">Eliminar</button>
        </div>
    `;
    choicesContainer.insertAdjacentHTML('beforeend', choiceHtml);

    // Añadir listener para el botón de eliminar
    const removeBtn = choicesContainer.lastElementChild.querySelector('.remove-choice-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', (event) => {
            event.target.closest('.choice-item').remove();
            updateChoiceLabelsAndIndices(); // Reindexar después de eliminar
        });
    }
}

/**
 * Actualiza los labels y los valores de los radios de respuesta después de añadir/eliminar.
 */
function updateChoiceLabelsAndIndices() {
    const choicesContainer = document.getElementById('choices-container');
    if (!choicesContainer) return;

    Array.from(choicesContainer.children).forEach((choiceItem, index) => {
        const labelText = choiceItem.querySelector('label[for^="choice_text_"]');
        if (labelText) labelText.textContent = `Respuesta ${index + 1}`;
        
        const textarea = choiceItem.querySelector('textarea');
        if (textarea) textarea.id = `choice_text_${index}`;

        const radio = choiceItem.querySelector('input[type="radio"]');
        if (radio) {
            radio.id = `is_correct_${index}`;
            radio.value = index.toString(); 
        }

        const radioLabel = choiceItem.querySelector('label[for^="is_correct_"]');
        if (radioLabel) radioLabel.htmlFor = `is_correct_${index}`;
    });
}

/**
 * Carga los tipos de pregunta en el <select> del formulario.
 * Asume que getAllQuestionTypes() es global desde questions.js.
 * @param {string} selectElementId El ID del elemento <select>.
 */
async function populateQuestionTypesSelect(selectElementId) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) return;

    const types = await getAllQuestionTypes(); // Llama a la función de questions.js
    if (types && types.length > 0) {
        let optionsHtml = '';
        types.forEach(type => {
            optionsHtml += `<option value="${type.id}">${type.name}</option>`;
        });
        selectElement.innerHTML = optionsHtml;
    } else {
        selectElement.innerHTML = '<option value="">No hay tipos disponibles</option>';
    }
}

/**
 * Maneja el envío del formulario de creación de preguntas.
 * Asume que currentLicenceId y renderPageContent son globales desde questions.js.
 * @param {Event} event El evento de envío del formulario.
 */
async function submitQuestionForm(event) {
    event.preventDefault(); // Evita el envío tradicional del formulario

    const form = event.target;
    const questionText = document.getElementById('question_text')?.value;
    const questionTypeSelect = document.getElementById('question_type_select');
    const questionTypeId = questionTypeSelect?.value;
    const questionImageInput = document.getElementById('question_image');
    const questionImage = questionImageInput?.files[0];

    // **Validaciones iniciales:**
    if (!currentLicenceId) {
        alert('Error: No se ha podido determinar el ID de la licencia. Recarga la página.');
        return;
    }
    if (!questionText || !questionText.trim()) {
        alert('Por favor, escribe el texto de la pregunta.');
        return;
    }
    if (!questionTypeId) {
        alert('Por favor, selecciona un tipo de pregunta.');
        return;
    }

    // 1. Recolectar las opciones de respuesta
    const choices = [];
    const choiceItems = document.querySelectorAll('.choice-item');
    const correctAnswerRadio = document.querySelector('input[name="is_correct_choice"]:checked');
    const correctAnswerIndex = correctAnswerRadio ? correctAnswerRadio.value : null;

    if (!correctAnswerIndex) {
        alert('Debes seleccionar la respuesta correcta.');
        return;
    }
    
    if (choiceItems.length === 0) {
        alert('Debes añadir al menos una respuesta.');
        return;
    }

    let hasEmptyChoice = false;
    choiceItems.forEach((item, index) => {
        const text = item.querySelector('textarea')?.value;
        if (!text || !text.trim()) {
            hasEmptyChoice = true; // Marca si hay una respuesta vacía
            return; // No añadas esta respuesta vacía a la lista
        }
        const isCorrect = (index.toString() === correctAnswerIndex);
        
        choices.push({
            text: text.trim(),
            image: null, // Asumimos que no hay imagen para opciones por ahora
            is_correct: isCorrect
        });
    });

    if (hasEmptyChoice) {
        alert('Todas las respuestas deben tener texto.');
        return;
    }
    if (choices.length === 0) { // Si todas las respuestas eran vacías y se filtraron
        alert('Debes proporcionar al menos una respuesta válida.');
        return;
    }


    // 2. Crear FormData para enviar los datos (texto + imagen + JSON de opciones)
    const formData = new FormData();
    formData.append('text', questionText.trim());
    // `num` debería ser gestionado por el backend o determinar el siguiente número en la licencia actual
    // Por simplicidad, aquí usamos un número que el backend podría reemplazar o ajustar
    formData.append('num', 0); // El backend debería asignar el siguiente número secuencial (ej. 1, 2, 3...)
    formData.append('licence_type_id', currentLicenceId);
    formData.append('question_type_id', questionTypeId);
    
    if (questionImage) {
        formData.append('image', questionImage);
    }
    
    formData.append('choices_json', JSON.stringify(choices));

    try {
        const response = await fetch(`${SERVER_URL}questions/`, {
            method: 'POST',
            body: formData 
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error al crear la pregunta: ${response.status} ${response.statusText}`);
        }

        const newQuestion = await response.json();
        console.log("Pregunta creada exitosamente:", newQuestion);
        alert('¡Pregunta creada exitosamente!');
        form.reset(); // Limpia el formulario
        document.getElementById('choices-container').innerHTML = ''; // Limpia las opciones
        choiceIndexCounter = 0; // Reinicia el contador de índices de opciones
        initializeDefaultChoices(3); // Vuelve a añadir las 3 opciones por defecto
        
        // Vuelve a renderizar el contenido de la página para mostrar la nueva pregunta
        await renderPageContent(); 

    } catch (error) {
        console.error("Hubo un problema al crear la pregunta:", error);
        alert(`Error al crear la pregunta: ${error.message}`);
    }
}

/**
 * Inicializa el formulario con un número específico de respuestas por defecto.
 * La primera opción (índice 0) será marcada como correcta.
 * @param {number} count El número de respuestas por defecto a añadir.
 */
function initializeDefaultChoices(count) {
    // Asegurarse de que el contenedor de opciones esté vacío antes de añadir
    const choicesContainer = document.getElementById('choices-container');
    if (choicesContainer) choicesContainer.innerHTML = '';
    choiceIndexCounter = 0; // Reinicia el contador de índices

    for (let i = 0; i < count; i++) {
        addChoiceField(i === 0); // La primera opción (índice 0) será la correcta por defecto
    }
    updateChoiceLabelsAndIndices(); // Asegurarse de que los labels y radios estén correctos
}


// --- Event Listeners y Inicialización del Formulario ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar los tipos de pregunta en el select del formulario
    await populateQuestionTypesSelect('question_type_select');
    
    // 2. Añadir las 3 opciones de respuesta por defecto al cargar la página
    initializeDefaultChoices(3);

    // 3. Configurar listeners para el botón "Añadir Respuesta" y el envío del formulario
    const addChoiceBtn = document.getElementById('addChoiceBtn');
    const createQuestionForm = document.getElementById('createQuestionForm');

    if (addChoiceBtn) addChoiceBtn.addEventListener('click', addChoiceField);
    if (createQuestionForm) createQuestionForm.addEventListener('submit', submitQuestionForm);
});