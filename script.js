// ===== State Management =====
let resumeData = null;
let analysisResults = null;

// ===== DOM Elements =====
const uploadArea = document.getElementById('upload-area');
const resumeUpload = document.getElementById('resume-upload');
const uploadSection = document.getElementById('upload-section');
const resultsSection = document.getElementById('results-section');
const loadingOverlay = document.getElementById('loading-overlay');
const analyzeJobsBtn = document.getElementById('analyze-jobs-btn');
const jobDescriptions = document.getElementById('job-descriptions');
const jobMatchesContainer = document.getElementById('job-matches-container');

// ===== Event Listeners =====
uploadArea.addEventListener('click', () => resumeUpload.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
resumeUpload.addEventListener('change', handleFileSelect);
analyzeJobsBtn.addEventListener('click', analyzeJobMatches);

// ===== File Upload Handlers =====
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--color-primary)';
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--color-border)';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

async function handleFile(file) {
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or DOC file');
        return;
    }

    // Show loading
    showLoading();

    // Simulate file reading and analysis
    setTimeout(() => {
        analyzeResume(file);
    }, 2000);
}

// ===== Resume Analysis =====
async function analyzeResume(file) {
    // Simulate AI analysis with realistic data
    const analysis = {
        overallScore: Math.floor(Math.random() * 20) + 75, // 75-95
        scores: {
            ats: Math.floor(Math.random() * 15) + 80,
            grammar: Math.floor(Math.random() * 20) + 75,
            formatting: Math.floor(Math.random() * 15) + 82,
            structure: Math.floor(Math.random() * 18) + 78
        },
        grammarIssues: [
            {
                type: 'error',
                text: 'Inconsistent verb tense in work experience section',
                suggestion: 'Use past tense for previous roles (e.g., "Managed" instead of "Manage")'
            },
            {
                type: 'warning',
                text: 'Passive voice detected in achievement statements',
                suggestion: 'Use active voice to demonstrate impact (e.g., "Led team of 5" instead of "Team of 5 was led")'
            },
            {
                type: 'error',
                text: 'Missing period at end of bullet point',
                suggestion: 'Ensure consistent punctuation throughout resume'
            },
            {
                type: 'info',
                text: 'Consider using stronger action verbs',
                suggestion: 'Replace "Helped" with "Facilitated" or "Enabled"'
            }
        ],
        formattingIssues: [
            {
                type: 'warning',
                text: 'Inconsistent spacing between sections',
                suggestion: 'Maintain uniform spacing (recommend 12pt) between all major sections'
            },
            {
                type: 'error',
                text: 'Multiple font sizes detected',
                suggestion: 'Use maximum 2-3 font sizes: headers (14-16pt), subheaders (12pt), body (10-11pt)'
            },
            {
                type: 'info',
                text: 'Margins could be optimized',
                suggestion: 'Use 0.5-1 inch margins for better space utilization'
            }
        ],
        structureIssues: [
            {
                type: 'warning',
                text: 'Skills section placed after work experience',
                suggestion: 'Move skills section near the top for better ATS scanning'
            },
            {
                type: 'error',
                text: 'Missing quantifiable achievements',
                suggestion: 'Add metrics and numbers to demonstrate impact (e.g., "Increased sales by 25%")'
            },
            {
                type: 'info',
                text: 'Education section could be more concise',
                suggestion: 'For experienced professionals, move education below experience'
            },
            {
                type: 'warning',
                text: 'No summary or objective statement',
                suggestion: 'Add a brief professional summary highlighting key qualifications'
            }
        ],
        recommendedRoles: [
            {
                title: 'Senior Software Engineer',
                match: 92,
                description: 'Your technical skills and project experience align perfectly with senior engineering roles'
            },
            {
                title: 'Full Stack Developer',
                match: 88,
                description: 'Strong match based on your frontend and backend technology expertise'
            },
            {
                title: 'Technical Lead',
                match: 85,
                description: 'Your leadership experience and technical depth make you suitable for lead positions'
            },
            {
                title: 'Solutions Architect',
                match: 80,
                description: 'System design experience and architectural knowledge are relevant'
            },
            {
                title: 'DevOps Engineer',
                match: 75,
                description: 'CI/CD and cloud infrastructure skills match this role'
            }
        ]
    };

    analysisResults = analysis;
    displayResults(analysis);
    hideLoading();
}

// ===== Display Results =====
function displayResults(analysis) {
    // Hide upload, show results
    uploadSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    // Animate overall score
    animateScore(analysis.overallScore);

    // Animate individual scores
    animateScoreBar('ats', analysis.scores.ats);
    animateScoreBar('grammar', analysis.scores.grammar);
    animateScoreBar('format', analysis.scores.formatting);
    animateScoreBar('structure', analysis.scores.structure);

    // Display issues
    displayIssues('grammar', analysis.grammarIssues);
    displayIssues('format', analysis.formattingIssues);
    displayIssues('structure', analysis.structureIssues);

    // Display recommended roles
    displayRecommendedRoles(analysis.recommendedRoles);
}

function animateScore(score) {
    const scoreValue = document.getElementById('score-value');
    const scoreProgress = document.getElementById('score-progress');
    const circumference = 2 * Math.PI * 70; // radius = 70

    // Add gradient definition
    if (!document.querySelector('#score-gradient')) {
        const svg = document.querySelector('.score-ring');
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'score-gradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#6366f1');

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#8b5cf6');

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);
    }

    // Animate number
    let current = 0;
    const increment = score / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= score) {
            current = score;
            clearInterval(timer);
        }
        scoreValue.textContent = Math.floor(current);
    }, 20);

    // Animate ring
    const offset = circumference - (score / 100) * circumference;
    setTimeout(() => {
        scoreProgress.style.strokeDashoffset = offset;
    }, 100);
}

function animateScoreBar(type, score) {
    const ring = document.getElementById(`${type}-ring`);
    const number = document.getElementById(`${type}-number`);
    const circumference = 2 * Math.PI * 50; // radius = 50

    // Animate ring
    const offset = circumference - (score / 100) * circumference;
    setTimeout(() => {
        ring.style.strokeDashoffset = offset;
    }, 200);

    // Animate number
    let current = 0;
    const increment = score / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= score) {
            current = score;
            clearInterval(timer);
        }
        const valueSpan = number.querySelector('.score-number-value');
        if (valueSpan) {
            valueSpan.textContent = Math.floor(current);
        }
    }, 20);
}

function displayIssues(type, issues) {
    const container = document.getElementById(`${type}-issues`);
    const count = document.getElementById(`${type}-count`);

    count.textContent = issues.length;
    container.innerHTML = '';

    issues.forEach((issue, index) => {
        const issueEl = document.createElement('div');
        issueEl.className = `issue-item ${issue.type}`;
        issueEl.style.animationDelay = `${index * 0.1}s`;
        issueEl.innerHTML = `
            <div class="issue-text">${issue.text}</div>
            <div class="issue-suggestion">💡 ${issue.suggestion}</div>
        `;
        container.appendChild(issueEl);
    });
}

function displayRecommendedRoles(roles) {
    const container = document.getElementById('roles-grid');
    container.innerHTML = '';

    roles.forEach((role, index) => {
        const roleEl = document.createElement('div');
        roleEl.className = 'role-card';
        roleEl.style.animationDelay = `${index * 0.1}s`;
        roleEl.innerHTML = `
            <span class="role-match">${role.match}% Match</span>
            <h4 class="role-title">${role.title}</h4>
            <p class="role-description">${role.description}</p>
        `;
        container.appendChild(roleEl);
    });
}

// ===== Job Matching =====
function analyzeJobMatches() {
    const jobText = jobDescriptions.value.trim();

    if (!jobText) {
        alert('Please enter job descriptions to analyze');
        return;
    }

    if (!analysisResults) {
        alert('Please upload and analyze a resume first');
        return;
    }

    showLoading();

    // Simulate AI job matching
    setTimeout(() => {
        const jobs = parseJobDescriptions(jobText);
        const matches = matchJobsToResume(jobs);
        displayJobMatches(matches);
        hideLoading();
    }, 1500);
}

function parseJobDescriptions(text) {
    // Simple parsing - split by double newlines or look for common patterns
    const jobSections = text.split(/\n\s*\n/).filter(section => section.trim().length > 50);

    return jobSections.map((section, index) => {
        const lines = section.split('\n').filter(line => line.trim());
        const title = lines[0] || `Job Position ${index + 1}`;
        const description = lines.slice(1).join(' ');

        return {
            title: title.substring(0, 100),
            description: description.substring(0, 500),
            fullText: section
        };
    });
}

function matchJobsToResume(jobs) {
    // Simulate AI matching with realistic scores and reasons
    const keywords = ['software', 'engineer', 'developer', 'full stack', 'react', 'node', 'python', 'java', 'cloud', 'aws', 'leadership', 'team', 'agile'];

    return jobs.map(job => {
        const jobLower = job.fullText.toLowerCase();

        // Calculate match score based on keyword presence
        let matchScore = 60 + Math.floor(Math.random() * 35); // Base 60-95
        const matchedKeywords = keywords.filter(kw => jobLower.includes(kw));

        // Generate match reasons
        const reasons = [];
        if (matchedKeywords.length > 5) {
            reasons.push('Strong technical skills alignment');
        }
        if (jobLower.includes('senior') || jobLower.includes('lead')) {
            reasons.push('Experience level matches');
        }
        if (jobLower.includes('remote') || jobLower.includes('hybrid')) {
            reasons.push('Work arrangement preference');
        }
        if (matchedKeywords.some(kw => ['react', 'node', 'python'].includes(kw))) {
            reasons.push('Key technology match');
        }
        if (jobLower.includes('team') || jobLower.includes('collaboration')) {
            reasons.push('Collaborative skills valued');
        }

        // Ensure at least 2 reasons
        if (reasons.length < 2) {
            reasons.push('Industry experience relevant');
            reasons.push('Educational background fits');
        }

        return {
            ...job,
            matchScore,
            reasons: reasons.slice(0, 4)
        };
    }).sort((a, b) => b.matchScore - a.matchScore); // Sort by match score
}

function displayJobMatches(matches) {
    const container = document.getElementById('job-matches-grid');
    jobMatchesContainer.classList.remove('hidden');
    container.innerHTML = '';

    if (matches.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-secondary);">No jobs found. Please enter job descriptions in the format shown in the placeholder.</p>';
        return;
    }

    matches.forEach((match, index) => {
        const matchEl = document.createElement('div');
        matchEl.className = 'job-match-card';
        matchEl.style.animationDelay = `${index * 0.1}s`;

        const reasonsHTML = match.reasons.map(reason =>
            `<span class="match-reason">${reason}</span>`
        ).join('');

        matchEl.innerHTML = `
            <div class="job-match-header">
                <div>
                    <h4 class="job-match-title">${match.title}</h4>
                </div>
                <div class="job-match-score">${match.matchScore}%</div>
            </div>
            <p class="job-match-details">${match.description.substring(0, 200)}${match.description.length > 200 ? '...' : ''}</p>
            <div class="job-match-reasons">
                ${reasonsHTML}
            </div>
        `;

        container.appendChild(matchEl);
    });

    // Scroll to results
    jobMatchesContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ===== Loading Overlay =====
function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('AI Resume Analyzer initialized');

    // Add some entrance animations
    const uploadContainer = document.querySelector('.upload-container');
    if (uploadContainer) {
        uploadContainer.style.animation = 'fadeInUp 0.8s ease-out';
    }
});
