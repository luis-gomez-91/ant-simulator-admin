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

    const licenceTypeContainer = document.getElementById('licenceTypeContainer');
    const questionsTableBody = document.getElementById('questions-table-body');
    const backIconLink = document.getElementById('iconBack');

    const licenceData = await getSingleLicenceById(currentLicenceId);
    if (licenceData) {
        console.log(licenceData)
        licenceTypeContainer.innerHTML = `
            <div>
                <h1>Licencia tipo ${licenceData.name} (versión ${licenceData.version.year})</h1>
                <a href="${licenceData.question_bank}" class="btn btn-outline-light" target="_blank">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-file-type-pdf"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" /><path d="M17 18h2" /><path d="M20 15h-3v6" /><path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" /></svg>
                    Banco de preguntas
                </a>
            </div>
            <img src="${licenceData.image}" alt="">
        `;
    backIconLink.href = `licences.html?id=${licenceData.version.id}`;

    } else {
        licenceTypeContainer.innerHTML = `<h4>Error: No se pudo cargar la licencia (ID: ${currentLicenceId}).</h4>`;
    }

    // --- Cargar y Renderizar las Preguntas ---
    const questions = await getQuestionsForLicence(currentLicenceId);
    questionsTableBody.innerHTML = ''; // Limpiar la tabla antes de rellenar

    if (questions && questions.length > 0) {
        // const sortedQuestions = questions.sort((a, b) => (a.num || 0) - (b.num || 0));
        const order = localStorage.getItem('questionOrder') || 'asc';
        const sortedQuestions = questions.sort((a, b) => {
            const numA = a.num || 0;
            const numB = b.num || 0;
            return order === 'asc' ? numA - numB : numB - numA;
        });
        
        // Si no usas un 'num' desde el backend, puedes usar el índice:
        // const sortedQuestions = questions; 

        let tableRowsHtml = '';
        const letterLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g']; // Puedes extender esto si necesitas más opciones

        sortedQuestions.forEach(question => {
            const questionImageUrl = question.image ? question.image.startsWith('http') ? question.image : `${SERVER_URL}${question.image}` : '';
            const imageHtml = questionImageUrl ? `<a href="#" data-bs-toggle="modal" data-bs-target="#imgModal" onclick="document.getElementById('imgContent').src = '${questionImageUrl}'"><img src="${questionImageUrl}" alt="Imagen de pregunta" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></a>` : 'No';

            let choicesHtml = `<ul style="list-style-type: none; padding-left: 0; margin-top: 5px; color: #e0e0e0;">`; // Color para texto de opciones
            if (question.choices && question.choices.length > 0) {
                question.choices.forEach((choice, index) => {
                    const label = letterLabels[index] || String.fromCharCode(97 + index);
                    
                    const isCorrect = choice.is_correct;
                    const choiceColor = isCorrect ? 'green' : '#555';
                    const backgroundColor = isCorrect ? '#d4edda' : 'transparent'; // verde claro para fondo correcto

                    choicesHtml += `<li style="
                        color: ${choiceColor}; 
                        background-color: ${backgroundColor};
                        font-size: 0.9em; 
                        margin-bottom: 2px; 
                        padding: 4px; 
                        border-radius: 4px;">
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
    updateSortIcon(localStorage.getItem('questionOrder') || 'asc');
}

document.getElementById('sortToggle').addEventListener('click', () => {
    const current = localStorage.getItem('questionOrder') || 'asc';
    const next = current === 'asc' ? 'desc' : 'asc';
    localStorage.setItem('questionOrder', next);
    updateSortIcon(next);
    renderPageContent(); // recarga el contenido con el nuevo orden
});

function updateSortIcon(order) {
    const sortIcon = document.getElementById('sortIcon');
    if (!sortIcon) return;

    // Limpiar contenido actual del icono
    sortIcon.innerHTML = '';

    if (order === 'asc') {
        sortIcon.className = "icon icon-tabler icons-tabler-outline icon-tabler-sort-ascending";
        sortIcon.innerHTML = `
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M4 6l7 0" />
            <path d="M4 12l7 0" />
            <path d="M4 18l9 0" />
            <path d="M15 9l3 -3l3 3" />
            <path d="M18 6l0 12" />
        `;
    } else {
        sortIcon.className = "icon icon-tabler icons-tabler-outline icon-tabler-sort-descending";
        sortIcon.innerHTML = `
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M4 6l9 0" />
            <path d="M4 12l7 0" />
            <path d="M4 18l7 0" />
            <path d="M15 15l3 3l3 -3" />
            <path d="M18 6l0 12" />
        `;
    }
}


// Inicializa la página al cargar el DOM
document.addEventListener('DOMContentLoaded', renderPageContent);