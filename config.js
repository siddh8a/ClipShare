// Configuration loader to inject Firebase credentials from server
(async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const config = await response.json();
            window.FIREBASE_CONFIG = config;
        }
    } catch (error) {
        console.log('Using fallback Firebase configuration');
    }
})();
