var idLicencia = 1
// const SERVER_URL = 'https://antsimulator.onrender.com/'
const SERVER_URL = 'http://127.0.0.1:8000/'

async function fetchQuestions() {
    try {
        const response = await fetch(`${SERVER_URL}questions/?id_licencia=${idLicencia}`);
        const data = await response.json();
        console.log(data)

        const licencia = document.getElementById('licencia')
        const tipoPregunta = document.getElementById('question_type')
        const navLicencias = document.getElementById('navLicencias')

        let num = document.getElementById('num')
        num.value = data.lastNum + 1

        const tituloLicencia = document.getElementById('titleLicencia')
        tituloLicencia.innerHTML = `
            <div style="display:flex; gap: 1em; align-items:center; justify-content:center;">
                <img src="${data.licencia.image}" style="height:100px">
                <div style="display:flex; align-items:center; flex-direction:column; justify-content:center;">
                    <h1 class="p-0 m-0">Licencia tipo ${data.licencia.name}</h1>
                    <a class="p-1 m-0 btn btn-dark" href="${data.licencia.pdf}" target="_blank">
                        <span>
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-file-type-pdf"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" /><path d="M17 18h2" /><path d="M20 15h-3v6" /><path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" /></svg>                        
                        </span>
                        Descargar Cuestionario
                    </a>
                </div>
            </div>
        `

        if (data.questions && Array.isArray(data.questions)) {
            const tableBody = document.getElementById('questions-table-body');
            tableBody.innerHTML = '';

            data.questions.forEach((question) => {
                let image = question.image != null ? `<img src="${question.image}" alt="Img" width="50"></img>` : '';
                
                let letterLabels = ['a', 'b', 'c', 'd', 'e'];
                let choices = `<ul style="list-style-type: none; padding-left: 0; margin-top: 5px;">`;
                question.choices.forEach((choice, index) => {
                    let label = letterLabels[index] || String.fromCharCode(97 + index); // por si hay más de 5
                    choices += `<li style="color: ${choice.is_correct ? 'green' : 'black'}; font-size: 0.9em;">
                        <strong>${label})</strong> ${choice.text}
                    </li>`;
                });
                choices += `</ul>`;

                let row = `<tr>
                    <td class="text-center">${question.num}</td>
                    <td>
                        <div>${question.text}</div>
                        ${choices}  
                    </td>
                    <td class="text-center">${question.question_type.name}</td>
                    <td class="text-center">${image}</td>
                </tr>`;
                tableBody.innerHTML += row;
            });

            let licenciaOptions = ''
            let licenciaItemNav = ''
            data.licencias.forEach((x) => {
                licenciaOptions += `<option value="${x.id}">${x.name}</option>`
                licenciaItemNav += `
                    <li class="nav-item">
                        <a class="nav-link navItem" aria-current="page" id="navItem${x.id}" onclick="setLicenciaNavItem('${x.id}')">${x.name}</a>
                    </li>
                `
            })            

            licencia.innerHTML = licenciaOptions
            navLicencias.innerHTML = licenciaItemNav

            document.querySelectorAll('.navItem').forEach((el) => el.classList.remove('active'));
            let element = document.getElementById(`navItem${data.licencia.id}`)
            element.classList.add('active')

            let tipoPregunaOptions = ''
            data.tipo_preguntas.forEach((x) => {
                tipoPregunaOptions += `<option value="${x.id}">${x.name}</option>`
            })            
            tipoPregunta.innerHTML = tipoPregunaOptions


        } else {
            console.error('Error al obtener las preguntas');
        }

        licencia.addEventListener('change', async () => {
            const response = await fetch(`${SERVER_URL}fetchQuestionNum/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    licencia_id: licencia.value,
                }),
            });
    
            const data = await response.json();
            console.log(data);

            let num = document.getElementById('num')
            num.value = data.num + 1
        })

    } catch (error) {
        console.error('Hubo un error al cargar las preguntas:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
    
        const formData = new FormData(form);
    
        const imageInput = document.getElementById('image');
        if (imageInput.files.length === 0) {
            formData.delete('image');
        }
    
        const choicesTextareas = document.querySelectorAll('textarea[name="choices"]');
        const isCorrectRadios = document.querySelectorAll('input[name="is_correct"]');
    
        let choices = [];
    
        choicesTextareas.forEach((textarea, index) => {
            choices.push({
                text: textarea.value,
                is_correct: isCorrectRadios[index].checked,
            });
        });
    
        formData.delete('choices');
        formData.append('choices', JSON.stringify(choices));
    
        const licenceSelect = document.getElementById('licencia');
        const questionTypeSelect = document.getElementById('question_type');
    
        formData.append('licence_type_id', licenceSelect.value);
        formData.append('question_type_id', questionTypeSelect.value);
    
        try {
            const response = await fetch(`${SERVER_URL}question/`, {
                method: 'POST',
                body: formData
            });
    
            const data = await response.json();
            console.log(data);
    
            if (response.ok) {
                alert('Pregunta creada correctamente');
                form.reset();
                await fetchQuestions();  // 👈 recargar lista sin refrescar toda la página
            } else {
                alert('Error al crear pregunta: ' + data.detail);
            }
        } catch (error) {
            console.error('Error al enviar la pregunta:', error);
        }
    });
    
    setLicenciaNavItem = (id) => {
        
        idLicencia = id
        fetchQuestions()
    }

    window.onload = fetchQuestions;
})