// Configuration file for API keys
// IMPORTANT: Get your free API key from https://makersuite.google.com/app/apikey

const CONFIG = {
    // Replace 'YOUR_API_KEY_HERE' with your actual Gemini API key
    GEMINI_API_KEY: 'AIzaSyD_5VAoxS3xOKzWnKT7G8cVa1UHO8Q3URU',

    // Gemini API endpoint
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',

    // Model settings
    MODEL_SETTINGS: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
