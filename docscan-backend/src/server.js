require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const documentRoutes = require('./routes/documentRoutes');
const authRoutes = require('./routes/authRoutes');

// Check required environment variables
const requiredEnvVars = ['MONGODB_URI', 'GEMINI_API_KEY', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

const app = express();

// Health check route for Render
app.get('/', (req, res) => {
    res.send('✅ DocScan backend is running!');
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Routes
console.log('Setting up routes...');
app.use('/api/documents', documentRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Available routes:');
    console.log('  POST /api/auth/signup');
    console.log('  POST /api/auth/login');
    console.log('  GET /api/auth/profile');
    console.log('  POST /api/documents/upload');
    console.log('  GET /api/documents');
    console.log('  GET /api/documents/:id');
    console.log('  POST /api/documents/:id/summary');
    console.log('  POST /api/documents/:id/quiz');
    console.log('  POST /api/documents/save-score');
});
