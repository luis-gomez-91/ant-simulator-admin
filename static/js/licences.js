// const SERVER_URL = 'http://127.0.0.1:8000/';
const SERVER_URL = 'https://ant-simulator-back-production.up.railway.app/'

async function getLicencesByVersionId(versionId) {
    try {
        const response = await fetch(`${SERVER_URL}licences/by_version/${versionId}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error al obtener licencias: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`Licencias para la versión ${versionId}:`, data);
        return data;
    } catch (error) {
        console.error("Hubo un problema al obtener las licencias:", error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener el ID de la versión de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const versionId = urlParams.get('id'); // 'versionId' debe coincidir con el nombre del parámetro en la URL

    const titleContainer = document.getElementById('titleContainer');
    const licencesContainer = document.getElementById('licencesContainer');

    if (!versionId) {
        if(licencesContainer) licencesContainer.innerHTML = '<p>Por favor, selecciona un año desde la página principal.</p>';
        return;
    }


    const licences = await getLicencesByVersionId(versionId);

    let htmlTitle = `
        <h1 style="margin:0">Licencias disponibles</h1>
        <h4 style="margin:0; color: #bbb">Versión ${licences[0].version.year}</h4> 
    `
    titleContainer.innerHTML = htmlTitle


    if (licencesContainer && licences && licences.length > 0) {
        let htmlContent = '';
        licences.forEach(licence => {
            htmlContent += `
                <a href="questions.html?id=${licence.id}" class="btn btn-outline-light btn-lg" style="width:70px">${licence.name}</a>
                
            `;
        });
        licencesContainer.innerHTML = htmlContent;
    }
});