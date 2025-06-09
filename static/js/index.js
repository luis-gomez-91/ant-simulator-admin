// const SERVER_URL = 'http://127.0.0.1:8000/'
const SERVER_URL = 'https://ant-simulator-back-production.up.railway.app/'

async function getAllVersions() {
    try {
        const response = await fetch(`${SERVER_URL}versions`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error al obtener los años.');
        }

        const data = await response.json();
        console.log("Años disponibles:", data);

        return data;

    } catch (error) {
        console.error("Hubo un problema al obtener los años:", error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    let versions = await getAllVersions()
    yearContainer = document.getElementById('yearContainer')

    let html = ''
    versions.forEach((version) => {
        html += `<a href="licences.html?id=${version.id}" class="btn btn-outline-light">${version.year}</a>`
    });
    yearContainer.innerHTML = html

})
