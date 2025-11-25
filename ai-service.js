// AI Service for Resume Analysis using Google Gemini API

class AIService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    // Extract text from PDF using PDF.js (loaded from CDN)
    async extractTextFromPDF(file) {
        try {
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
        } catch (error) {
            console.error('Error extracting PDF text:', error);
            throw new Error('Failed to extract text from PDF');
        }
    }

    // Extract text from DOCX (simple approach)
    async extractTextFromDOCX(file) {
        // For DOCX, we'll use a simple text extraction
        // In production, you'd want to use a library like mammoth.js
        return await file.text();
    }

    // Extract text from file based on type
    async extractText(file) {
        if (file.type === 'application/pdf') {
            return await this.extractTextFromPDF(file);
        } else if (file.type.includes('word') || file.type.includes('document')) {
            return await this.extractTextFromDOCX(file);
        } else {
            return await file.text();
        }
    }

    // Call Gemini API
    async callGemini(prompt) {
        try {
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }

    // Analyze resume using AI
    async analyzeResume(resumeText) {
        const prompt = `You are an expert resume analyzer and career counselor. Analyze the following resume and provide a detailed assessment in JSON format.

Resume Text:
${resumeText}

Provide your analysis in the following JSON structure (respond ONLY with valid JSON, no markdown):
{
    "overallScore": <number between 70-100>,
    "scores": {
        "ats": <number between 70-100>,
        "grammar": <number between 70-100>,
        "formatting": <number between 70-100>,
        "structure": <number between 70-100>
    },
    "grammarIssues": [
        {
            "type": "error|warning|info",
            "text": "Description of the issue",
            "suggestion": "How to fix it"
        }
    ],
    "formattingIssues": [
        {
            "type": "error|warning|info",
            "text": "Description of the issue",
            "suggestion": "How to fix it"
        }
    ],
    "structureIssues": [
        {
            "type": "error|warning|info",
            "text": "Description of the issue",
            "suggestion": "How to fix it"
        }
    ],
    "recommendedRoles": [
        {
            "title": "Job title",
            "match": <number between 70-100>,
            "description": "Why this role matches"
        }
    ]
}

Focus on:
- Grammar and spelling errors
- ATS (Applicant Tracking System) compatibility
- Formatting consistency
- Structure and organization
- Action verbs and quantifiable achievements
- Recommended job roles based on skills and experience`;

        try {
            const response = await this.callGemini(prompt);

            // Extract JSON from response (remove markdown code blocks if present)
            let jsonText = response.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/g, '');
            }

            const analysis = JSON.parse(jsonText);
            return analysis;
        } catch (error) {
            console.error('Error analyzing resume:', error);
            throw new Error('Failed to analyze resume. Please check your API key and try again.');
        }
    }

    // Match jobs to resume
    async matchJobsToResume(resumeText, jobDescriptions) {
        const prompt = `You are an expert career counselor. Match the following resume with the provided job descriptions and rank them by compatibility.

Resume:
${resumeText}

Job Descriptions:
${jobDescriptions.map((job, i) => `\n--- Job ${i + 1}: ${job.title} ---\n${job.description}`).join('\n')}

Provide your analysis in JSON format (respond ONLY with valid JSON, no markdown):
{
    "matches": [
        {
            "jobIndex": <index of job starting from 0>,
            "matchScore": <number between 60-100>,
            "reasons": ["reason 1", "reason 2", "reason 3", "reason 4"]
        }
    ]
}

Rank jobs by match score (highest first). Consider:
- Skills alignment
- Experience level
- Technical requirements
- Soft skills
- Career progression`;

        try {
            const response = await this.callGemini(prompt);

            // Extract JSON from response
            let jsonText = response.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/g, '');
            }

            const result = JSON.parse(jsonText);

            // Merge with original job data
            return result.matches.map(match => ({
                ...jobDescriptions[match.jobIndex],
                matchScore: match.matchScore,
                reasons: match.reasons
            }));
        } catch (error) {
            console.error('Error matching jobs:', error);
            throw new Error('Failed to match jobs. Please try again.');
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIService;
}
