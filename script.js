// Initialize Lucide Icons
lucide.createIcons();

// DOM Elements
const app = document.getElementById('app');
const heroSection = document.getElementById('hero');
const analysisSection = document.getElementById('analysis');
const dashboardSection = document.getElementById('dashboard');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const resetBtn = document.getElementById('reset-btn');

// GSAP Animations - Hero Entry
gsap.from(".navbar", { y: -20, opacity: 0, duration: 0.8, ease: "power2.out" });
gsap.from(".hero-title", { y: 30, opacity: 0, duration: 0.8, delay: 0.2, ease: "power2.out" });
gsap.from(".hero-subtitle", { y: 20, opacity: 0, duration: 0.8, delay: 0.4, ease: "power2.out" });
gsap.from(".upload-container", { y: 40, opacity: 0, duration: 0.8, delay: 0.6, ease: "power2.out" });

// Event Listeners for File Upload
dropZone.addEventListener('click', () => fileInput.click());

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

// Main Logic
function handleFileUpload(file) {
    // Simulate scanning effect
    dropZone.classList.add('scanning');

    // Transition to Analysis
    setTimeout(() => {
        transitionToAnalysis();
    }, 1000);
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

            renderCharts();
            populateData();
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

            gsap.fromTo(heroSection,
                { opacity: 0, y: -20 },
                { opacity: 1, y: 0, duration: 0.5 }
            );
        }
    });
}

// Chart.js & Data Population
function renderCharts() {
    // 1. ATS Score (Doughnut)
    const atsCtx = document.getElementById('atsChart').getContext('2d');
    const atsScore = Math.floor(Math.random() * (98 - 85) + 85); // Random score 85-98

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
    else atsMessage.textContent = "Good, but needs keyword tuning";

    new Chart(atsCtx, {
        type: 'doughnut',
        data: {
            labels: ['Score', 'Gap'],
            datasets: [{
                data: [atsScore, 100 - atsScore],
                backgroundColor: ['#ffffff', 'rgba(255, 255, 255, 0.2)'], // White for contrast on blue card
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
    const grammarScore = Math.floor(Math.random() * (100 - 90) + 90);
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
    const formatScore = Math.floor(Math.random() * (95 - 80) + 80);
    const formatValue = document.getElementById('formatting-score');
    const formatBar = document.getElementById('formatting-bar');

    // Animate Formatting
    let currentFormat = 0;
    const formatInterval = setInterval(() => {
        if (currentFormat >= formatScore) {
            clearInterval(formatInterval);
            formatBar.style.width = `${formatScore}%`;
        } else {
            currentFormat++;
            formatValue.textContent = currentFormat;
        }
    }, 20);
}

function populateData() {
    // Recommended Roles
    const rolesList = document.getElementById('roles-list');
    const roles = [
        { title: "Senior AI Engineer", match: "98%" },
        { title: "Machine Learning Scientist", match: "92%" },
        { title: "Data Engineer", match: "88%" }
    ];

    rolesList.innerHTML = roles.map(role => `
        <div class="role-item">
            <span class="role-title">${role.title}</span>
            <span class="role-match">${role.match}</span>
        </div>
    `).join('');

    // Feedback
    const feedbackList = document.getElementById('feedback-list');
    const feedback = [
        { text: "Formatting: Margins are slightly too narrow for some ATS parsers.", type: "alert" },
        { text: "Grammar: Passive voice used frequently in 'Experience' section.", type: "alert" },
        { text: "Keywords: Strong match for 'Python' and 'TensorFlow'.", type: "success" }
    ];

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
