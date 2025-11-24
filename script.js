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

// GSAP Animations
gsap.from(".navbar", { y: -50, opacity: 0, duration: 1, ease: "power3.out" });
gsap.from(".hero-title .reveal-text", {
    y: 100,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    ease: "power3.out",
    delay: 0.5
});
gsap.from(".hero-subtitle", { y: 20, opacity: 0, duration: 1, delay: 1 });
gsap.from(".upload-container", { scale: 0.9, opacity: 0, duration: 1, delay: 1.2, ease: "elastic.out(1, 0.5)" });

// Event Listeners for File Upload
const selectBtn = document.querySelector('.upload-content .btn-primary');

selectBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent triggering dropZone click if nested (though it's not anymore, good practice)
    fileInput.click();
});

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
    // Simulate scanning effect on the drop zone
    dropZone.classList.add('scanning');

    // Transition to Analysis Section after a short delay
    setTimeout(() => {
        transitionToAnalysis();
    }, 1500);
}

function transitionToAnalysis() {
    gsap.to(heroSection, {
        opacity: 0,
        y: -50,
        duration: 0.5,
        onComplete: () => {
            heroSection.classList.add('hidden');
            analysisSection.classList.remove('hidden');

            gsap.fromTo(analysisSection,
                { opacity: 0, scale: 0.9 },
                { opacity: 1, scale: 1, duration: 0.5 }
            );

            // Simulate AI Analysis time
            setTimeout(() => {
                transitionToDashboard();
            }, 3000);
        }
    });
}

function transitionToDashboard() {
    gsap.to(analysisSection, {
        opacity: 0,
        scale: 1.1,
        duration: 0.5,
        onComplete: () => {
            analysisSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');

            gsap.fromTo(dashboardSection,
                { opacity: 0, y: 50 },
                { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
            );

            // Stagger animations for cards
            gsap.from(".card", {
                y: 30,
                opacity: 0,
                duration: 0.6,
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
        y: 50,
        duration: 0.5,
        onComplete: () => {
            dashboardSection.classList.add('hidden');
            heroSection.classList.remove('hidden');
            dropZone.classList.remove('scanning');
            fileInput.value = ''; // Clear input

            gsap.fromTo(heroSection,
                { opacity: 0, y: -50 },
                { opacity: 1, y: 0, duration: 0.5 }
            );
        }
    });
}

// Chart.js & Data Population
function renderCharts() {
    // Score Gauge (Doughnut)
    const scoreCtx = document.getElementById('scoreChart').getContext('2d');
    const score = Math.floor(Math.random() * (98 - 75) + 75); // Random score 75-98

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
    }, 20);

    // Set Message
    if (score > 90) scoreMessage.textContent = "Outstanding";
    else if (score > 80) scoreMessage.textContent = "Strong Candidate";
    else scoreMessage.textContent = "Good Potential";

    new Chart(scoreCtx, {
        type: 'doughnut',
        data: {
            labels: ['Score', 'Remaining'],
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: ['#00f2ff', 'rgba(255, 255, 255, 0.1)'],
                borderWidth: 0,
                cutout: '85%',
                circumference: 260,
                rotation: 230
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
        type: 'radar',
        data: {
            labels: ['Python', 'Machine Learning', 'Data Viz', 'Communication', 'Problem Solving', 'Cloud'],
            datasets: [{
                label: 'Your Profile',
                data: [90, 85, 70, 80, 95, 60],
                fill: true,
                backgroundColor: 'rgba(0, 242, 255, 0.2)',
                borderColor: '#00f2ff',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#00f2ff',
            }, {
                label: 'Role Requirement',
                data: [80, 90, 85, 75, 85, 80],
                fill: true,
                backgroundColor: 'rgba(112, 0, 255, 0.2)',
                borderColor: '#7000ff',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#7000ff',
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { color: '#a0a0b0', font: { size: 12 } },
                    ticks: { display: false, backdropColor: 'transparent' }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });
}

function populateData() {
    // Recommended Roles
    const rolesList = document.getElementById('roles-list');
    const roles = [
        { title: "Senior AI Engineer", match: "98%" },
        { title: "Machine Learning Researcher", match: "94%" },
        { title: "Data Scientist", match: "89%" }
    ];

    rolesList.innerHTML = roles.map(role => `
        <div class="role-item">
            <span>${role.title}</span>
            <span class="role-match">${role.match} Match</span>
        </div>
    `).join('');

    // Feedback
    const feedbackList = document.getElementById('feedback-list');
    const feedback = [
        "Strong proficiency in Python and ML libraries detected.",
        "Consider adding more specific metrics to your project descriptions (e.g., 'Improved accuracy by 15%').",
        "Cloud deployment skills (AWS/Azure) could be highlighted more prominently.",
        "Great academic background, but more industry-specific keywords could improve ATS scoring."
    ];

    feedbackList.innerHTML = feedback.map(item => `
        <li class="feedback-item">
            <i data-lucide="alert-circle" width="16"></i>
            <span>${item}</span>
        </li>
    `).join('');

    // Re-initialize icons for new content
    lucide.createIcons();
}
