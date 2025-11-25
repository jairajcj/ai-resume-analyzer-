// DOM Elements
const dropZone = document.getElementById('dropZone');
const resumeInput = document.getElementById('resumeInput');
const fileNameDisplay = document.getElementById('fileName');
const jdInput = document.getElementById('jdInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const loadingState = document.getElementById('loadingState');
const resultsSection = document.getElementById('resultsSection');

// State
let resumeText = '';
window.setDemoResume = (text) => { resumeText = text; };
let apiKey = localStorage.getItem('gemini_api_key') || '';

// Initialize
if (!apiKey) {
    // Use demo mode by default for easy testing
    apiKey = 'demo';
    localStorage.setItem('gemini_api_key', apiKey);
    apiKeyInput.value = apiKey;
    apiKeyInput.type = "password";
}

// Make the entire upload card clickable to open file selector
const uploadCard = document.getElementById('dropZone');
uploadCard.addEventListener('click', () => {
    document.getElementById('resumeInput').click();
});
saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem('gemini_api_key', key);
        apiKey = key;
        alert('API Key saved successfully!');
    } else {
        alert('Please enter a valid API key.');
    }
});

// File Upload Handling
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    handleFile(file);
});

resumeInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFile(file);
});

async function handleFile(file) {
    if (!file) return;

    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
        alert('Please upload a PDF or TXT file.');
        return;
    }

    if (file.type === 'text/plain') {
        // Read plain text file
        const text = await file.text();
        resumeText = text;
        console.log('Text file loaded');
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze Resume';
        return;
    }

    fileNameDisplay.textContent = file.name;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    try {
        resumeText = await extractTextFromPDF(file);
        console.log('Text extracted:', resumeText.substring(0, 100) + '...');
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze Resume';
    } catch (error) {
        console.error('Error parsing PDF:', error);
        fileNameDisplay.textContent = 'Error parsing PDF. Please try another file.';
        analyzeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze Resume';
    }
}

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}

// Analysis Logic
analyzeBtn.addEventListener('click', async () => {
    if (!apiKey) {
        alert('Please enter and save your Gemini API Key first.');
        return;
    }

    if (!resumeText) {
        alert('Please upload a resume first.');
        return;
    }

    const jobDescription = jdInput.value.trim();

    // UI Updates
    loadingState.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    analyzeBtn.disabled = true;

    try {
        const analysis = await analyzeWithGemini(resumeText, jobDescription);
        displayResults(analysis);
    } catch (error) {
        console.error('Analysis failed:', error);
        alert('Analysis failed. Please check your API key and try again.');
    } finally {
        loadingState.classList.add('hidden');
        analyzeBtn.disabled = false;
    }
});

async function analyzeWithGemini(resume, jd) {
    // DEMO MODE
    if (apiKey.toLowerCase() === 'demo') {
        console.log('Using Demo Mode');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
        return {
            atsScore: 85,
            grammarScore: 92,
            structureScore: 78,
            formattingScore: 88,
            suggestedRole: "Senior Frontend Engineer",
            jobMatchScore: jd ? 95 : 0,
            strengths: [
                "Strong command of JavaScript and modern frameworks",
                "Clear and concise professional summary",
                "Good use of action verbs in experience section"
            ],
            improvements: [
                "Consider adding more quantifiable metrics to achievements",
                "Include a dedicated 'Skills' section for better ATS parsing",
                "Ensure consistent date formatting across all roles"
            ],
            missingKeywords: ["TypeScript", "CI/CD", "Docker", "GraphQL", "System Design"]
        };
    }

    const prompt = `
        You are an expert AI Resume Analyzer and Career Coach. 
        Analyze the following resume text and provide a structured assessment.
        
        RESUME TEXT:
        ${resume.substring(0, 10000)} <!-- Truncate to avoid token limits if necessary -->

        ${jd ? `JOB DESCRIPTION:\n${jd}` : 'NO JOB DESCRIPTION PROVIDED. Evaluate based on general best practices for the inferred role.'}

        Return ONLY a raw JSON object (no markdown formatting, no backticks) with the following structure:
        {
            "atsScore": number (0-100),
            "grammarScore": number (0-100),
            "structureScore": number (0-100),
            "formattingScore": number (0-100),
            "suggestedRole": "string (e.g. Senior Frontend Developer)",
            "jobMatchScore": number (0-100, return 0 if no JD provided),
            "strengths": ["string", "string", ...],
            "improvements": ["string", "string", ...],
            "missingKeywords": ["string", "string", ...]
        }
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }]
        })
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;

    // Clean up markdown if present
    const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
}

function displayResults(data) {
    resultsSection.classList.remove('hidden');

    // Animate Charts
    animateChart('atsChart', data.atsScore, '#6366f1');
    animateChart('grammarChart', data.grammarScore, '#a855f7');
    animateChart('structureChart', data.structureScore, '#ec4899');
    animateChart('formattingChart', data.formattingScore, '#eab308');

    if (data.jobMatchScore > 0) {
        animateChart('jobMatchChart', data.jobMatchScore, '#22c55e');
    } else {
        // Reset or hide job match if no JD
        animateChart('jobMatchChart', 0, '#22c55e');
    }

    // Text Content
    document.getElementById('suggestedRole').textContent = data.suggestedRole;

    // Lists
    updateList('strengthsList', data.strengths);
    updateList('improvementsList', data.improvements);

    const keywordsContainer = document.getElementById('keywordsList');
    keywordsContainer.innerHTML = '';
    data.missingKeywords.forEach(keyword => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = keyword;
        keywordsContainer.appendChild(span);
    });

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function animateChart(elementId, percentage, color) {
    const chart = document.getElementById(elementId);
    const circle = chart.querySelector('.circle');
    const text = chart.querySelector('.percentage');

    // Reset
    circle.style.strokeDasharray = '0, 100';
    text.textContent = '0%';

    // Animate
    setTimeout(() => {
        circle.style.stroke = color;
        circle.style.strokeDasharray = `${percentage}, 100`;

        let current = 0;
        const interval = setInterval(() => {
            if (current >= percentage) {
                clearInterval(interval);
            } else {
                current++;
                text.textContent = `${current}%`;
            }
        }, 10);
    }, 100);
}

function updateList(elementId, items) {
    const list = document.getElementById(elementId);
    list.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
    });
}
