document.addEventListener('DOMContentLoaded', () => {
    const dateElement = document.getElementById('header-date');
    if (dateElement) {
        const now = new Date();
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        // Capitalize first letter of the date string (e.g., "15 de janeiro, 2026")
        const dateString = now.toLocaleDateString('pt-BR', options);

        // Ensure format "DD de Month, YYYY" if needed, or just standard pt-BR "15 de janeiro de 2026"
        // The design had "14 de Novembro, 2023". Let's try to match that style.

        const day = now.getDate();
        const month = now.toLocaleDateString('pt-BR', { month: 'long' });
        const year = now.getFullYear();

        // Capitalize month
        const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);

        dateElement.innerText = `${day} de ${monthCapitalized}, ${year}`;
    }
});
