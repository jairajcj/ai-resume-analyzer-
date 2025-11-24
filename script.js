// Initialize Lucide Icons
lucide.createIcons();

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// DOM Elements
const app = document.getElementById('app');
const heroSection = document.getElementById('hero');
const analysisSection = document.getElementById('analysis');
const dashboardSection = document.getElementById('dashboard');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const resetBtn = document.getElementById('reset-btn');

// Global variable to store extracted text
let resumeText = '';
let resumeFileName = '';

// GSAP Animations - Hero Entry
gsap.from(".navbar", { y: -20, opacity: 0, duration: 0.8, ease: "power2.out" });
gsap.from(".hero-title", { y: 30, opacity: 0, duration: 0.8, delay: 0.2, ease: "power2.out" });
gsap.from(".hero-subtitle", { y: 20, opacity: 0, duration: 0.8, delay: 0.4, ease: "power2.out" });
gsap.from(".upload-container", { y: 40, opacity: 0, duration: 0.8, delay: 0.6, ease: "power2.out" });

// Event Listeners for File Upload
dropZone.addEventListener('click', () => {
    fileInput.value = ''; // Reset value to ensure change event fires even for same file
    fileInput.click();
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
        handleFileUpload(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFileUpload(e.target.files[0]);
    }
});

resetBtn.addEventListener('click', resetApp);

// Main Logic - Extract text from PDF
async function handleFileUpload(file) {
    resumeFileName = file.name;

    // Simulate scanning effect
    dropZone.classList.add('scanning');

    // Check file type
    if (file.type === 'application/pdf') {
        try {
            resumeText = await extractTextFromPDF(file);
            console.log('Extracted text:', resumeText);

            // Transition to Analysis after extraction
            setTimeout(() => {
                transitionToAnalysis();
            }, 1000);
        } catch (error) {
            console.error('Error extracting PDF:', error);
            alert('Error reading PDF file. Please try another file.');
            dropZone.classList.remove('scanning');
        }
    } else {
        // For non-PDF files, show a message
        alert('Please upload a PDF file. DOCX support coming soon!');
        dropZone.classList.remove('scanning');
    }
}

// Extract text from PDF using PDF.js
async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }

    return fullText.trim();
}

function transitionToAnalysis() {
    gsap.to(heroSection, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        onComplete: () => {
            heroSection.classList.add('hidden');
            analysisSection.classList.remove('hidden');

            gsap.fromTo(analysisSection,
                { opacity: 0, scale: 0.95 },
                { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }
            );

            // Simulate AI Analysis time
            setTimeout(() => {
                transitionToDashboard();
            }, 2500);
        }
    });
}

function transitionToDashboard() {
    gsap.to(analysisSection, {
        opacity: 0,
        scale: 1.05,
        duration: 0.4,
        onComplete: () => {
            analysisSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');

            gsap.fromTo(dashboardSection,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
            );

            // Stagger animations for cards
            gsap.from(".card, .resume-preview-card", {
                y: 20,
                opacity: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: "power2.out",
                delay: 0.2
            });

            // Display extracted text and analyze
            displayResumeText();
            analyzeResume();
        }
    });
}

function resetApp() {
    gsap.to(dashboardSection, {
        opacity: 0,
        y: 20,
        duration: 0.4,
        onComplete: () => {
            dashboardSection.classList.add('hidden');
            heroSection.classList.remove('hidden');
            dropZone.classList.remove('scanning');
            fileInput.value = '';
            resumeText = '';
            resumeFileName = '';

            gsap.fromTo(heroSection,
                { opacity: 0, y: -20 },
                { opacity: 1, y: 0, duration: 0.5 }
            );
        }
    });
}

// Display extracted resume text
function displayResumeText() {
    const previewDiv = document.getElementById('resume-text-preview');
    const filenameDisplay = document.getElementById('filename-display');

    filenameDisplay.textContent = `Analyzing: ${resumeFileName}`;

    if (resumeText) {
        // Truncate if too long for display
        const displayText = resumeText.length > 2000
            ? resumeText.substring(0, 2000) + '...\n\n[Text truncated for display]'
            : resumeText;
        previewDiv.textContent = displayText;
    } else {
        previewDiv.textContent = '[No text could be extracted from the PDF]';
    }
}

// Analyze Resume based on extracted text
function analyzeResume() {
    const analysis = performResumeAnalysis(resumeText);

    renderCharts(analysis);
    populateData(analysis);
}

// Perform actual analysis on the resume text
function performResumeAnalysis(text) {
    const lowerText = text.toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // ATS Score Analysis
    const atsKeywords = ['experience', 'skills', 'education', 'projects', 'achievements', 'responsibilities', 'managed', 'developed', 'led', 'created'];
    const atsMatches = atsKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const atsScore = Math.min(95, Math.round((atsMatches / atsKeywords.length) * 100) + Math.floor(Math.random() * 10));

    // Grammar Score (basic heuristics)
    const hasProperCapitalization = /[A-Z]/.test(text);
    const hasPunctuation = /[.,;!?]/.test(text);
    const grammarScore = hasProperCapitalization && hasPunctuation && wordCount > 50
        ? Math.floor(Math.random() * (100 - 90) + 90)
        : Math.floor(Math.random() * (85 - 70) + 70);

    // Formatting Score
    const hasStructure = lowerText.includes('experience') && lowerText.includes('education');
    const hasContactInfo = /email|phone|linkedin|github/.test(lowerText);
    const formattingScore = hasStructure && hasContactInfo
        ? Math.floor(Math.random() * (95 - 85) + 85)
        : Math.floor(Math.random() * (80 - 65) + 65);

    // Extract potential skills
    const techSkills = ['python', 'javascript', 'java', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 'tensorflow', 'pytorch', 'machine learning', 'data science'];
    const detectedSkills = techSkills.filter(skill => lowerText.includes(skill));

    // Generate feedback
    const feedback = [];

    if (atsScore < 80) {
        feedback.push({ text: "Add more action verbs like 'managed', 'developed', 'led' to improve ATS compatibility.", type: "alert" });
    }
    if (!lowerText.includes('quantif') && !lowerText.includes('metric')) {
        feedback.push({ text: "Quantify your achievements with numbers and metrics (e.g., 'Increased sales by 25%').", type: "alert" });
    }
    if (detectedSkills.length > 0) {
        feedback.push({ text: `Strong technical skills detected: ${detectedSkills.slice(0, 3).join(', ')}.`, type: "success" });
    }
    if (!hasContactInfo) {
        feedback.push({ text: "Ensure your resume includes contact information (email, phone, LinkedIn).", type: "alert" });
    }
    if (wordCount < 200) {
        feedback.push({ text: "Your resume seems short. Consider adding more details about your experience and achievements.", type: "alert" });
    }

    // Determine recommended roles based on skills
    const roles = [];
    if (detectedSkills.some(s => ['python', 'tensorflow', 'pytorch', 'machine learning'].includes(s))) {
        roles.push({ title: "Machine Learning Engineer", match: "95%" });
        roles.push({ title: "Data Scientist", match: "90%" });
    }
    if (detectedSkills.some(s => ['javascript', 'react', 'node'].includes(s))) {
        roles.push({ title: "Full Stack Developer", match: "92%" });
        roles.push({ title: "Frontend Engineer", match: "88%" });
    }
    if (detectedSkills.some(s => ['aws', 'docker', 'kubernetes'].includes(s))) {
        roles.push({ title: "DevOps Engineer", match: "90%" });
    }

    // Default roles if no specific skills detected
    if (roles.length === 0) {
        roles.push({ title: "Software Engineer", match: "85%" });
        roles.push({ title: "Project Manager", match: "78%" });
        roles.push({ title: "Business Analyst", match: "75%" });
    }

    return {
        atsScore,
        grammarScore,
        formattingScore,
        feedback,
        roles,
        detectedSkills
    };
}

// Chart.js & Data Population
function renderCharts(analysis) {
    const { atsScore, grammarScore, formattingScore } = analysis;

    // 1. ATS Score (Doughnut)
    const atsCtx = document.getElementById('atsChart').getContext('2d');

    // Update ATS Text
    const atsValue = document.getElementById('ats-score');
    const atsMessage = document.getElementById('ats-message');

    // Animate ATS Number
    let currentAts = 0;
    const atsInterval = setInterval(() => {
        if (currentAts >= atsScore) {
            clearInterval(atsInterval);
        } else {
            currentAts++;
            atsValue.textContent = currentAts;
        }
    }, 15);

    // Set Message
    if (atsScore > 90) atsMessage.textContent = "Excellent ATS Optimization";
    else if (atsScore > 75) atsMessage.textContent = "Good, but could use more keywords";
    else atsMessage.textContent = "Needs improvement for ATS systems";

    new Chart(atsCtx, {
        type: 'doughnut',
        data: {
            labels: ['Score', 'Gap'],
            datasets: [{
                data: [atsScore, 100 - atsScore],
                backgroundColor: ['#ffffff', 'rgba(255, 255, 255, 0.2)'],
                borderWidth: 0,
                cutout: '75%',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            animation: { animateScale: true, animateRotate: true }
        }
    });

    // 2. Grammar Score
    const grammarValue = document.getElementById('grammar-score');
    const grammarBar = document.getElementById('grammar-bar');

    // Animate Grammar
    let currentGrammar = 0;
    const grammarInterval = setInterval(() => {
        if (currentGrammar >= grammarScore) {
            clearInterval(grammarInterval);
            grammarBar.style.width = `${grammarScore}%`;
        } else {
            currentGrammar++;
            grammarValue.textContent = currentGrammar;
        }
    }, 20);

    // 3. Formatting Score
    const formatValue = document.getElementById('formatting-score');
    const formatBar = document.getElementById('formatting-bar');

    // Animate Formatting
    let currentFormat = 0;
    const formatInterval = setInterval(() => {
        if (currentFormat >= formattingScore) {
            clearInterval(formatInterval);
            formatBar.style.width = `${formattingScore}%`;
        } else {
            currentFormat++;
            formatValue.textContent = currentFormat;
        }
    }, 20);
}

function populateData(analysis) {
    const { roles, feedback } = analysis;

    // Recommended Roles
    const rolesList = document.getElementById('roles-list');
    rolesList.innerHTML = roles.map(role => `
        <div class="role-item">
            <span class="role-title">${role.title}</span>
            <span class="role-match">${role.match}</span>
        </div>
    `).join('');

    // Feedback
    const feedbackList = document.getElementById('feedback-list');
    feedbackList.innerHTML = feedback.map(item => `
        <li class="feedback-item">
            <i data-lucide="${item.type === 'success' ? 'check-circle' : 'alert-circle'}" 
               class="feedback-icon ${item.type}"></i>
            <span>${item.text}</span>
        </li>
    `).join('');

    // Re-initialize icons
    lucide.createIcons();
}
