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
    // Score Gauge (Doughnut)
    const scoreCtx = document.getElementById('scoreChart').getContext('2d');
    const score = Math.floor(Math.random() * (95 - 78) + 78); // Random score 78-95

    // Update Score Text
    const scoreValue = document.getElementById('score-value');
    const scoreMessage = document.getElementById('score-message');

    // Animate Score Number
    let currentScore = 0;
    const scoreInterval = setInterval(() => {
        if (currentScore >= score) {
            clearInterval(scoreInterval);
        } else {
            currentScore++;
            scoreValue.textContent = currentScore;
        }
    }, 15);

    // Set Message
    if (score > 90) scoreMessage.textContent = "Top 5% of candidates";
    else if (score > 80) scoreMessage.textContent = "Strong match for role";
    else scoreMessage.textContent = "Good foundation, needs polish";

    new Chart(scoreCtx, {
        type: 'doughnut',
        data: {
            labels: ['Score', 'Gap'],
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: ['#2563eb', '#e5e7eb'], // Blue & Light Grey
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

    // Skills Radar Chart
    const skillsCtx = document.getElementById('skillsChart').getContext('2d');
    new Chart(skillsCtx, {
        type: 'bar', // Changed to Bar for cleaner look in small space
        data: {
            labels: ['Python', 'ML Ops', 'Data Viz', 'Comm.', 'System Design'],
            datasets: [{
                label: 'Your Level',
                data: [90, 75, 85, 95, 70],
                backgroundColor: '#2563eb',
                borderRadius: 4,
            }, {
                label: 'Role Avg',
                data: [80, 85, 80, 85, 85],
                backgroundColor: '#e5e7eb',
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 100, grid: { display: false } },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } }
            }
        }
    });
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
        { text: "Quantify your achievements. Use numbers (e.g., 'Improved latency by 20%').", type: "alert" },
        { text: "Add 'PyTorch' and 'TensorFlow' to your skills section to pass ATS filters.", type: "alert" },
        { text: "Strong academic background detected. Highlight your thesis project.", type: "success" }
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
