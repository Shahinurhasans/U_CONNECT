import { useState } from 'react';
import { X, ArrowRight, BookOpen } from 'lucide-react';
import axios from 'axios';

const EnvLearningPathModal = ({ isOpen, onClose }) => {
  const [learningGoal, setLearningGoal] = useState('');
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    setLearningGoal(e.target.value);
  };

  const generateLearningPath = async () => {
    if (!learningGoal.trim()) return;
    
    setLoading(true);
    setSubmitted(true);
    
    try {
      // Make API call to backend which will use the OpenAI API key from .env
      // This is a more secure approach than exposing the API key in the frontend
      const response = await axios.post('/api/generate-learning-path', {
        topic: learningGoal
      });
      
      // Set the learning path from the response
      setLearningPath(response.data.learningPath);
      
      // Fallback to pre-defined responses if API call fails
    } catch (error) {
      console.error('Error generating learning path:', error);
      
      // Fallback to pre-defined responses
      let generatedPath;
      const goal = learningGoal.toLowerCase();
      
      if (goal.includes('python')) {
        generatedPath = `🧭 Python Learning Path

✅ Stage 1: Python Fundamentals (Beginner)
🎯 Goal: Master the basics of Python programming
📚 Learn:
- Python Syntax and Basic Concepts
- Variables and Data Types
- Control Flow (if statements, loops)
- Functions and Modules
- Basic Error Handling

🛠 Tools:
- Python 3.x
- VS Code or PyCharm (Community Edition)
- Command Line/Terminal

📈 Milestone:
Complete 3-5 small Python scripts (e.g., calculator, to-do list)

✅ Stage 2: Intermediate Python (Junior Developer)
🎯 Goal: Build more complex applications and understand core concepts
📚 Learn:
- Object-Oriented Programming
- File Handling and I/O
- Error Handling and Exceptions
- Modules and Packages
- Virtual Environments

🛠 Tools:
- Git & GitHub
- pip package manager
- Jupyter Notebooks

📈 Milestone:
Build a medium-sized project (e.g., web scraper, data analyzer)

✅ Stage 3: Advanced Python (Mid-level)
🎯 Goal: Develop professional-grade applications
📚 Learn:
- Advanced Data Structures
- Decorators and Generators
- Concurrency and Parallelism
- Testing and Debugging
- API Development

🛠 Tools:
- Flask or Django
- SQLAlchemy
- pytest
- Docker basics

📈 Milestone:
Create a full-featured application with database integration`;
      } else if (goal.includes('javascript') || goal.includes('js')) {
        generatedPath = `🧭 JavaScript Learning Path

✅ Stage 1: JavaScript Fundamentals (Beginner)
🎯 Goal: Master the basics of JavaScript programming
📚 Learn:
- JavaScript Syntax and Basic Concepts
- Variables, Data Types and Operators
- Control Flow (if statements, loops)
- Functions and Scope
- DOM Manipulation Basics

🛠 Tools:
- Modern web browser (Chrome/Firefox)
- VS Code with JavaScript extensions
- Browser Developer Tools

📈 Milestone:
Build 3-5 small interactive web components (e.g., form validator, calculator)

✅ Stage 2: Intermediate JavaScript (Junior Developer)
🎯 Goal: Create dynamic web applications and understand modern JS
📚 Learn:
- ES6+ Features (arrow functions, destructuring, etc.)
- Asynchronous JavaScript (Promises, async/await)
- Working with APIs and Fetch
- Error Handling
- Local Storage and Browser APIs

🛠 Tools:
- Git & GitHub
- npm package manager
- Webpack/Parcel (basic bundling)

📈 Milestone:
Build a medium-sized web application (e.g., weather app, task manager)

✅ Stage 3: Advanced JavaScript (Mid-level)
🎯 Goal: Develop professional-grade web applications
📚 Learn:
- Modern Frameworks (React, Vue, or Angular)
- State Management
- Performance Optimization
- Testing (Jest, Cypress)
- TypeScript Fundamentals

🛠 Tools:
- React/Vue/Angular
- Redux or Context API
- Testing libraries
- CI/CD basics

📈 Milestone:
Create a full-featured web application with multiple components`;
      } else if (goal.includes('data') || goal.includes('analyst')) {
        generatedPath = `🧭 Data Analyst Career Path

✅ Stage 1: Foundations (Beginner)
🎯 Goal: Learn the basics of data and analysis
📚 Learn:
- Spreadsheets: Excel or Google Sheets
- Statistics: Averages, distributions, standard deviation, hypothesis testing
- Basic SQL: SELECT, WHERE, GROUP BY, JOIN
- Data Visualization: Charts, graphs, pivot tables

🛠 Tools:
- Excel / Google Sheets
- SQL (SQLite, MySQL)
- Tableau Public / Power BI (basic)

📈 Milestone:
Complete a basic data analysis project (e.g., sales analysis in Excel)

✅ Stage 2: Core Data Analysis Skills (Junior)
🎯 Goal: Analyze real-world data sets and generate insights
📚 Learn:
- Intermediate SQL: Subqueries, CTEs, window functions
- Python for Data Analysis:
  - Libraries: pandas, numpy, matplotlib, seaborn
  - Data Cleaning & Transformation
  - Exploratory Data Analysis (EDA)

🛠 Tools:
- Jupyter Notebook
- SQL Workbench / pgAdmin
- Git & GitHub (for version control)

📈 Milestone:
Build a portfolio with 2–3 public projects (e.g., Kaggle datasets, COVID analysis)

✅ Stage 3: Advanced Analytics (Mid-level)
🎯 Goal: Deliver actionable business insights and automate analysis
📚 Learn:
- Advanced Statistical Analysis
- A/B Testing and Experimentation
- Dashboard Creation and Reporting
- Data Pipelines and Automation
- Business Intelligence concepts

🛠 Tools:
- Advanced SQL
- Python automation
- Tableau / Power BI (advanced)
- Airflow (basic)

📈 Milestone:
Create interactive dashboards and automated reports for business stakeholders`;
      } else {
        // Generic learning path for other topics
        generatedPath = `🧭 ${learningGoal} Learning Path

✅ Stage 1: Foundations (Beginner)
🎯 Goal: Master the fundamentals of ${learningGoal}
📚 Learn:
- Core concepts and terminology
- Basic principles and methodologies
- Fundamental techniques
- Industry standards and best practices

🛠 Tools:
- Entry-level software and platforms
- Beginner-friendly resources
- Online tutorials and documentation
- Practice exercises

📈 Milestone:
Complete a basic project demonstrating fundamental skills

✅ Stage 2: Intermediate Skills (Junior Level)
🎯 Goal: Apply knowledge to real-world scenarios
📚 Learn:
- Advanced concepts and techniques
- Problem-solving methodologies
- Workflow optimization
- Collaboration and teamwork

🛠 Tools:
- Professional software and platforms
- Version control systems
- Industry-standard tools
- Productivity enhancers

📈 Milestone:
Build a portfolio with 2-3 demonstrable projects

✅ Stage 3: Advanced Expertise (Mid-level)
🎯 Goal: Develop specialized knowledge and professional skills
📚 Learn:
- Specialized techniques and methodologies
- Performance optimization
- Advanced problem-solving
- Leadership and mentoring

🛠 Tools:
- Advanced professional tools
- Automation and integration
- Analytics and measurement
- Collaboration platforms

📈 Milestone:
Create a comprehensive project showcasing advanced skills`;
      }
      
      setLearningPath(generatedPath);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <BookOpen className="mr-2 text-blue-600" />
            Learning Path Generator
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!submitted ? (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">What do you want to learn?</h3>
              <p className="text-gray-600">Enter a topic or skill you'd like to learn (e.g., "Python", "Data Analysis", "Web Development")</p>
              
              <div>
                <input
                  type="text"
                  value={learningGoal}
                  onChange={handleInputChange}
                  placeholder="Enter what you want to learn..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && learningGoal.trim()) {
                      generateLearningPath();
                    }
                  }}
                />
              </div>
              
              <button
                onClick={generateLearningPath}
                disabled={!learningGoal.trim()}
                className={`w-full px-6 py-3 bg-blue-600 text-white rounded-md flex items-center justify-center ${
                  !learningGoal.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                } transition`}
              >
                Generate Learning Path
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-lg text-gray-700">Generating your personalized learning path...</p>
                </div>
              ) : learningPath ? (
                <div>
                  <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap font-mono text-sm">
                    {learningPath}
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setLearningPath(null);
                        setLearningGoal('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition"
                    >
                      Start Over
                    </button>
                    
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-red-600">
                  Something went wrong. Please try again.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnvLearningPathModal;
