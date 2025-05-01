const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');

console.log('Initializing document controller...');

// Initialize Gemini AI
let genAI;
try {
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is not set in environment variables');
        throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini AI initialized successfully');
} catch (initError) {
    console.error('Error initializing Gemini AI:', initError);
    throw initError;
}

// Upload document
exports.uploadDocument = async (req, res) => {
    console.log('uploadDocument called');
    try {
        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({ message: 'No file uploaded' });
        }
        console.log('File received:', req.file);
        const { originalname, filename, path, size } = req.file;
        const document = new Document({
            originalName: originalname,
            filename,
            path,
            size
        });
        console.log('Saving document to database');
        await document.save();
        console.log('Document saved successfully');
        res.status(201).json(document);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Generate summary
exports.generateSummary = async (req, res) => {
    console.log('generateSummary called with id:', req.params.id);
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            console.log('Document not found');
            return res.status(404).json({ message: 'Document not found' });
        }
        console.log('Document found:', document.originalName);
        console.log('Document path:', document.path);

        // Check if file exists
        if (!fs.existsSync(document.path)) {
            console.log('File not found at path:', document.path);
            return res.status(404).json({ message: 'PDF file not found' });
        }

        console.log('Reading PDF file');
        let dataBuffer;
        try {
            dataBuffer = fs.readFileSync(document.path);
            console.log('PDF file read successfully, size:', dataBuffer.length);
        } catch (readError) {
            console.error('Error reading PDF file:', readError);
            return res.status(500).json({ 
                message: 'Error reading PDF file',
                error: readError.message,
                stack: readError.stack
            });
        }

        console.log('Parsing PDF content');
        let data;
        try {
            data = await pdf(dataBuffer);
            console.log('PDF parsed successfully');
        } catch (parseError) {
            console.error('Error parsing PDF:', parseError);
            return res.status(500).json({ 
                message: 'Error parsing PDF',
                error: parseError.message,
                stack: parseError.stack
            });
        }

        const text = data.text;
        console.log('PDF text extracted, length:', text.length);

        if (!text || text.trim() === '') {
            console.log('No text extracted from PDF');
            return res.status(400).json({ message: 'Could not extract text from PDF' });
        }

        console.log('Using Gemini AI to generate summary');
        try {
            console.log('Initializing Gemini model');
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-pro",
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            });
            console.log('Gemini model initialized');
            
            // Enhanced prompt for better summary
            const prompt = `Please provide a concise and informative summary of the following text. 
            Focus on the main points and key concepts:
            
            ${text}`;
            
            console.log('Sending prompt to Gemini AI');
            console.log('Prompt length:', prompt.length);
            console.log('First 100 chars of prompt:', prompt.substring(0, 100));
            
            const result = await model.generateContent(prompt);
            console.log('Received response from Gemini AI');
            
            const response = await result.response;
            console.log('Processed Gemini AI response');
            
            const summary = response.text();
            console.log('Summary generated successfully');
            console.log('Summary length:', summary.length);
            console.log('First 100 chars of summary:', summary.substring(0, 100));

            console.log('Saving summary to document');
            document.summary = summary;
            await document.save();
            console.log('Summary saved successfully');

            res.json({ summary });
        } catch (aiError) {
            console.error('Error with Gemini AI:', {
                message: aiError.message,
                stack: aiError.stack,
                code: aiError.code,
                details: aiError.details,
                response: aiError.response,
                status: aiError.status
            });
            
            if (aiError.message.includes('API key')) {
                return res.status(500).json({ 
                    message: 'Invalid or missing Gemini API key',
                    error: aiError.message,
                    stack: aiError.stack
                });
            }
            return res.status(500).json({ 
                message: 'Error generating summary with AI',
                error: aiError.message,
                stack: aiError.stack,
                details: aiError.details,
                status: aiError.status
            });
        }
    } catch (error) {
        console.error('Error in generateSummary:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ 
            message: 'Failed to generate summary',
            error: error.message,
            stack: error.stack
        });
    }
};

// Generate quiz
exports.generateQuiz = async (req, res) => {
    console.log('generateQuiz called with id:', req.params.id);
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            console.log('Document not found');
            return res.status(404).json({ message: 'Document not found' });
        }
        console.log('Document found:', document.originalName);

        if (!document.summary || document.summary.trim() === '') {
            console.log('No summary found for document');
            return res.status(400).json({ 
                message: 'Please generate a summary first before generating a quiz',
                code: 'NO_SUMMARY'
            });
        }

        console.log('Using Gemini AI to generate quiz');
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        });
        
        // Enhanced prompt for comprehensive quiz generation
        const prompt = `Generate 10 multiple choice questions based on the following text. 
        For each question:
        1. Make it clear and concise
        2. Provide 4 options (A, B, C, D)
        3. Indicate the correct answer
        4. Ensure options are distinct and plausible
        5. Cover different aspects of the text (concepts, details, applications)
        6. Include both factual and conceptual questions
        
        Text to generate questions from:
        ${document.summary}`;
        
        console.log('Sending prompt to Gemini AI');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const quizText = response.text();
        console.log('Received quiz text from Gemini AI:', quizText);

        // Parse the quiz text and create quiz objects
        console.log('Parsing quiz text');
        const questions = quizText.split('\n\n').filter(q => q.trim() !== '').map(q => {
            const lines = q.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 6) {
                console.log('Invalid question format:', q);
                return null;
            }
            const question = lines[0].replace(/^\d+\.\s*/, '');
            const options = lines.slice(1, 5).map(opt => opt.replace(/^[A-D]\.\s*/, ''));
            const correctAnswer = lines[5]?.replace(/^Answer:\s*/, '') || '';
            return { question, options, correctAnswer };
        }).filter(q => q !== null);

        if (questions.length === 0) {
            console.log('No valid questions generated');
            return res.status(500).json({ message: 'Failed to generate valid quiz questions' });
        }

        console.log('Saving quiz to document');
        document.quiz = questions;
        await document.save();
        console.log('Quiz saved successfully');

        res.json({ quiz: questions });
    } catch (error) {
        console.error('Error in generateQuiz:', error);
        res.status(500).json({ 
            message: 'Failed to generate quiz',
            error: error.message 
        });
    }
};

// Save quiz score
exports.saveQuizScore = async (req, res) => {
    try {
        const { documentId, score } = req.body;
        const userId = req.user.userId;

        // Find user and update scores
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if score already exists for this document
        const existingScoreIndex = user.scores.findIndex(s => s.documentId.toString() === documentId);
        
        if (existingScoreIndex >= 0) {
            // Update existing score if new score is higher
            if (score > user.scores[existingScoreIndex].score) {
                user.scores[existingScoreIndex].score = score;
                user.scores[existingScoreIndex].date = new Date();
            }
        } else {
            // Add new score
            user.scores.push({
                documentId,
                score,
                date: new Date()
            });
        }

        await user.save();

        res.json({
            message: 'Score saved successfully',
            score
        });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ 
            message: 'Failed to save score',
            error: error.message 
        });
    }
};

// Get all documents
exports.getDocuments = async (req, res) => {
    console.log('getDocuments called');
    try {
        console.log('Fetching all documents from database');
        const documents = await Document.find().sort({ uploadDate: -1 });
        console.log(`Found ${documents.length} documents`);
        res.json(documents);
    } catch (error) {
        console.error('Error in getDocuments:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ 
            message: 'Failed to fetch documents',
            error: error.message,
            stack: error.stack
        });
    }
};

// Get single document
exports.getDocument = async (req, res) => {
    console.log('getDocument called with id:', req.params.id);
    try {
        console.log('Fetching document from database');
        const document = await Document.findById(req.params.id);
        if (!document) {
            console.log('Document not found');
            return res.status(404).json({ message: 'Document not found' });
        }
        console.log('Document found:', document.originalName);
        res.json(document);
    } catch (error) {
        console.error('Error in getDocument:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ 
            message: 'Failed to fetch document',
            error: error.message,
            stack: error.stack
        });
    }
}; 