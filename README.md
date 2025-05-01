# DocuScan - AI-Powered Document Summarizer and Quiz Generator

DocuScan is a web application that uses AI to analyze PDF documents, generate concise summaries, and create quiz questions based on the content. It's built with React, Node.js, and MongoDB, and leverages the Google Gemini API for AI capabilities.

## Features

- PDF document upload and storage
- AI-powered document summarization
- Automatic quiz generation based on document content
- Modern and responsive user interface
- Document management and history

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google Gemini API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd docscan
```

2. Set up the backend:
```bash
cd docscan-backend
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/docscan
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Set up the frontend:
```bash
cd ../docscan-frontend
npm install
```

## Running the Application

1. Start MongoDB:
```bash
mongod
```

2. Start the backend server:
```bash
cd docscan-backend
npm start
```

3. Start the frontend development server:
```bash
cd docscan-frontend
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Upload a PDF document using the file upload interface
2. View your uploaded documents in the Documents page
3. Click on a document to view its details
4. Generate a summary of the document
5. Generate quiz questions based on the document content

## Technologies Used

- Frontend:
  - React
  - Material-UI
  - Axios
  - React Router

- Backend:
  - Node.js
  - Express
  - MongoDB
  - Multer (for file uploads)
  - PDF-parse
  - Google Gemini API

## License

This project is licensed under the MIT License - see the LICENSE file for details. 