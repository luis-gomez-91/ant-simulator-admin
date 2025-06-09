// const SERVER_URL = 'http://127.0.0.1:8000/';
const SERVER_URL = 'https://ant-simulator-back-production.up.railway.app/'

let currentLicenceId; // Variable global para el ID de la licencia actual

/**
 * Obtiene las preguntas para una licencia específica.
 * @param {number} licenceId El ID de la licencia.
 * @returns {Array<Object>|null} Lista de preguntas o null si hay un error.
 */
async function getQuestionsForLicence(licenceId) {
    try {
        const response = await fetch(`${SERVER_URL}questions/by_licence/${licenceId}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error al obtener preguntas: ${response.status} ${response.statusText}`);
        }
        const questions = await response.json();
        console.log("Preguntas obtenidas:", questions);
        return questions;
    } catch (error) {
        console.error("Hubo un problema al obtener las preguntas:", error);
        return null;
    }
}

/**
 * Obtiene los detalles de una única licencia por su ID.
 * @param {number} licenceId El ID de la licencia.
 * @returns {Object|null} El objeto LicenceType, o null si hay un error.
 */
async function getSingleLicenceById(licenceId) {
    try {
        console.log(`Intentando obtener detalles de licencia con ID: ${licenceId}`);
        const response = await fetch(`${SERVER_URL}licences/${licenceId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error al obtener la licencia: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Detalles de la licencia ${licenceId}:`, data);
        return data;
    } catch (error) {
        console.error(`Hubo un problema al obtener la licencia con ID ${licenceId}:`, error);
        return null;
    }
}

/**
 * Obtiene todos los tipos de pregunta disponibles.
 * @returns {Array<Object>|null} Lista de tipos de pregunta o null si hay un error.
 */
async function getAllQuestionTypes() {
    try {
        const response = await fetch(`${SERVER_URL}questions/types/`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error al obtener tipos de pregunta: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Tipos de pregunta obtenidos:", data);
        return data;
    } catch (error) {
        console.error("Hubo un problema al obtener los tipos de pregunta:", error);
        return null;
    }
}


/**
 * Renderiza la tabla de preguntas y actualiza el título de la licencia.
 * Esta función se encarga de toda la carga inicial de datos de la página.
 */
async function renderPageContent() {
    const urlParams = new URLSearchParams(window.location.search);
    currentLicenceId = urlParams.get('id'); // Asigna a la variable global

    const licenceTitleElement = document.getElementById('licenceTitle');
    const questionsTableBody = document.getElementById('questions-table-body');
    const backIconLink = document.getElementById('iconBack');

    // **VERIFICACIÓN CRÍTICA DE ELEMENTOS DEL DOM:**
    if (!licenceTitleElement || !questionsTableBody || !backIconLink) {
        console.error("Error: Uno o más elementos HTML con IDs 'licenceTitle', 'questions-table-body' o 'iconBack' no fueron encontrados.");
        return; // Salir si no se encuentran los elementos esenciales
    }

    if (!currentLicenceId) {
        console.error("No se proporcionó el ID de la licencia en la URL.");
        licenceTitleElement.textContent = 'Error: ID de licencia no especificado.';
        questionsTableBody.innerHTML = '<tr><td colspan="4">Por favor, selecciona una licencia válida.</td></tr>';
        return;
    }

    // --- Cargar y Mostrar el Título de la Licencia ---
    const licenceData = await getSingleLicenceById(currentLicenceId);
    if (licenceData) {
        licenceTitleElement.innerHTML = `Licencia tipo ${licenceData.name} (versión ${licenceData.version.year})`;
    backIconLink.href = `licences.html?id=${licenceData.version.id}`;

    } else {
        licenceTitleElement.innerHTML = `Error: No se pudo cargar la licencia (ID: ${currentLicenceId}).`;
    }

    // --- Cargar y Renderizar las Preguntas ---
    const questions = await getQuestionsForLicence(currentLicenceId);
    questionsTableBody.innerHTML = ''; // Limpiar la tabla antes de rellenar

    if (questions && questions.length > 0) {
        // Ordenar las preguntas por el número 'num' si lo tienes
        const sortedQuestions = questions.sort((a, b) => (a.num || 0) - (b.num || 0));
        // Si no usas un 'num' desde el backend, puedes usar el índice:
        // const sortedQuestions = questions; 

        let tableRowsHtml = '';
        const letterLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g']; // Puedes extender esto si necesitas más opciones

        sortedQuestions.forEach(question => {
            const questionImageUrl = question.image ? question.image.startsWith('http') ? question.image : `${SERVER_URL}${question.image}` : '';
            const imageHtml = questionImageUrl ? `<img src="${questionImageUrl}" alt="Imagen de pregunta" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : 'No';

            let choicesHtml = `<ul style="list-style-type: none; padding-left: 0; margin-top: 5px; color: #e0e0e0;">`; // Color para texto de opciones
            if (question.choices && question.choices.length > 0) {
                question.choices.forEach((choice, index) => {
                    const label = letterLabels[index] || String.fromCharCode(97 + index);
                    // Color para opción correcta
                    const choiceColor = choice.is_correct ? 'green' : '#555'; // Verde claro para correcta, gris claro para incorrecta
                    choicesHtml += `<li style="color: ${choiceColor}; font-size: 0.9em; margin-bottom: 2px;">
                        <strong>${label})</strong> ${choice.text}
                    </li>`;
                });
            } else {
                choicesHtml += `<li>Sin respuestas definidas.</li>`;
            }
            choicesHtml += `</ul>`;

            tableRowsHtml += `
                <tr>
                    <td class="text-center">${question.num || '-'}</td>
                    <td>
                        <div class="">${question.text}</div>
                        ${choicesHtml}  
                    </td>
                    <td class="text-center">${question.question_type ? question.question_type.name : 'N/A'}</td>
                    <td class="text-center">${imageHtml}</td>
                </tr>
            `;
        });
        questionsTableBody.innerHTML = tableRowsHtml;
    } else {
        questionsTableBody.innerHTML = '<tr><td colspan="4" class="">No se encontraron preguntas para esta licencia.</td></tr>';
    }

    // --- Actualizar el enlace de regreso ---
    const versionId = urlParams.get('versionId') || '';
}

// Inicializa la página al cargar el DOM
document.addEventListener('DOMContentLoaded', renderPageContent);