/**
 * Formats an ISO Date String or Date Object into a pt-BR date string
 * while forcing the UTC timezone to prevent local browser offsets 
 * from shifting the date one day backwards.
 *
 * @param {string | Date} dateValue - The date string from MongoDB (e.g., '2024-01-01T00:00:00.000Z')
 * @returns {string} - Formatted date string (e.g., '01/01/2024')
 */
export const formatDateUTC = (dateValue) => {
    if (!dateValue) return '-';
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
        return '-';
    }
};

/**
 * Formats an ISO Date String into a pt-BR datetime string
 * This is useful for logs and observations where local system time makes sense,
 * but can also be forced to UTC if needed.
 */
export const formatDateTime = (dateValue) => {
    if (!dateValue) return '-';
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '-';
        return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
        return '-';
    }
};
