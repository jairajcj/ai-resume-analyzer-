// ==============================================================================
// WARNING: CLIENT-SIDE API KEY EXPOSURE
// If this application is deployed publicly, your API key will be visible. 
// For production, use a secure server-side proxy (e.g., Node.js/Express).
// ==============================================================================

// --- 1. CRITICAL: API Configuration ---
// !!! REPLACE THIS WITH YOUR VALID, FULL-LENGTH GEMINI API KEY !!!
const API_KEY = "AIzaSyA_B96ffq3_-elchR5jDIamtnuSF8x9uQc";
const MODEL_NAME = "gemini-2.5-flash";

// Access the imported PDF.js library via the window object
const pdfjsLib = window.pdfjsLib;

// --- 2. CRITICAL PDF.JS SETUP ---
// We must set the worker source for PDF.js to function correctly.
if (pdfjsLib) {
    // Note: The worker script must be accessible at this path.
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;
    console.log("PDF.js worker source set successfully.");
} else {
    console.error("PDF.js library not found. Check your HTML imports for the CDN link.");
}


/**
 * Converts an uploaded PDF file into a single string of text using PDF.js.
 * @param {File} file - The PDF File object from the input.
 * @returns {Promise<string>} The extracted text content.
 */
async function pdfToText(file) {
    if (!pdfjsLib) {
        throw new Error("PDF processing library not initialized. Cannot parse PDF.");
    }

    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = async function () {
            try {
                const arrayBuffer = this.result;
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();

                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }
                resolve(fullText.trim());
            } catch (e) {
                console.error("Error during PDF parsing:", e);
                reject("Failed to parse PDF file. Try converting the PDF to a plain text file (.txt) and re-uploading.");
            }
        };
        fileReader.onerror = reject;
        fileReader.readAsArrayBuffer(file);
    });
}

/**
 * Main function to initiate analysis using the Gemini API.
 */
window.analyzeResume = async function () {
    const fileInput = document.getElementById('resume-file');
    const jobDescription = document.getElementById('job-description').value;
    const resultsContainer = document.getElementById('results-container');
    const file = fileInput.files[0];

    // Check 1: File Presence
    if (!file) {
        resultsContainer.innerHTML = `<p style='color: var(--error-color);'>🛑 Please upload a resume file (PDF or TXT) to begin.</p>`;
        return;
    }

    resultsContainer.innerHTML = "<p><strong>Step 1/2:</strong> Extracting text from file... ⏳</p>";

    let resumeText = '';

    try {
        // Check 2: File Type and Extraction
        if (file.type === 'application/pdf') {
            resumeText = await pdfToText(file);
        } else if (file.type === 'text/plain') {
            resumeText = await file.text();
        } else {
            throw new Error(`Unsupported file type: ${file.type}. Please use PDF or TXT.`);
        }

        if (!resumeText.trim()) {
            throw new Error("The file is empty or no text could be extracted.");
        }

    } catch (error) {
        resultsContainer.innerHTML = `<p style='color: var(--error-color);'>File Processing Error: ${error.message}</p>`;
        return;
    }

    resultsContainer.innerHTML = "<p><strong>Step 2/2:</strong> Sending text to Gemini AI for analysis... 🧠</p>";
    console.log("Resume Text extracted and ready to send. Length:", resumeText.length);


    // --- Gemini API Call ---

    const prompt = `Act as a Senior HR Manager and expert ATS (Applicant Tracking System). Analyze the following Resume. 
    Compare it against the Job Description if provided. 
    Your analysis must cover three main areas: **ATS Formatting**, **Grammar/Clarity**, and **Structural Integrity**. 
    Provide a score out of 100 for each section and then a detailed, actionable list of suggestions for improvement in Markdown format.

    RESUME: """${resumeText}"""
    JOB DESCRIPTION: """${jobDescription || 'N/A'}"""
    
    Format your entire response using clear Markdown headings (use ##) and bullet points (*) for easy reading. Do NOT include any filler text outside of the analysis sections.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            })
        });

        const data = await response.json();

        // Check 3: API Response Status
        if (!response.ok) {
            let errorMessage = data.error ? data.error.message : `API request failed with status ${response.status}.`;
            if (response.status === 400 && errorMessage.includes('API_KEY_INVALID')) {
                errorMessage = "❌ API key is invalid or missing. Check the 'API_KEY' constant in script.js!";
            }
            throw new Error(errorMessage);
        }

        const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (analysis) {
            // Simple markdown to HTML conversion for display
            let formattedHtml = analysis
                .replace(/^###\s*(.*)$/gm, '<h3>$1</h3>')
                .replace(/^##\s*(.*)$/gm, '<h2>$1</h2>')
                .replace(/^\*\s*(.*)$/gm, '<li>$1</li>');

            // Cleanup list items and style the scores
            formattedHtml = formattedHtml.replace(/<\/h2>\s*<li>/g, '</h2><ul><li>');
            formattedHtml = formattedHtml.replace(/<\/li>\s*<h2>/g, '</li></ul><h2>');
            formattedHtml = formattedHtml.replace(/<\/li>$/g, '</li></ul>');
            formattedHtml = formattedHtml.replace(/([0-9]+\/[0-9]+)/g, '<strong class="score-value">$1</strong>');


            resultsContainer.innerHTML = formattedHtml;
        } else {
            resultsContainer.innerHTML = `<p style='color: var(--error-color);'>Error: The AI did not return a valid analysis. Check console for API response details.</p>`;
            console.error('AI Response Data:', data);
        }

    } catch (error) {
        resultsContainer.innerHTML = `<p style='color: var(--error-color);'>An error occurred: ${error.message}</p>`;
        console.error('Final API Call Error:', error);
    }
}
