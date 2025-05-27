export const debugLog = (category, message, error = null) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}][${category}]`;
    
    if (error) {
        console.error(`${prefix} ${message}`, error);
    } else {
        console.log(`${prefix} ${message}`);
    }
};
