import React, { useState, useCallback } from 'react';

// --- Constants and Utility Functions ---

// The model to use for the analysis (supports text and vision)
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';

// API Key is required by the environment but is kept empty here
const apiKey = "";
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

// JSON schema for structured output from the AI
const responseSchema = {
    type: "OBJECT",
    properties: {
        "atsScore": { "type": "INTEGER", "description": "Score out of 100 for ATS compatibility based on keywords and standard sections." },
        "grammarScore": { "type": "INTEGER", "description": "Score out of 100 for grammar, spelling, and punctuation accuracy." },
        "structureScore": { "type": "INTEGER", "description": "Score out of 100 for logical flow, use of bullet points, and section organization." },
        "formattingScore": { "type": "INTEGER", "description": "Score out of 100 for visual appeal, consistency of fonts/spacing, and readability." },
        "summary": { "type": "STRING", "description": "A concise, single-paragraph overall summary of the resume's strengths and weaknesses." },
        "feedback": {
            "type": "ARRAY",
            "description": "Detailed bullet points for specific improvement areas (e.g., action verbs, missing data, keyword optimization).",
            "items": { "type": "STRING" }
        }
    },
    required: ["atsScore", "grammarScore", "structureScore", "formattingScore", "summary", "feedback"]
};

// --- Component: Score Bar ---
const ScoreBar = ({ label, score }) => {
    const colorClass = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="mb-4">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm font-semibold" style={{ color: colorClass.replace('bg-', 'text-') }}>
                    {score}/100
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 shadow-inner">
                <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${score}%` }}
                ></div>
            </div>
        </div>
    );
};

// --- Main Application Component ---
const App = () => {
    const [resumeText, setResumeText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [fileMessage, setFileMessage] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [base64File, setBase64File] = useState(null); // Stores base64 data for multimodal analysis
    const [attempts, setAttempts] = useState(0);

    // System instruction for the AI model
    const systemPrompt = `You are a world-class professional resume and CV analysis expert. Your task is to analyze the provided resume text/document and generate a structured JSON output containing scores (0-100) and specific, actionable feedback based on standard professional criteria. Focus on the four main areas: ATS Compatibility (keyword density, standard headers), Grammar (typos, verb tense), Structure (logical flow, use of bullet points), and Formatting (consistency, spacing, readability).`;

    const analyzeResume = useCallback(async (retryCount = 0) => {
        const isTextAnalysis = resumeText.trim().length > 0;
        const isFileAnalysis = !!base64File;

        if (!isTextAnalysis && !isFileAnalysis) {
            setError('Please paste text or upload a file to start the analysis.');
            setResults(null);
            return;
        }
        
        // Use a minimum length only if analyzing pasted text
        if (isTextAnalysis && resumeText.trim().length < 50) {
             setError('Please paste or load a resume (minimum 50 characters) to start the analysis.');
             setResults(null);
             return;
        }


        setIsLoading(true);
        setError('');
        setResults(null);
        setAttempts(retryCount + 1);

        const userQuery = isFileAnalysis
            ? `Analyze the uploaded document (resume) visually and for content. Provide the scores and feedback according to the required JSON schema. ONLY output the JSON object.`
            : `Analyze the following resume text and provide the scores and feedback according to the required JSON schema. ONLY output the JSON object:\n\n---\n${resumeText.trim()}\n---`;

        let contents = [{ parts: [{ text: userQuery }] }];

        if (isFileAnalysis) {
            // Append inlineData part for multimodal analysis
            const filePart = {
                inlineData: {
                    mimeType: base64File.mimeType,
                    // Remove the "data:mime/type;base64," prefix from the string
                    data: base64File.data.split(',')[1] 
                }
            };
            contents[0].parts.push(filePart);
        }

        const payload = {
            contents: contents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 429 && retryCount < 3) {
                    const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
                    console.warn(`Rate limit hit. Retrying in ${Math.round(delay / 1000)}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    await analyzeResume(retryCount + 1); // Recursive retry
                    return;
                }
                throw new Error(`API error: ${response.statusText}`);
            }

            const result = await response.json();
            const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!jsonText) {
                throw new Error("AI response was empty or malformed.");
            }

            const parsedResults = JSON.parse(jsonText);
            setResults(parsedResults);

        } catch (err) {
            console.error("Analysis failed:", err);
            setError(`Analysis failed: ${err.message}. Please check your input and try again.`);
        } finally {
            setIsLoading(false);
        }
    }, [resumeText, base64File, systemPrompt]);

    const handleTextChange = (e) => {
        setResumeText(e.target.value);
        setBase64File(null); // If user types, we switch back to text analysis
        setUploadedFile(null);
        if (error) setError('');
        if (fileMessage) setFileMessage(''); 
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadedFile(file);
        setFileMessage('');
        setError('');
        setResults(null); 

        const mimeType = file.type;
        const isTextFile = mimeType === 'text/plain';
        // Support for PDF, PNG, and JPEG
        const isPdfOrImage = mimeType === 'application/pdf' || mimeType.startsWith('image/png') || mimeType.startsWith('image/jpeg');
        
        if (isTextFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setResumeText(event.target.result);
                setBase64File(null); // Clear file data
                setFileMessage(`Plain text file "${file.name}" loaded successfully into the text box.`);
            };
            reader.readAsText(file);
        } else if (isPdfOrImage) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // Store the base64 data for the multimodal call
                setBase64File({ data: event.target.result, mimeType: mimeType });
                setResumeText(''); // Clear text box, as we are using the file data
                setFileMessage(
                    <p className='text-blue-700'>
                        <span className="font-bold">File Ready: {file.name}.</span> The document image is prepared for AI visual and content analysis.
                    </p>
                );
            };
            reader.readAsDataURL(file);
        } else {
            setFileMessage('Unsupported file type. Please upload PDF, TXT, PNG, or JPEG file.');
            setResumeText('');
            setBase64File(null);
        }
        e.target.value = null;
    };

    const totalScore = results ? Math.round((results.atsScore + results.grammarScore + results.structureScore + results.formattingScore) / 4) : null;
    
    // Determine the action button state
    const isReadyForTextAnalysis = resumeText.trim().length >= 50;
    const isReadyForFileAnalysis = !!base64File;
    const isReadyForAnalysis = isReadyForTextAnalysis || isReadyForFileAnalysis;

    const buttonLabel = isReadyForFileAnalysis ? `Analyze Document (${uploadedFile?.name})` : 'Analyze Resume Text';


    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                        AI Resume Analyst (Multimodal)
                    </h1>
                    <p className="text-lg text-gray-600">
                        Upload a file (PDF, Image) or paste text for an instant, comprehensive score.
                    </p>
                </header>

                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-blue-100">
                    {/* Input Area */}
                    <h2 className="text-2xl font-semibold text-blue-800 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Upload Document
                    </h2>

                    {/* File Upload Component */}
                    <div className="mb-4">
                        <label className="flex-1 w-full sm:w-auto block">
                            <input
                                type="file"
                                accept=".pdf,.txt,.png,.jpeg,.jpg"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                                disabled={isLoading}
                            />
                            <div className="w-full text-center cursor-pointer p-4 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg text-blue-700 font-semibold hover:bg-blue-100 transition duration-150 shadow-sm">
                                {uploadedFile 
                                    ? `File Selected: ${uploadedFile.name}. Click to change.` 
                                    : 'Click to Upload PDF, TXT, PNG, or JPEG File'}
                            </div>
                        </label>
                        {fileMessage && (
                            <div className="mt-2 p-3 rounded-lg text-sm font-medium bg-blue-100 text-blue-700">
                                {fileMessage}
                            </div>
                        )}
                    </div>
                    {/* End File Upload Component */}
                    
                    <div className="text-center text-sm text-gray-500 mb-4">
                        — OR PASTE TEXT BELOW —
                    </div>

                    <textarea
                        className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-inner resize-y min-h-[200px] text-sm font-mono"
                        placeholder="Paste the plain text content of your resume here. Note: Pasting text clears the file upload."
                        value={resumeText}
                        onChange={handleTextChange}
                        disabled={isLoading}
                    />

                    {/* Action Button and Error */}
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={() => analyzeResume(0)}
                            disabled={isLoading || !isReadyForAnalysis}
                            className={`px-8 py-3 text-lg font-bold rounded-xl transition duration-300 transform ${
                                isLoading
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl active:scale-95'
                            } disabled:opacity-50`}
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing Resume ({attempts})
                                </div>
                            ) : (
                                buttonLabel
                            )}
                        </button>
                    </div>

                    {error && (
                        <p className="mt-4 text-center text-red-600 font-medium p-3 bg-red-50 border border-red-200 rounded-lg">
                            {error}
                        </p>
                    )}
                </div>

                {/* Results Area */}
                {results && (
                    <div className="mt-8 bg-white p-6 sm:p-8 rounded-xl shadow-2xl border-t-4 border-emerald-500">
                        <h2 className="text-3xl font-bold text-emerald-700 mb-6 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.27a11.95 11.95 0 011.802 4.197c-.206 1.348-.958 2.628-1.577 3.657-1.125 1.96-2.868 3.39-5.115 4.095m-4.636-6.14a5.004 5.004 0 00-2.454.493m-2.923 1.929a8.914 8.914 0 01-1.353.473m-.45 4.54a11.95 11.95 0 004.197 1.802" />
                            </svg>
                            Analysis Results
                        </h2>

                        {/* Overall Score Banner */}
                        <div className={`p-4 mb-6 rounded-lg shadow-md ${totalScore >= 80 ? 'bg-emerald-100 text-emerald-800' : totalScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'} border-l-4 border-current`}>
                            <p className="text-xl font-bold">Overall Score: {totalScore}%</p>
                            <p className="text-sm">Based on the average of all key metrics.</p>
                        </div>

                        {/* Scores Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
                            <ScoreBar label="ATS Compatibility Score" score={results.atsScore} />
                            <ScoreBar label="Grammar & Spelling Score" score={results.grammarScore} />
                            <ScoreBar label="Structure & Flow Score" score={results.structureScore} />
                            <ScoreBar label="Formatting & Consistency Score" score={results.formattingScore} />
                        </div>

                        {/* Summary and Feedback */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2 border-b pb-1">Summary</h3>
                                <p className="text-gray-700 leading-relaxed italic">
                                    "{results.summary}"
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-1">Actionable Feedback</h3>
                                <ul className="list-none space-y-3">
                                    {results.feedback.map((item, index) => (
                                        <li key={index} className="flex items-start text-gray-700">
                                            <span className="flex-shrink-0 mr-3 text-red-500 font-bold text-lg leading-none">
                                                &bull;
                                            </span>
                                            <span className="flex-1">
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
