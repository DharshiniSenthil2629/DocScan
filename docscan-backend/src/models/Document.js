const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    summary: {
        type: String,
        default: ''
    },
    quiz: [{
        question: String,
        options: [String],
        correctAnswer: String
    }]
});

module.exports = mongoose.model('Document', documentSchema); 