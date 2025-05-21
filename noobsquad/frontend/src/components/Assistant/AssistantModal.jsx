import { useState } from 'react';
import { X, FileText, Youtube, BookOpen, Languages } from 'lucide-react';
import axios from 'axios';

const AssistantModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('pdf');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfQuestion, setPdfQuestion] = useState('');
  const [pdfAnswer, setPdfAnswer] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [youtubeSummary, setYoutubeSummary] = useState('');
  const [flashcardText, setFlashcardText] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [translateMode, setTranslateMode] = useState('Translate');
  const [loading, setLoading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handlePdfQuestionSubmit = async () => {
    if (!pdfFile || !pdfQuestion.trim()) return;

    setLoading(true);
    setPdfAnswer('');

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('question', pdfQuestion);

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/assistant/pdf-qa`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setPdfAnswer(response.data.answer);
    } catch (error) {
      console.error('Error getting PDF answer:', error);
      setPdfAnswer('Error: Failed to get an answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleYoutubeSummarize = async () => {
    if (!youtubeLink.trim()) return;

    setLoading(true);
    setYoutubeSummary('');
    setThumbnailUrl('');

    try {
      // Extract video ID
      let videoId = '';
      if (youtubeLink.includes('youtube.com/watch?v=')) {
        videoId = youtubeLink.split('v=')[1].split('&')[0];
      } else if (youtubeLink.includes('youtu.be/')) {
        videoId = youtubeLink.split('youtu.be/')[1].split('?')[0];
      }

      if (videoId) {
        setThumbnailUrl(`http://img.youtube.com/vi/${videoId}/0.jpg`);
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/assistant/youtube-summarize`, {
        youtubeLink
      });

      setYoutubeSummary(response.data.summary);
    } catch (error) {
      console.error('Error summarizing YouTube video:', error);
      setYoutubeSummary('Error: Failed to summarize the video. Please check the link and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!flashcardText.trim()) return;

    setLoading(true);
    setFlashcards([]);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/assistant/generate-flashcards`, {
        text: flashcardText,
        mode: translateMode
      });

      setFlashcards(response.data.flashcards);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setFlashcards([{ front: 'Error', back: 'Failed to generate flashcards. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            AI Assistant
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 ${activeTab === 'pdf' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('pdf')}
            >
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                PDF Q&A (Bangla & English)
              </div>
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'youtube' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('youtube')}
            >
              <div className="flex items-center">
                <Youtube className="w-5 h-5 mr-2" />
                YouTube Video Summarizer
              </div>
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'flashcard' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('flashcard')}
            >
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Flashcard Generator
              </div>
            </button>
          </div>

          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF Q&A (Bangla & English)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
              <div>
                <textarea
                  value={pdfQuestion}
                  onChange={(e) => setPdfQuestion(e.target.value)}
                  placeholder="Ask a question about the uploaded PDF..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                ></textarea>
              </div>
              <button
                onClick={handlePdfQuestionSubmit}
                disabled={!pdfFile || !pdfQuestion.trim() || loading}
                className={`px-4 py-2 rounded-md ${
                  !pdfFile || !pdfQuestion.trim() || loading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Getting Answer...' : 'Get Answer'}
              </button>
              {pdfAnswer && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-2">Answer:</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{pdfAnswer}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'youtube' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube Video Summarizer
                </label>
                <input
                  type="text"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="Paste YouTube link here"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleYoutubeSummarize}
                disabled={!youtubeLink.trim() || loading}
                className={`px-4 py-2 rounded-md ${
                  !youtubeLink.trim() || loading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Summarizing...' : 'Summarize Video'}
              </button>
              
              {thumbnailUrl && (
                <div className="mt-4">
                  <img 
                    src={thumbnailUrl} 
                    alt="Video thumbnail" 
                    className="max-w-full h-auto rounded-md"
                  />
                </div>
              )}
              
              {youtubeSummary && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-2">Summary:</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{youtubeSummary}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'flashcard' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flashcard Generator
                </label>
                <textarea
                  value={flashcardText}
                  onChange={(e) => setFlashcardText(e.target.value)}
                  placeholder="Paste notes or a topic to generate flashcards..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                ></textarea>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700 mr-2">
                    Mode:
                  </label>
                  <select
                    value={translateMode}
                    onChange={(e) => setTranslateMode(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Translate">Translate</option>
                    <option value="Summarize">Summarize</option>
                    <option value="Quiz">Quiz</option>
                  </select>
                </div>
                
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={!flashcardText.trim() || loading}
                  className={`px-4 py-2 rounded-md ${
                    !flashcardText.trim() || loading
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Generating...' : 'Generate Flashcards'}
                </button>
              </div>
              
              {flashcards.length > 0 && (
                <div className="mt-4 space-y-4">
                  <h3 className="font-medium text-gray-900">Generated Flashcards:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flashcards.map((card, index) => (
                      <div key={index} className="border rounded-md overflow-hidden">
                        <div className="bg-blue-50 p-3 border-b">
                          <h4 className="font-medium">{card.front}</h4>
                        </div>
                        <div className="p-3 bg-white">
                          <p>{card.back}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssistantModal;
