# Chat with Your Docs

A privacy-focused document chat application that lets you interact with your documents through AI, all running in your browser with no server dependencies.

![Chat with Your Docs](https://github.com/retr0senss/chatdocs/assets/screenshot.png)

## Features

- **Complete Privacy**: All processing happens in your browser - your documents are never uploaded to any server
- **Offline Capability**: Uses WebLLM for local AI processing without internet connection
- **Multi-Document Support**: Upload, manage, and switch between multiple documents
- **Advanced Document Analysis**:
  - Automatic document summarization
  - Key topic extraction
  - In-document search functionality
- **Multiple Input Methods**:
  - File upload (PDF, TXT, MD)
  - Web page content import via URL
- **Flexible AI Options**:
  - Local processing with Llama 3 8B (WebLLM)
  - Cloud processing with OpenAI API (optional)
- **Responsive Design**: Clean, modern UI that works on various screen sizes

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: Tailwind CSS, shadcn/ui
- **AI Integration**:
  - Web-LLM for browser-based inference
  - OpenAI API for cloud-based processing
- **Document Processing**:
  - PDF.js for PDF parsing
  - Marked for Markdown parsing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/retr0senss/chatdocs.git
   cd chatdocs
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run start
# or
yarn build
yarn start
```

## Usage Guide

### Uploading Documents

1. Navigate to the "Upload" tab
2. Choose to either upload a file (PDF, TXT, MD) or import from a URL
3. For file upload: Drag and drop your file or click to browse
4. For URL import: Enter the web page URL to extract its content

### Chatting with Documents

1. After document processing is complete, the "Chat" tab will be activated
2. Type your questions about the document in the input box at the bottom
3. The AI will respond with information based on the document content
4. Switch between documents using the "Documents" tab if you have multiple files

### Document Analysis

1. Click on the "Analysis" tab to access advanced document insights
2. Use the "Summary" tab to get an AI-generated overview of the document
3. Explore "Topics" to see key concepts in the document
4. Use "Search" to find specific information within the document

### Settings

1. Click the settings icon in the top right
2. Choose your preferred AI provider:
   - Local (WebLLM) for privacy and offline use
   - OpenAI API for potentially better results (requires API key)
3. Adjust temperature settings to control AI creativity
4. Clear cache if needed to free up browser storage

## Project Structure

```
chatdocs/
├── src/
│   ├── app/ - Next.js app router pages
│   │   ├── components/ - Reusable UI components
│   │   │   ├── chat/ - Chat interface components
│   │   │   ├── document/ - Document handling components
│   │   │   ├── settings/ - Settings components
│   │   │   └── ui/ - Base UI components
│   │   ├── contexts/ - React context providers
│   │   ├── lib/ - Utility functions and services
│   │   │   ├── document-processing/ - Document parsing and storage
│   │   │   └── llm/ - AI model integration
│   │   └── tests/ - Test files
│   ├── public/ - Static assets
│   └── README.md - Project documentation
```

## Privacy

This application is designed with privacy as a primary concern:

- When using WebLLM (local processing), all document processing and AI inference happens entirely in your browser
- No document data is sent to external servers
- If you choose to use the OpenAI API, document chunks will be sent to OpenAI's servers as needed
- API keys are stored only in your browser's local storage

## Future Development

Future checkpoints and planned features include:

- Support for more document formats (DOCX, PPTX, EPUB)
- Table and image extraction from documents
- Improved document organization with folders and tags
- Collaborative features for document sharing
- Voice input/output for accessibility

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Web-LLM](https://github.com/mlc-ai/web-llm) - For browser-based inference
- [shadcn/ui](https://ui.shadcn.com/) - For the UI component system
- [PDF.js](https://mozilla.github.io/pdf.js/) - For PDF parsing
