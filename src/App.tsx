import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// --- TYPE DEFINITIONS (JSDoc) ---

/**
 * @typedef {Object} Question
 * @property {'multiple-choice' | 'fill-in-the-blank' | 'true-false'} type
 * @property {string} question
 * @property {string[]} [options]
 * @property {string} correctAnswer
 * @property {string} [imageUrl]
 * @property {number} [points]
 * @property {number} [timeLimit]
 * @property {string} [originalCategory]
 */

/**
 * @typedef {Object} MapPosition
 * @property {string} top
 * @property {string} left
 */

/**
 * @typedef {Object} QuizCategory
 * @property {string} title
 * @property {string[]} prerequisites
 * @property {MapPosition} mapPosition
 * @property {Question[]} questions
 */

/**
 * @typedef {{ [key: string]: QuizCategory }} QuizCategories
 */

/**
 * @typedef {Object} SubjectProgress
 * @property {number} correct
 * @property {number} total
 */

/**
 * @typedef {Object} PlayerProgress
 * @property {number} score
 * @property {string[]} completedSubjects
 * @property {{ [key: string]: SubjectProgress }} subjectProgress
 * @property {string[]} badges
 * @property {{ [key: string]: Question[] }} weakQuestions
 * @property {number} [streak]
 * @property {string | null} [lastQuizDate]
 * @property {string} [avatar]
 */

/**
 * @typedef {{ [key: string]: PlayerProgress }} AllPlayersProgress
 */

/**
 * @typedef {Object} LastQuizResult
 * @property {number} score
 * @property {number} pointsGained
 * @property {string} quizType
 */

/**
 * @typedef {Question & { userAnswer: any; isCorrect: boolean }} QuizSessionResult
 */

/**
 * @typedef {Object} LeaderboardEntry
 * @property {string} name
 * @property {number} score
 * @property {string} avatar
 */

/**
 * @typedef {Object} StoryChoice
 * @property {string} text
 * @property {number} nextPartIndex
 * @property {string} [badgeAward]
 */

/**
 * @typedef {Object} StoryPart
 * @property {string} text
 * @property {StoryChoice[]} [choices]
 * @property {boolean} [isEnd]
 * @property {string} [badgeAward]
 */

/**
 * @typedef {Object} Story
 * @property {string} title
 * @property {StoryPart[]} parts
 */

// --- UI COMPONENTS ---

const GlobalStyles = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');body{font-family:'Inter',sans-serif;background-color:#f8fafc;background-image:radial-gradient(#e2e8f0 1px,transparent 1px);background-size:16px 16px;}@keyframes fade-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in{animation:fade-in .6s ease-out forwards}@keyframes slide-in-up{from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:translateY(0)}}.animate-slide-in-up{animation:slide-in-up .8s ease-out forwards}@keyframes fade-in-up-and-out{0%{opacity:0;transform:translateY(20px)}20%{opacity:1;transform:translateY(0)}80%{opacity:1;transform:translateY(-20px)}100%{opacity:0;transform:translateY(-40px)}}.animate-fade-in-up-and-out{animation:fade-in-up-and-out 1.5s ease-out forwards}@keyframes pop{0%{transform:scale(.8);opacity:0}50%{transform:scale(1.05);opacity:1}100%{transform:scale(1)}}.animate-pop{animation:pop .5s cubic-bezier(.68,-.55,.27,1.55) forwards}@keyframes bounce-slow{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}.animate-bounce-slow{animation:bounce-slow 2s infinite ease-in-out}@keyframes pulse-slow{0%,100%{opacity:1}50%{opacity:.8}}.animate-pulse-slow{animation:pulse-slow 2s infinite ease-in-out}@keyframes wiggle-on-hover{0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}.group:hover .animate-wiggle-on-hover{animation:wiggle-on-hover .3s ease-in-out}@keyframes pulse-fast{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}.animate-pulse-fast{animation:pulse-fast 1s infinite ease-in-out}@keyframes avatar-pop{0%{transform:scale(0)}80%{transform:scale(1.2)}100%{transform:scale(1)}}.animate-avatar-pop{animation:avatar-pop .3s ease-out forwards}@keyframes pop-in{0%{transform:scale(.5);opacity:0}100%{transform:scale(1);opacity:1}}.animate-pop-in{animation:pop-in .6s cubic-bezier(.175,.885,.32,1.275) forwards}@keyframes avatar-correct{0%,100%{transform:translateY(0) scale(1)}25%{transform:translateY(-10px) scale(1.1)}50%{transform:translateY(0) scale(1.2)}75%{transform:translateY(-5px) scale(1.1)}}.avatar-correct-animation{animation:avatar-correct .5s ease-in-out forwards}@keyframes avatar-incorrect{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}.avatar-incorrect-animation{animation:avatar-incorrect .4s ease-in-out forwards}.progress-bar{height:10px;background-color:#e0e0e0;border-radius:5px;overflow:hidden}.progress-fill{height:100%;background-color:#4caf50;border-radius:5px;transition:width .5s ease-in-out}.learning-map-container{position:relative;width:100%;padding-top:75%;background:linear-gradient(to bottom right,#e0f2fe,#bbdefb);border-radius:20px;overflow:hidden;box-shadow:inset 0 0 15px rgba(0,0,0,.1)}.map-node{position:absolute;width:120px;height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border-radius:50%;background-color:#fff;box-shadow:0 4px 10px rgba(0,0,0,.1);border:3px solid #60a5fa;transition:all .3s ease-in-out;cursor:pointer;z-index:10;font-size:.875rem;line-height:1.25rem}@media (max-width:639px){.map-node{width:90px;height:90px;font-size:.75rem}}.map-node.completed{background-color:#dcfce7;border-color:#22c55e;box-shadow:0 6px 15px rgba(34,197,94,.3);transform:scale(1.05)}.map-node.locked{background-color:#f3f4f6;border-color:#9ca3af;opacity:.6;cursor:not-allowed;filter:grayscale(80%)}.map-node-icon{font-size:2.5rem;margin-bottom:.25rem;color:#4f46e5}@media (max-width:639px){.map-node-icon{font-size:2rem}}.map-node.completed .map-node-icon{color:#16a34a}.map-node.locked .map-node-icon{color:#6b7280}.map-node-title{font-weight:600;color:#374151}.map-node.completed .map-node-title{color:#166534}.map-node.locked .map-node-title{color:#4b5563}.map-connection{position:absolute;background-color:#93c5fd;height:4px;z-index:5;transform-origin:0 50%;transition:background-color .5s ease}.map-connection.completed-path{background-color:#4ade80}@keyframes float-fade-out{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-50px)}}.toast-notification{position:fixed;bottom:20px;right:20px;padding:1rem 1.5rem;border-radius:.5rem;color:white;font-weight:600;box-shadow:0 4px 15px rgba(0,0,0,.2);z-index:100;animation:float-fade-out 3s forwards}`}</style>
);

/**
 * @param {{ className: string }} props
 */
const AppLogo = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#6366f1", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#8b5cf6", stopOpacity: 1 }} />
      </linearGradient>
      <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#fde047", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#fb923c", stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path
      d="M 20 80 Q 20 20, 50 20 Q 80 20, 80 80 L 80 85 L 20 85 Z"
      fill="url(#logoGradient)"
    />
    <path d="M 50 25 V 80" stroke="white" strokeWidth="4" />
    <path d="M 25 80 L 75 80" stroke="white" strokeWidth="4" />
    <path
      d="M 65 15 L 70 25 L 80 30 L 70 35 L 65 45 L 60 35 L 50 30 L 60 25 Z"
      fill="url(#sparkGradient)"
    />
  </svg>
);

const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-home"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const AwardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-award"
  >
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17.18 22l-5.18-3-5.18 3 1.703-9.11" />
  </svg>
);

const BookOpenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-book-open"
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const TrophyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-trophy"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 11V7" />
    <path d="M14 11V7" />
    <path d="M14 15v-4" />
    <path d="M10 15v-4" />
    <path d="M8 22v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
    <path d="M12 17v5" />
    <path d="M12 11h.01" />
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-user"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-settings"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.78 1.28a2 2 0 0 0 .73 2.73l.09.15a2 2 0 0 1 0 2.73l-.09.15a2 2 0 0 0-.73 2.73l.78 1.28a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.78-1.28a2 2 0 0 0-.73-2.73l-.09-.15a2 2 0 0 1 0 2.73l.09.15a2 2 0 0 0 .73-2.73l-.78-1.28a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const BookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-book"
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

const GemIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-gem"
  >
    <path d="M6 3h12l4 6-10 13L2 9l4-6Z" />
    <path d="M12 20v-9" />
    <path d="M10 9l-2 2" />
    <path d="M14 9l2 2" />
  </svg>
);

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-lock"
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-check-circle"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

const BrainCircuitIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-brain-circuit"
  >
    <path d="M12 5a3 3 0 1 0-5.993.25a3 3 0 0 0 5.993-.25m0-1.75A2.5 2.5 0 0 0 9.5 1h-1A2.5 2.5 0 0 0 6 3.5V5a3 3 0 0 0 0 5.682V12a1 1 0 0 0 1 1h1a1 1 0 0 1 1 1v1.5a2.5 2.5 0 0 0 2.5 2.5h1a2.5 2.5 0 0 0 2.5-2.5V15a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1.318A3 3 0 0 0 18 5V3.5A2.5 2.5 0 0 0 15.5 1h-1A2.5 2.5 0 0 0 12 3.25V5m-3 14v-3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v3m11-3v-3a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v3M6.5 12.5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2.5m13 0H21a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2.5a1 1 0 0 0-1 1" />
  </svg>
);

const LayoutDashboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-layout-dashboard"
  >
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

const FacebookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-facebook"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const AppFooter = () => (
  <footer className="w-full mt-auto py-4 px-6 bg-white bg-opacity-80 backdrop-blur-sm border-t-2 border-purple-200">
    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
      <div className="flex items-center gap-2 mb-2 sm:mb-0">
        <AppLogo className="w-8 h-8" />
        <p className="text-sm text-gray-600 font-semibold">
          &copy; 2025 Learn With Joy
        </p>
      </div>
      <div className="text-sm text-gray-500 flex items-center gap-4">
        <p>Developed by Zamora</p>
        <a
          href="https://www.facebook.com/profile.php?id=100083298139446"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-800"
        >
          <FacebookIcon />
        </a>
      </div>
    </div>
  </footer>
);

const BuyMeACoffeeWidget = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.dataset.name = "BMC-Widget";
    script.dataset.cfasync = "false";
    script.src = "https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js";
    script.dataset.id = "ralphzamora";
    script.dataset.description = "Support me on Buy me a coffee!";
    script.dataset.message = "";
    script.dataset.color = "#BD5FFF";
    script.dataset.position = "Right";
    script.dataset.x_margin = "18";
    script.dataset.y_margin = "18";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  return null;
};

/**
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
const shuffleArray = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

/**
 * @param {{
 * onNameSubmit: (name: string, avatar: string) => void;
 * existingName: string;
 * existingAvatar: string;
 * }} props
 */
const NameInput = ({ onNameSubmit, existingName, existingAvatar }) => {
  const [name, setName] = useState(existingName || "");
  const avatarOptions = [
    "😊",
    "😎",
    "🤩",
    "🥳",
    "🚀",
    "🦄",
    "🦁",
    "🦖",
    "🤖",
    "👾",
  ];
  const [selectedAvatar, setSelectedAvatar] = useState(
    existingAvatar || avatarOptions[0]
  );
  const handleSubmit = () => {
    if (name.trim()) {
      onNameSubmit(name.trim(), selectedAvatar);
    }
  };

  /** @param {React.ChangeEvent<HTMLInputElement>} e */
  const handleNameChange = (e) => setName(e.target.value);

  /** @param {React.KeyboardEvent<HTMLInputElement>} e */
  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-200 to-purple-300 min-h-screen">
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border-4 border-blue-400 animate-pop">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-purple-800 mb-4 sm:mb-6 animate-bounce-slow">
          Learn With Joy!
        </h1>
        <p className="text-sm sm:text-xl text-gray-700 mb-6 sm:mb-8">
          {existingName
            ? `Welcome back, ${existingName}!`
            : "Enter your name to start!"}
        </p>
        <div className="mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-700 mb-2 sm:mb-4">
            Choose Your Avatar:
          </h3>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {avatarOptions.map((avatar, index) => (
              <button
                key={index}
                onClick={() => setSelectedAvatar(avatar)}
                className={`p-2 sm:p-3 rounded-full text-2xl sm:text-4xl transition transform hover:scale-125 ${
                  selectedAvatar === avatar
                    ? "bg-blue-300 border-4 border-blue-600 animate-avatar-pop"
                    : "bg-gray-100 border-2 border-gray-300"
                }`}
              >
                {avatar}
              </button>
            ))}
          </div>
          <p className="text-3xl sm:text-5xl mt-4 sm:mt-6 animate-avatar-pop">
            {selectedAvatar}
          </p>
        </div>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Your Name"
          className="w-full p-3 sm:p-4 rounded-xl border-2 border-blue-300 focus:ring-4 focus:ring-blue-500 focus:border-transparent transition text-base sm:text-xl mb-6 sm:mb-8"
          onKeyPress={handleKeyPress}
        />
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 px-6 text-lg sm:py-4 sm:px-8 sm:text-xl rounded-full font-bold shadow-xl hover:from-green-600 hover:to-teal-700 transition transform hover:scale-105 animate-pulse-slow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {existingName ? "Update & Play" : "Start Learning!"}
        </button>
      </div>
    </div>
  );
};

/**
 * @param {{
 * categories: QuizCategories;
 * completedSubjects: string[];
 * }} props
 */
const MapConnections = ({ categories, completedSubjects }) => {
  /** @type {React.MutableRefObject<HTMLElement | null>} */
  const mapContainerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const parent = document.querySelector(".learning-map-container");
    const updateSize = () => {
      if (parent instanceof HTMLElement) {
        setContainerSize({
          width: parent.offsetWidth,
          height: parent.offsetHeight,
        });
      }
    };
    if (parent instanceof HTMLElement) {
      mapContainerRef.current = parent;
      updateSize();
      window.addEventListener("resize", updateSize);
    }
    return () => {
      if (parent) {
        window.removeEventListener("resize", updateSize);
      }
    };
  }, []);

  /**
   * @param {QuizCategory} node
   */
  const getNodeCenter = (node) => {
    const top = parseFloat(node.mapPosition?.top || "50");
    const left = parseFloat(node.mapPosition?.left || "50");
    const nodeSize = containerSize.width < 640 ? 90 : 120;
    const x = (left / 100) * containerSize.width + nodeSize / 2;
    const y = (top / 100) * containerSize.height + nodeSize / 2;
    return { x, y };
  };

  const lines = [];
  Object.keys(categories).forEach((categoryKey) => {
    const category = categories[categoryKey];
    if (category.prerequisites && category.prerequisites.length > 0) {
      category.prerequisites.forEach((prereqKey) => {
        const startNode = categories[prereqKey];
        const endNode = category;
        if (
          startNode &&
          endNode &&
          startNode.mapPosition &&
          endNode.mapPosition &&
          containerSize.width > 0
        ) {
          const start = getNodeCenter(startNode);
          const end = getNodeCenter(endNode);
          const length = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
          );
          const angle =
            Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);
          const isCompleted = completedSubjects.includes(prereqKey);
          lines.push(
            <div
              key={`${prereqKey}-${categoryKey}`}
              className={`map-connection ${
                isCompleted ? "completed-path" : ""
              }`}
              style={{
                left: `${start.x}px`,
                top: `${start.y}px`,
                width: `${length}px`,
                transform: `rotate(${angle}deg)`,
              }}
            />
          );
        }
      });
    }
  });
  return <>{lines}</>;
};

/**
 * @param {{
 * onSelectQuiz: (category: string) => void;
 * userId: string | null;
 * lastQuizResult: LastQuizResult | null;
 * quizCategories: QuizCategories;
 * onShowLeaderboard: () => void;
 * userProgress: PlayerProgress | null;
 * userName: string;
 * onChangePlayer: () => void;
 * onResetLeaderboard: () => void;
 * onShowAdminPanel: () => void;
 * userAvatar: string;
 * onShowReview: () => void;
 * lastQuizReviewData: QuizSessionResult[] | null;
 * onShowStory: (story: Story) => void;
 * stories: Story[];
 * onShowAchievements: () => void;
 * onStartPersonalizedReview: () => void;
 * weakQuestionsCount: number;
 * onShowAdminDashboard: () => void;
 * }} props
 */
const Home = ({
  onSelectQuiz,
  userId,
  lastQuizResult,
  quizCategories,
  onShowLeaderboard,
  userProgress,
  userName,
  onChangePlayer,
  onResetLeaderboard,
  onShowAdminPanel,
  userAvatar,
  onShowReview,
  lastQuizReviewData,
  onShowStory,
  stories,
  onShowAchievements,
  onStartPersonalizedReview,
  weakQuestionsCount,
  onShowAdminDashboard,
}) => {
  const isAdmin = userName.toLowerCase() === "admin";
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  /** @type {[string | null, React.Dispatch<React.SetStateAction<string|null>>]} */
  const [quizCategoryToStart, setQuizCategoryToStart] = useState(null);

  const playerLevel = userProgress
    ? Math.floor(userProgress.score / 100) + 1
    : 1;

  /** @param {string} category */
  const handleQuizButtonClick = (category) => {
    setQuizCategoryToStart(category);
    setShowConfirmationModal(true);
  };

  const confirmStartQuiz = () => {
    if (quizCategoryToStart) {
      onSelectQuiz(quizCategoryToStart);
      setShowConfirmationModal(false);
      setQuizCategoryToStart(null);
    }
  };

  const cancelStartQuiz = () => {
    setShowConfirmationModal(false);
    setQuizCategoryToStart(null);
  };

  const isSubjectUnlocked = useCallback(
    (categoryKey) => {
      const subject = quizCategories[categoryKey];
      if (
        !subject ||
        !subject.prerequisites ||
        subject.prerequisites.length === 0
      ) {
        return true;
      }
      const completedSubjects = userProgress?.completedSubjects || [];
      return subject.prerequisites.every((prereq) =>
        completedSubjects.includes(prereq)
      );
    },
    [quizCategories, userProgress]
  );

  /** @param {string} categoryKey */
  const getSubjectIcon = (categoryKey) => {
    switch (categoryKey) {
      case "General Knowledge":
        return "💡";
      case "Animals":
        return "🦁";
      case "Space":
        return "🚀";
      default:
        return "�";
    }
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 bg-gradient-to-br from-pink-100 to-purple-200 min-h-screen">
      <header className="w-full max-w-5xl bg-white p-3 sm:p-4 rounded-xl shadow-lg mb-4 sm:mb-6 flex flex-col md:flex-row justify-between items-center border-b-4 border-purple-300 animate-fade-in">
        <div className="flex items-center mb-2 sm:mb-4 md:mb-0">
          <AppLogo className="w-10 h-10 sm:w-12 sm:h-12" />
          <h1 className="text-xl sm:text-3xl font-extrabold text-purple-700">
            Learn With Joy!
          </h1>
        </div>
        <nav className="flex flex-wrap justify-center md:justify-end gap-2 sm:gap-3">
          {weakQuestionsCount > 0 && (
            <button
              onClick={onStartPersonalizedReview}
              className="bg-purple-500 text-white py-1.5 px-3 rounded-full text-xs sm:py-2 sm:px-4 sm:text-sm font-bold shadow-md hover:bg-purple-600 transition flex items-center gap-1"
            >
              <BrainCircuitIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Review (
              {weakQuestionsCount})
            </button>
          )}
          {lastQuizReviewData && (
            <button
              onClick={onShowReview}
              className="bg-orange-500 text-white py-1.5 px-3 rounded-full text-xs sm:py-2 sm:px-4 sm:text-sm font-bold shadow-md hover:bg-orange-600 transition flex items-center gap-1"
            >
              <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Review
            </button>
          )}
          <button
            onClick={onShowLeaderboard}
            className="bg-teal-500 text-white py-1.5 px-3 rounded-full text-xs sm:py-2 sm:px-4 sm:text-sm font-bold shadow-md hover:bg-teal-600 transition flex items-center gap-1"
          >
            <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Scores
          </button>
          <button
            onClick={() => onShowStory(stories[0])}
            className="bg-pink-500 text-white py-1.5 px-3 rounded-full text-xs sm:py-2 sm:px-4 sm:text-sm font-bold shadow-md hover:bg-pink-600 transition flex items-center gap-1"
          >
            <BookIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Story
          </button>
          <button
            onClick={onShowAchievements}
            className="bg-yellow-500 text-white py-1.5 px-3 rounded-full text-xs sm:py-2 sm:px-4 sm:text-sm font-bold shadow-md hover:bg-yellow-600 transition flex items-center gap-1"
          >
            <GemIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Badges
          </button>
          <button
            onClick={onChangePlayer}
            className="bg-gray-300 text-gray-800 py-1.5 px-3 rounded-full text-xs sm:py-2 sm:px-4 sm:text-sm font-bold shadow-md hover:bg-gray-400 transition flex items-center gap-1"
          >
            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Change
          </button>
          {isAdmin && (
            <>
              <button
                onClick={onShowAdminDashboard}
                className="bg-indigo-500 text-white py-1.5 px-3 rounded-full text-xs sm:py-2 sm:px-4 sm:text-sm font-bold shadow-md hover:bg-indigo-600 transition flex items-center gap-1"
              >
                <LayoutDashboardIcon className="w-4 h-4 sm:w-5 sm:h-5" />{" "}
                Dashboard
              </button>
              <button
                onClick={onShowAdminPanel}
                className="bg-blue-500 text-white py-1.5 px-3 rounded-full text-xs sm:py-2 sm:px-4 sm:text-sm font-bold shadow-md hover:bg-blue-600 transition flex items-center gap-1"
              >
                <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Edit Quizzes
              </button>
            </>
          )}
        </nav>
      </header>
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl max-w-5xl w-full text-center border-4 border-purple-300 animate-fade-in md:grid md:grid-cols-2 md:gap-8 md:text-left">
        <div className="md:col-span-1 flex flex-col items-center md:items-start">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-purple-700 mb-4 sm:mb-6 flex items-center justify-center md:justify-start gap-2 sm:gap-3 animate-pop-in">
            <HomeIcon className="text-purple-600 w-8 h-8 sm:w-10 sm:h-10" />
            Your Learning Hub!
          </h2>
          <p className="text-sm sm:text-xl text-gray-700 mb-6 sm:mb-8">
            Dive into exciting quizzes and track your progress.
          </p>
          {userProgress && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-purple-50 rounded-2xl border-2 border-purple-300 shadow-lg w-full">
              <h3 className="text-xl sm:text-3xl font-semibold text-purple-800 mb-2 sm:mb-3 flex items-center justify-center md:justify-start gap-1 sm:gap-2">
                <UserIcon className="text-purple-700 w-6 h-6 sm:w-8 sm:h-8" />
                <span className="mr-1 sm:mr-2">{userAvatar}</span>
                {userName}'s Stats
              </h3>
              <p className="text-sm sm:text-xl text-gray-700 mb-1 sm:mb-2">
                Total Score:{" "}
                <span className="font-bold text-purple-900 ml-1 sm:ml-2">
                  {userProgress.score}
                </span>
              </p>
              <p className="text-sm sm:text-xl text-gray-700">
                Level:{" "}
                <span className="font-bold text-purple-900 ml-1 sm:ml-2">
                  {playerLevel}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-2 sm:mt-3">
                User ID:{" "}
                <span className="font-mono text-xs break-all">{userId}</span>
              </p>
            </div>
          )}
          {lastQuizResult && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-blue-50 rounded-2xl border-2 border-blue-300 shadow-lg animate-slide-in-up w-full">
              <h3 className="text-xl sm:text-3xl font-semibold text-blue-800 mb-2 sm:mb-3 flex items-center justify-center md:justify-start gap-1 sm:gap-2">
                <AwardIcon className="text-blue-700 w-6 h-6 sm:w-8 sm:h-8" />
                Last Quiz Results! 🎉
              </h3>
              <p className="text-sm sm:text-xl text-gray-700">
                Quiz Type:{" "}
                <span className="font-bold text-blue-900">
                  {lastQuizResult.quizType}
                </span>
              </p>
              <p className="text-sm sm:text-xl text-gray-700">
                Points Gained:{" "}
                <span className="font-bold text-blue-900">
                  {lastQuizResult.pointsGained}
                </span>
              </p>
              <p className="text-sm sm:text-xl text-gray-700">
                Total Score:{" "}
                <span className="font-bold text-blue-900">
                  {lastQuizResult.score}
                </span>
              </p>
            </div>
          )}
        </div>
        <div className="md:col-span-1 flex flex-col items-center md:items-start">
          <h2 className="text-xl sm:text-3xl font-bold text-gray-700 mb-4 sm:mb-6 flex items-center justify-center md:justify-start gap-1 sm:gap-2">
            <BookOpenIcon className="text-gray-600 w-6 h-6 sm:w-8 sm:h-8" />
            Your Learning Journey
          </h2>
          <div className="learning-map-container">
            <MapConnections
              categories={quizCategories}
              completedSubjects={userProgress?.completedSubjects || []}
            />
            {Object.keys(quizCategories).map((categoryKey) => {
              const category = quizCategories[categoryKey];
              const isCompleted =
                userProgress?.completedSubjects?.includes(categoryKey);
              const isLocked = !isSubjectUnlocked(categoryKey);
              const subjectProgress = userProgress?.subjectProgress?.[
                categoryKey
              ] || { correct: 0, total: category.questions.length };
              const progressPercentage =
                subjectProgress.total > 0
                  ? (subjectProgress.correct / subjectProgress.total) * 100
                  : 0;
              return (
                <button
                  key={categoryKey}
                  onClick={() => handleQuizButtonClick(categoryKey)}
                  disabled={isLocked || isCompleted}
                  className={`map-node ${isCompleted ? "completed" : ""} ${
                    isLocked ? "locked" : ""
                  }`}
                  style={{
                    top: category.mapPosition?.top,
                    left: category.mapPosition?.left,
                  }}
                >
                  {isLocked ? (
                    <LockIcon className="map-node-icon" />
                  ) : isCompleted ? (
                    <CheckCircleIcon className="map-node-icon" />
                  ) : (
                    <span className="map-node-icon">
                      {getSubjectIcon(categoryKey)}
                    </span>
                  )}
                  <span className="map-node-title">{categoryKey}</span>
                  <div className="progress-bar mt-1 w-10/12">
                    <div
                      className="progress-fill"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {subjectProgress.correct} / {subjectProgress.total} Correct
                  </p>
                </button>
              );
            })}
          </div>
          {isAdmin && (
            <button
              onClick={onResetLeaderboard}
              className="w-full bg-red-500 text-white py-3 px-6 text-lg sm:py-4 sm:px-8 sm:text-xl rounded-full font-bold shadow-lg hover:bg-red-600 transition transform hover:scale-105 flex items-center justify-center gap-2 mt-8"
            >
              <SettingsIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              Admin: Reset All Data
            </button>
          )}
        </div>
      </div>
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border-4 border-blue-400 animate-pop">
            <h3 className="text-xl sm:text-3xl font-bold text-blue-800 mb-4 sm:mb-6">
              Ready to start?
            </h3>
            <p className="text-base sm:text-xl text-gray-700 mb-6 sm:mb-8">
              You are about to start the "{quizCategoryToStart}" quiz.
            </p>
            <div className="flex justify-center gap-3 sm:gap-4">
              <button
                onClick={confirmStartQuiz}
                className="bg-green-500 text-white py-2 px-4 text-base sm:py-3 sm:px-6 sm:text-lg rounded-full font-bold shadow-lg hover:bg-green-600 transition transform hover:scale-105"
              >
                Start Quiz
              </button>
            </div>
            <button
              onClick={cancelStartQuiz}
              className="mt-4 text-gray-600 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @param {{
 * quizData: QuizCategory & { categoryKey: string };
 * onQuizComplete: (pointsGained: number, subjectKey: string, correctCount: number, totalCount: number, reviewData: QuizSessionResult[]) => void;
 * userAvatar: string;
 * }} props
 */
const Quiz = ({ quizData, onQuizComplete, userAvatar }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  /** @type {[any, React.Dispatch<React.SetStateAction<any>>]} */
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userFreeTextAnswer, setUserFreeTextAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  /** @type {[{text: string, disabled: boolean}[], React.Dispatch<React.SetStateAction<{text: string, disabled: boolean}[]>>]} */
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [scoreDelta, setScoreDelta] = useState(0);
  const [pointsAwardedDisplay, setPointsAwardedDisplay] = useState(0);
  const [correctAnswersInQuiz, setCorrectAnswersInQuiz] = useState(0);
  /** @type {[QuizSessionResult[], React.Dispatch<React.SetStateAction<QuizSessionResult[]>>]} */
  const [quizSessionResults, setQuizSessionResults] = useState([]);
  const [timer, setTimer] = useState(0);
  /** @type {React.MutableRefObject<NodeJS.Timeout | null>} */
  const timerRef = useRef(null);
  const isAnswerSubmitted = selectedAnswer !== null;
  const [lifelines, setLifelines] = useState({ fiftyFifty: 1, extraTime: 1 });
  /** @type {['idle' | 'correct' | 'incorrect', React.Dispatch<React.SetStateAction<'idle' | 'correct' | 'incorrect'>>]} */
  const [avatarReaction, setAvatarReaction] = useState("idle");

  /** @param {string} text */
  const handleReadAloud = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswerSubmission = useCallback(
    /** @param {any} answerProvided */
    (answerProvided) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      const currentQuestion = quizData.questions[currentQuestionIndex];
      let correct = false;
      const isReviewQuiz = quizData.categoryKey === "Personalized Review";
      const basePoints = isReviewQuiz ? 5 : currentQuestion.points || 10;
      let answerToSet = answerProvided;
      const normalizedCorrectAnswer = String(currentQuestion.correctAnswer)
        ?.toLowerCase()
        .trim();

      if (currentQuestion.type === "multiple-choice") {
        const normalizedSelected = String(answerProvided)?.toLowerCase().trim();
        if (answerProvided === null) {
          setFeedback(
            `Time's up! The correct answer was: ${currentQuestion.correctAnswer}`
          );
          answerToSet = "timed_out_mcq";
        } else if (normalizedSelected === normalizedCorrectAnswer) {
          setFeedback("Correct! 🎉");
          correct = true;
        } else {
          setFeedback(
            `Incorrect. The correct answer was: ${currentQuestion.correctAnswer}`
          );
        }
      } else if (currentQuestion.type === "fill-in-the-blank") {
        const normalizedUser = userFreeTextAnswer.trim().toLowerCase();
        if (!userFreeTextAnswer.trim()) {
          setFeedback(
            `Time's up! The correct answer was: ${currentQuestion.correctAnswer}`
          );
          answerToSet = "timed_out_fill_blank";
        } else {
          if (normalizedUser === normalizedCorrectAnswer) {
            setFeedback("Correct! ✨");
            correct = true;
          } else {
            setFeedback(
              `Incorrect. The correct answer was: ${currentQuestion.correctAnswer}`
            );
          }
          answerToSet = userFreeTextAnswer;
        }
      } else if (currentQuestion.type === "true-false") {
        const normalizedSelected = String(answerProvided)?.toLowerCase().trim();
        if (answerProvided === null) {
          setFeedback(
            `Time's up! The correct answer was: ${currentQuestion.correctAnswer}`
          );
          answerToSet = "timed_out_true_false";
        } else if (normalizedSelected === normalizedCorrectAnswer) {
          setFeedback("Correct! 🎉");
          correct = true;
        } else {
          setFeedback(
            `Incorrect. The correct answer was: ${currentQuestion.correctAnswer}`
          );
        }
      }

      let pointsEarnedThisQuestion = 0;
      if (correct) {
        pointsEarnedThisQuestion = basePoints;
        setCorrectAnswersInQuiz((prev) => prev + 1);
        setAvatarReaction("correct");
      } else {
        setAvatarReaction("incorrect");
      }

      setSelectedAnswer(answerToSet);
      setScoreDelta((prev) => prev + pointsEarnedThisQuestion);
      setPointsAwardedDisplay(pointsEarnedThisQuestion);
      setTimeout(() => setPointsAwardedDisplay(0), 1500);
      setQuizSessionResults((prevResults) => [
        ...prevResults,
        { ...currentQuestion, userAnswer: answerToSet, isCorrect: correct },
      ]);
    },
    [currentQuestionIndex, quizData, userFreeTextAnswer]
  );

  const handleNextQuestion = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setAvatarReaction("idle");
    } else {
      onQuizComplete(
        scoreDelta,
        quizData.categoryKey,
        correctAnswersInQuiz,
        quizData.questions.length,
        quizSessionResults
      );
    }
  }, [
    currentQuestionIndex,
    quizData,
    scoreDelta,
    onQuizComplete,
    correctAnswersInQuiz,
    quizSessionResults,
  ]);

  const handleFiftyFifty = () => {
    if (lifelines.fiftyFifty > 0) {
      const currentQuestion = quizData.questions[currentQuestionIndex];
      if (
        currentQuestion.type !== "multiple-choice" ||
        !currentQuestion.options
      )
        return;

      const incorrectOptions = currentQuestion.options.filter(
        (opt) => opt !== currentQuestion.correctAnswer
      );
      const optionsToRemove = shuffleArray(incorrectOptions).slice(0, 2);
      const newShuffled = shuffledOptions.map((opt) =>
        optionsToRemove.includes(opt.text) ? { ...opt, disabled: true } : opt
      );
      setShuffledOptions(newShuffled);
      setLifelines((prev) => ({ ...prev, fiftyFifty: 0 }));
    }
  };

  const handleExtraTime = () => {
    if (lifelines.extraTime > 0) {
      setTimer((prev) => prev + 15);
      setLifelines((prev) => ({ ...prev, extraTime: 0 }));
    }
  };

  useEffect(() => {
    setCurrentQuestionIndex(0);
    setScoreDelta(0);
    setCorrectAnswersInQuiz(0);
    setQuizSessionResults([]);
    setLifelines({ fiftyFifty: 1, extraTime: 1 });
  }, [quizData]);

  useEffect(() => {
    if (quizData && quizData.questions.length > 0) {
      const currentQuestion = quizData.questions[currentQuestionIndex];
      setSelectedAnswer(null);
      setUserFreeTextAnswer("");
      setFeedback("");
      setPointsAwardedDisplay(0);
      setTimer(currentQuestion.timeLimit || 15);
      if (
        currentQuestion.type === "multiple-choice" &&
        currentQuestion.options
      ) {
        setShuffledOptions(
          currentQuestion.options.map((opt) => ({ text: opt, disabled: false }))
        );
      } else {
        setShuffledOptions([]);
      }
    }
  }, [currentQuestionIndex, quizData]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (!isAnswerSubmitted && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prevTime) => {
          if (prevTime <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleAnswerSubmission(null);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestionIndex, timer, isAnswerSubmitted, handleAnswerSubmission]);

  const quizThemes = {
    "General Knowledge": "from-blue-100 to-cyan-200",
    Animals: "from-green-100 to-lime-200",
    Space: "from-indigo-100 to-purple-200",
    "Personalized Review": "from-purple-100 to-pink-200",
  };
  const currentTheme =
    quizThemes[quizData.categoryKey] || "from-gray-100 to-gray-200";

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading quiz...</p>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];

  return (
    <div
      className={`flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br ${currentTheme} min-h-screen`}
    >
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl max-w-3xl w-full border-4 border-orange-300 relative">
        <div className="flex justify-between items-start">
          <div
            className={`text-5xl mb-4 ${
              avatarReaction === "correct" ? "avatar-correct-animation" : ""
            } ${
              avatarReaction === "incorrect" ? "avatar-incorrect-animation" : ""
            }`}
          >
            {userAvatar}
          </div>
          <div
            className={`text-xl sm:text-3xl font-bold p-2 sm:p-3 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center ${
              timer <= 5 && !isAnswerSubmitted
                ? "bg-red-300 text-red-800 animate-pulse-fast"
                : "bg-blue-300 text-blue-800"
            }`}
          >
            {timer}
          </div>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-orange-700 mb-4 sm:mb-8 text-center">
          {quizData.categoryKey === "Personalized Review"
            ? "Review Session"
            : `Question ${currentQuestionIndex + 1} / ${
                quizData.questions.length
              }`}
        </h2>
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-300 shadow-inner flex items-center gap-4">
          <p className="text-lg sm:text-2xl text-gray-800 font-semibold leading-relaxed flex-grow">
            {currentQuestion.question}
          </p>
          <button
            onClick={() => handleReadAloud(currentQuestion.question)}
            className="p-2 rounded-full hover:bg-yellow-200 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
        </div>
        {pointsAwardedDisplay > 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-6xl font-extrabold text-green-600 opacity-0 animate-fade-in-up-and-out pointer-events-none">
            +{pointsAwardedDisplay}
          </div>
        )}
        {currentQuestion.type === "multiple-choice" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 mb-6 sm:mb-8">
            {shuffledOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSubmission(option.text)}
                disabled={isAnswerSubmitted || option.disabled}
                className={`p-3 text-base sm:p-5 sm:text-xl rounded-xl font-medium text-left transition transform hover:scale-103 ${
                  isAnswerSubmitted
                    ? String(option.text).toLowerCase().trim() ===
                      String(currentQuestion.correctAnswer).toLowerCase().trim()
                      ? "bg-green-200 border-green-500 ring-2 ring-green-400"
                      : selectedAnswer === option.text
                      ? "bg-red-200 border-red-500"
                      : "bg-gray-100"
                    : "bg-gray-100 hover:bg-gray-200 border"
                } ${
                  isAnswerSubmitted || option.disabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
              >
                {option.text}
              </button>
            ))}
          </div>
        )}
        {currentQuestion.type === "fill-in-the-blank" && !isAnswerSubmitted && (
          <div className="mb-6 sm:mb-8 flex gap-2">
            <input
              type="text"
              value={userFreeTextAnswer}
              onChange={(e) => setUserFreeTextAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="w-full p-3 sm:p-4 rounded-xl border-2"
            />
            <button
              onClick={() => handleAnswerSubmission(userFreeTextAnswer)}
              className="bg-blue-500 text-white p-3 sm:p-4 rounded-xl font-bold"
            >
              Submit
            </button>
          </div>
        )}
        {currentQuestion.type === "true-false" && (
          <div className="flex justify-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            <button
              onClick={() => handleAnswerSubmission("True")}
              disabled={isAnswerSubmitted}
              className={`flex-1 py-3 px-6 text-lg sm:py-4 sm:px-8 sm:text-xl rounded-full font-bold shadow-lg transition transform hover:scale-105 ${
                isAnswerSubmitted
                  ? currentQuestion.correctAnswer === "True"
                    ? "bg-green-200 border-green-500 ring-2 ring-green-400"
                    : selectedAnswer === "True"
                    ? "bg-red-200 border-red-500"
                    : "bg-gray-100"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              } ${isAnswerSubmitted ? "cursor-not-allowed" : ""}`}
            >
              True
            </button>
            <button
              onClick={() => handleAnswerSubmission("False")}
              disabled={isAnswerSubmitted}
              className={`flex-1 py-3 px-6 text-lg sm:py-4 sm:px-8 sm:text-xl rounded-full font-bold shadow-lg transition transform hover:scale-105 ${
                isAnswerSubmitted
                  ? currentQuestion.correctAnswer === "False"
                    ? "bg-green-200 border-green-500 ring-2 ring-green-400"
                    : selectedAnswer === "False"
                    ? "bg-red-200 border-red-500"
                    : "bg-gray-100"
                  : "bg-red-500 text-white hover:bg-red-600"
              } ${isAnswerSubmitted ? "cursor-not-allowed" : ""}`}
            >
              False
            </button>
          </div>
        )}
        {feedback && (
          <div
            className={`p-3 sm:p-4 rounded-xl text-center font-bold text-sm sm:text-lg mb-6 sm:mb-8 animate-fade-in ${
              feedback.startsWith("Correct")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {feedback}
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-5 mt-4 sm:mt-6">
          <button
            onClick={handleFiftyFifty}
            disabled={
              isAnswerSubmitted ||
              lifelines.fiftyFifty === 0 ||
              currentQuestion.type !== "multiple-choice"
            }
            className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-full font-bold shadow-lg hover:bg-orange-600 disabled:opacity-50"
          >
            50/50
          </button>
          <button
            onClick={handleExtraTime}
            disabled={isAnswerSubmitted || lifelines.extraTime === 0}
            className="flex-1 bg-teal-500 text-white py-2 px-4 rounded-full font-bold shadow-lg hover:bg-teal-600 disabled:opacity-50"
          >
            +15s
          </button>
          <button
            onClick={handleNextQuestion}
            disabled={!isAnswerSubmitted}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2 px-4 rounded-full font-bold shadow-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50"
          >
            {currentQuestionIndex < quizData.questions.length - 1
              ? "Next Question"
              : "Finish Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * @param {{
 * quizCategories: QuizCategories;
 * onUpdateQuizCategories: (categories: QuizCategories) => void;
 * onBackToHome: () => void;
 * onShowDashboard: () => void;
 * }} props
 */
const AdminPanel = ({
  quizCategories,
  onUpdateQuizCategories,
  onBackToHome,
  onShowDashboard,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryTop, setNewCategoryTop] = useState("50%");
  const [newCategoryLeft, setNewCategoryLeft] = useState("50%");
  /** @type {[Question[], React.Dispatch<React.SetStateAction<Question[]>>]} */
  const [questionsToEdit, setQuestionsToEdit] = useState([]);
  const [editedPosition, setEditedPosition] = useState({ top: "", left: "" });
  const [editedPrerequisites, setEditedPrerequisites] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [generationTopic, setGenerationTopic] = useState("");
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  /** @type {[Question[], React.Dispatch<React.SetStateAction<Question[]>>]} */
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  /** @type {[string | null, React.Dispatch<React.SetStateAction<string|null>>]} */
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (selectedCategory && quizCategories[selectedCategory]) {
      const categoryData = quizCategories[selectedCategory];
      setQuestionsToEdit(JSON.parse(JSON.stringify(categoryData.questions)));
      setEditedPosition(
        categoryData.mapPosition || { top: "50%", left: "50%" }
      );
      setEditedPrerequisites((categoryData.prerequisites || []).join(", "));
    } else {
      setQuestionsToEdit([]);
      setEditedPosition({ top: "", left: "" });
      setEditedPrerequisites("");
    }
  }, [selectedCategory, quizCategories]);

  const handleAddCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (trimmedName && !quizCategories[trimmedName]) {
      const updatedCategories = {
        ...quizCategories,
        [trimmedName]: {
          title: trimmedName,
          questions: [],
          prerequisites: [],
          mapPosition: { top: newCategoryTop, left: newCategoryLeft },
        },
      };
      onUpdateQuizCategories(updatedCategories);
      setSelectedCategory(trimmedName);
      setNewCategoryName("");
      setNewCategoryTop("50%");
      setNewCategoryLeft("50%");
      setMessage({ text: `Category "${trimmedName}" added!`, type: "success" });
    } else if (quizCategories[trimmedName]) {
      setMessage({
        text: `Category "${trimmedName}" already exists.`,
        type: "error",
      });
    }
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const updatedCategories = { ...quizCategories };
    delete updatedCategories[categoryToDelete];
    for (const key in updatedCategories) {
      if (updatedCategories[key].prerequisites) {
        updatedCategories[key].prerequisites = updatedCategories[
          key
        ].prerequisites.filter((prereq) => prereq !== categoryToDelete);
      }
    }
    onUpdateQuizCategories(updatedCategories);
    setSelectedCategory("");
    setMessage({
      text: `Category "${categoryToDelete}" deleted!`,
      type: "success",
    });
    setCategoryToDelete(null);
  };

  /**
   * @param {number} index
   * @param {keyof Question} field
   * @param {any} value
   */
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questionsToEdit];
    const questionToUpdate = { ...updatedQuestions[index] };

    if (field === "options") {
      questionToUpdate[field] = value
        .split(",")
        .map((/**@type {string}*/ item) => item.trim());
    } else if (field === "points" || field === "timeLimit") {
      questionToUpdate[field] = parseInt(value, 10) || 0;
    } else {
      // @ts-ignore
      questionToUpdate[field] = value;
    }
    updatedQuestions[index] = questionToUpdate;
    setQuestionsToEdit(updatedQuestions);
  };

  /**
   * @param {'top' | 'left'} axis
   * @param {string} value
   */
  const handlePositionChange = (axis, value) => {
    setEditedPosition((prev) => ({ ...prev, [axis]: value }));
  };

  /** @param {Question | null} [questionData] */
  const handleAddQuestion = (questionData = null) => {
    const newQuestion = questionData || {
      type: "multiple-choice",
      question: "",
      options: [],
      correctAnswer: "",
      imageUrl: "",
      points: 15,
      timeLimit: 15,
    };
    setQuestionsToEdit([...questionsToEdit, newQuestion]);
  };

  /** @param {number} index */
  const handleDeleteQuestion = (index) => {
    setQuestionsToEdit(questionsToEdit.filter((_, i) => i !== index));
  };

  const handleSaveQuestions = () => {
    if (!selectedCategory) {
      setMessage({ text: "Please select a category.", type: "error" });
      return;
    }
    const prerequisitesArray = editedPrerequisites
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const updatedCategories = {
      ...quizCategories,
      [selectedCategory]: {
        ...quizCategories[selectedCategory],
        questions: questionsToEdit,
        mapPosition: editedPosition,
        prerequisites: prerequisitesArray,
      },
    };
    onUpdateQuizCategories(updatedCategories);
    setMessage({
      text: `Data for "${selectedCategory}" saved!`,
      type: "success",
    });
  };

  const handleGenerateQuestions = useCallback(async () => {
    if (!generationTopic.trim()) {
      setMessage({ text: "Please enter a topic.", type: "error" });
      return;
    }
    setGeneratingQuestions(true);
    setGeneratedQuestions([]);
    setMessage({ text: "", type: "" });
    try {
      const prompt = `Generate 3-5 diverse quiz questions (multiple-choice, fill-in-the-blank, true-false) about "${generationTopic}". Return as a JSON array.`;
      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                type: { type: "STRING" },
                question: { type: "STRING" },
                options: { type: "ARRAY", items: { type: "STRING" } },
                correctAnswer: { type: "STRING" },
                points: { type: "INTEGER" },
                timeLimit: { type: "INTEGER" },
              },
              required: ["type", "question", "correctAnswer"],
            },
          },
        },
      };
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        const parsedQuestions = JSON.parse(
          result.candidates[0].content.parts[0].text
        );
        setGeneratedQuestions(parsedQuestions);
        setMessage({
          text: `${parsedQuestions.length} questions generated!`,
          type: "success",
        });
      } else {
        setMessage({ text: "Could not generate questions.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Failed to generate questions.", type: "error" });
    } finally {
      setGeneratingQuestions(false);
    }
  }, [generationTopic]);

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-4xl w-full mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-purple-700 mb-6 text-center">
          Admin Panel
        </h2>
        {message.text && (
          <div
            className={`toast-notification ${
              message.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {message.text}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={onShowDashboard}
            className="flex-1 bg-indigo-500 text-white py-2 px-4 rounded-lg font-bold hover:bg-indigo-600 transition flex items-center justify-center gap-2"
          >
            <LayoutDashboardIcon /> Dashboard
          </button>
          <button
            onClick={onBackToHome}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            <HomeIcon /> Home
          </button>
        </div>
        <div className="mb-8 p-6 border rounded-xl bg-gray-50">
          <h3 className="text-xl font-bold text-gray-700 mb-4">
            Manage Categories
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New Category Name"
              className="p-3 rounded-lg border"
            />
            <div className="flex gap-2">
              <input
                value={newCategoryTop}
                onChange={(e) => setNewCategoryTop(e.target.value)}
                placeholder="Top (e.g., 10%)"
                className="w-1/2 p-3 rounded-lg border"
              />
              <input
                value={newCategoryLeft}
                onChange={(e) => setNewCategoryLeft(e.target.value)}
                placeholder="Left (e.g., 10%)"
                className="w-1/2 p-3 rounded-lg border"
              />
            </div>
          </div>
          <button
            onClick={handleAddCategory}
            className="w-full bg-green-500 text-white py-2 rounded-lg font-bold hover:bg-green-600 mb-4"
          >
            Add Category
          </button>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.keys(quizCategories).map((category) => (
              <div
                key={category}
                className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border"
              >
                <span className="font-medium">{category}</span>
                <div>
                  <button
                    onClick={() => setSelectedCategory(category)}
                    className="bg-blue-500 text-white text-sm py-1 px-3 rounded-md hover:bg-blue-600 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setCategoryToDelete(category)}
                    className="bg-red-500 text-white text-sm py-1 px-3 rounded-md hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-8 p-6 border rounded-xl bg-gray-50">
          <h3 className="text-xl font-bold text-gray-700 mb-4">
            Generate Questions with AI
          </h3>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={generationTopic}
              onChange={(e) => setGenerationTopic(e.target.value)}
              placeholder="Topic (e.g., 'World History')"
              className="flex-grow p-3 rounded-lg border"
              disabled={generatingQuestions}
            />
            <button
              onClick={handleGenerateQuestions}
              disabled={generatingQuestions || !generationTopic.trim()}
              className="bg-purple-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
            >
              ✨ {generatingQuestions ? "Generating..." : "Generate"}
            </button>
          </div>
          {generatedQuestions.length > 0 && (
            <div className="mt-6 p-4 bg-purple-50 rounded-xl border">
              <h4 className="font-semibold text-purple-800 mb-3">
                Generated Questions:
              </h4>
              {generatedQuestions.map((q, index) => (
                <div
                  key={index}
                  className="bg-white p-3 rounded-lg shadow-sm mb-3 border"
                >
                  <p className="font-medium">
                    {index + 1}. {q.question}
                  </p>
                  <p className="text-sm text-gray-600">
                    Answer: {q.correctAnswer}
                  </p>
                  <button
                    onClick={() => handleAddQuestion(q)}
                    disabled={!selectedCategory}
                    className="mt-2 bg-blue-500 text-white text-xs py-1 px-3 rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    Add to {selectedCategory || "Category"}
                  </button>
                </div>
              ))}
              {!selectedCategory && (
                <p className="text-red-500 text-sm mt-2">
                  Select a category to add questions.
                </p>
              )}
            </div>
          )}
        </div>
        {selectedCategory && (
          <div className="p-6 border rounded-xl bg-gray-50">
            <h3 className="text-xl font-bold text-gray-700 mb-4">
              Editing: {selectedCategory}
            </h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium">
                  Map Top Position:
                </label>
                <input
                  value={editedPosition.top}
                  onChange={(e) => handlePositionChange("top", e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Map Left Position:
                </label>
                <input
                  value={editedPosition.left}
                  onChange={(e) => handlePositionChange("left", e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Prerequisites (comma-separated):
              </label>
              <input
                value={editedPrerequisites}
                onChange={(e) => setEditedPrerequisites(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <h4 className="text-lg font-bold mb-4 pt-4 border-t">Questions</h4>
            <button
              onClick={() => handleAddQuestion()}
              className="bg-indigo-500 text-white py-2 px-4 rounded-lg font-bold hover:bg-indigo-600 mb-4"
            >
              Add New Question
            </button>
            {questionsToEdit.map((q, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow-md mb-4 border"
              >
                <h5 className="font-semibold text-blue-700 mb-3">
                  Question {index + 1}
                </h5>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm">Type:</label>
                    <select
                      value={q.type}
                      onChange={(e) =>
                        handleQuestionChange(index, "type", e.target.value)
                      }
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="fill-in-the-blank">
                        Fill-in-the-blank
                      </option>
                      <option value="true-false">True/False</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm">Points:</label>
                    <input
                      type="number"
                      value={q.points || ""}
                      onChange={(e) =>
                        handleQuestionChange(index, "points", e.target.value)
                      }
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
                <label className="block text-sm">Question Text:</label>
                <textarea
                  value={q.question}
                  onChange={(e) =>
                    handleQuestionChange(index, "question", e.target.value)
                  }
                  rows={2}
                  className="w-full p-2 border rounded-md mb-3"
                ></textarea>
                {q.type === "multiple-choice" && (
                  <>
                    <label className="block text-sm">
                      Options (comma-separated):
                    </label>
                    <input
                      type="text"
                      value={q.options ? q.options.join(", ") : ""}
                      onChange={(e) =>
                        handleQuestionChange(index, "options", e.target.value)
                      }
                      className="w-full p-2 border rounded-md mb-3"
                    />
                  </>
                )}
                <label className="block text-sm">Correct Answer:</label>
                <input
                  type="text"
                  value={q.correctAnswer}
                  onChange={(e) =>
                    handleQuestionChange(index, "correctAnswer", e.target.value)
                  }
                  className="w-full p-2 border rounded-md mb-3"
                />
                <button
                  onClick={() => handleDeleteQuestion(index)}
                  className="bg-red-500 text-white py-1 px-2 rounded-lg font-bold text-xs"
                >
                  Delete Question
                </button>
              </div>
            ))}
            <button
              onClick={handleSaveQuestions}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 mt-4"
            >
              Save All Changes for {selectedCategory}
            </button>
          </div>
        )}
        {categoryToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full">
              <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
              <p>
                Are you sure you want to delete the category "{categoryToDelete}
                " and all its questions?
              </p>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setCategoryToDelete(null)}
                  className="bg-gray-200 py-2 px-4 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCategory}
                  className="bg-red-500 text-white py-2 px-4 rounded-lg font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * @param {{
 * allPlayersProgress: AllPlayersProgress;
 * quizCategories: QuizCategories;
 * onBackToAdminPanel: () => void;
 * }} props
 */
const AdminDashboard = ({
  allPlayersProgress,
  quizCategories,
  onBackToAdminPanel,
}) => {
  const dashboardStats = useMemo(() => {
    const studentProgress = Object.fromEntries(
      Object.entries(allPlayersProgress).filter(
        ([name]) => name.toLowerCase() !== "admin"
      )
    );
    const players = Object.values(studentProgress);
    if (players.length === 0) {
      return {
        totalStudents: 0,
        averageScore: 0,
        subjectStats: {},
        totalQuizzesTaken: 0,
        overallCompletion: 0,
        topPerformer: null,
      };
    }
    const totalStudents = players.length;
    const totalScore = players.reduce(
      (acc, player) => acc + (player.score || 0),
      0
    );
    const averageScore =
      totalStudents > 0 ? Math.round(totalScore / totalStudents) : 0;
    let totalQuizzesTaken = 0;
    let totalSubjectsCompleted = 0;
    players.forEach((p) => {
      totalQuizzesTaken += (p.completedSubjects || []).length;
      totalSubjectsCompleted += (p.completedSubjects || []).length;
    });
    const overallCompletion =
      totalStudents > 0
        ? Math.round(
            (totalSubjectsCompleted /
              (totalStudents * Object.keys(quizCategories).length)) *
              100
          )
        : 0;
    const topPerformer = [...players].sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    )[0];
    /** @type {{[key: string]: {completions: number, averageScore: number, mostFailedQuestions: [string, number][]}}} */
    const subjectStats = {};
    Object.keys(quizCategories).forEach((categoryKey) => {
      let completions = 0;
      let totalCorrect = 0;
      let totalQuestionsAnswered = 0;
      /** @type {{[key: string]: number}} */
      const questionFailureCounts = {};
      players.forEach((player) => {
        if (player.completedSubjects?.includes(categoryKey)) {
          completions++;
        }
        const subjectProgress = player.subjectProgress?.[categoryKey];
        if (subjectProgress && subjectProgress.total > 0) {
          totalCorrect += subjectProgress.correct;
          totalQuestionsAnswered += subjectProgress.total;
        }
        const weakQuestions = player.weakQuestions?.[categoryKey] || [];
        weakQuestions.forEach((q) => {
          questionFailureCounts[q.question] =
            (questionFailureCounts[q.question] || 0) + 1;
        });
      });
      const averageSubjectScore =
        totalQuestionsAnswered > 0
          ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
          : 0;
      const mostFailedQuestions = Object.entries(questionFailureCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      subjectStats[categoryKey] = {
        completions,
        averageScore: averageSubjectScore,
        mostFailedQuestions,
      };
    });
    return {
      totalStudents,
      averageScore,
      subjectStats,
      totalQuizzesTaken,
      overallCompletion,
      topPerformer,
    };
  }, [allPlayersProgress, quizCategories]);

  /** @param {PlayerProgress} playerProgress */
  const calculateAreasForImprovement = (playerProgress) => {
    /** @type {{name: string, status: string}[]} */
    const areas = [];
    const completed = playerProgress.completedSubjects || [];
    Object.keys(quizCategories).forEach((categoryKey) => {
      const subjectProgress = playerProgress.subjectProgress?.[categoryKey];
      if (subjectProgress && subjectProgress.total > 0) {
        const percentage =
          (subjectProgress.correct / subjectProgress.total) * 100;
        if (percentage < 60) {
          areas.push({
            name: categoryKey,
            status: `Low Score (${Math.round(percentage)}%)`,
          });
        }
      } else if (!completed.includes(categoryKey)) {
        areas.push({ name: categoryKey, status: "Not Attempted" });
      }
    });
    return areas;
  };

  const studentPlayers = Object.entries(allPlayersProgress).filter(
    ([name]) => name.toLowerCase() !== "admin"
  );

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 bg-gradient-to-br from-indigo-100 to-blue-200 min-h-screen">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-6xl w-full border border-indigo-200 animate-fade-in">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-indigo-700 mb-6 sm:mb-8 text-center">
          Student Progress Dashboard
        </h2>
        <button
          onClick={onBackToAdminPanel}
          className="mb-6 bg-gray-600 text-white py-2 px-4 text-base rounded-lg font-bold hover:bg-gray-700 transition flex items-center justify-center gap-2"
        >
          <SettingsIcon /> Back to Quiz Editor
        </button>
        <div className="mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
            Overall Statistics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center gap-4">
              <UserIcon className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-800">
                  {dashboardStats.totalStudents}
                </p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-center gap-4">
              <TrophyIcon className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-800">
                  {dashboardStats.averageScore}
                </p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-center gap-4">
              <BookOpenIcon className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-800">
                  {dashboardStats.totalQuizzesTaken}
                </p>
                <p className="text-sm text-gray-600">Quizzes Taken</p>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 flex items-center gap-4">
              <CheckCircleIcon className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-purple-800">
                  {dashboardStats.overallCompletion}%
                </p>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              Subject Performance
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border">
              {Object.entries(dashboardStats.subjectStats).map(
                ([category, stats]) => (
                  <div key={category} className="mb-2">
                    <p className="font-semibold">
                      {category}{" "}
                      <span className="text-sm text-gray-600">
                        ({stats.completions} completions)
                      </span>
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${stats.averageScore}%` }}
                      >
                        <span className="text-xs text-white pl-2">
                          {stats.averageScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              Subject Breakdown
            </h3>
            <div className="space-y-4">
              {Object.entries(dashboardStats.subjectStats).map(
                ([category, stats]) => (
                  <div
                    key={category}
                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                  >
                    <h4 className="text-lg font-bold text-gray-800">
                      {category}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Completions:{" "}
                      <span className="font-semibold">{stats.completions}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Avg. Score:{" "}
                      <span className="font-semibold">
                        {stats.averageScore}%
                      </span>
                    </p>
                    <div className="mt-2 pt-2 border-t">
                      <h5 className="text-xs font-bold text-red-700">
                        Most Difficult Questions:
                      </h5>
                      {stats.mostFailedQuestions.length > 0 ? (
                        <ul className="text-xs text-gray-700 list-decimal list-inside">
                          {stats.mostFailedQuestions.map(([q, count]) => (
                            <li key={q} className="truncate" title={q}>
                              {q} ({count} fails)
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-green-600 italic">
                          No specific issues found.
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
        {studentPlayers.length === 0 ? (
          <p className="text-center text-gray-600">
            No student data available yet.
          </p>
        ) : (
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 pt-4 border-t">
              Individual Student Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {studentPlayers.map(([name, progress]) => {
                const level = Math.floor((progress.score || 0) / 100) + 1;
                const areasToImprove = calculateAreasForImprovement(progress);
                return (
                  <div
                    key={name}
                    className="bg-gray-50 p-4 rounded-xl shadow-md border border-gray-200"
                  >
                    <div className="flex items-center mb-3">
                      <span className="text-3xl mr-3">
                        {progress.avatar || "😊"}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Level: {level} | Score: {progress.score || 0}
                        </p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-700">
                        Completed Subjects:
                      </h4>
                      {progress.completedSubjects &&
                      progress.completedSubjects.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {progress.completedSubjects.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">None yet</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-700">
                        Areas to Improve:
                      </h4>
                      {areasToImprove.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-red-600">
                          {areasToImprove.map((area) => (
                            <li key={area.name + area.status}>
                              {area.name}{" "}
                              <span className="italic opacity-80">
                                ({area.status})
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-green-600 italic">
                          Looking good!
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * @param {{
 * leaderboard: LeaderboardEntry[];
 * onBackToHome: () => void;
 * }} props
 */
const Leaderboard = ({ leaderboard, onBackToHome }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-green-100 to-blue-200 min-h-screen">
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl max-w-2xl w-full text-center border-4 border-green-300 animate-fade-in">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-green-700 mb-4 sm:mb-8 flex items-center justify-center gap-2 sm:gap-3">
          <TrophyIcon className="text-green-600 w-8 h-8 sm:w-10 sm:h-10" />
          Top Scores
        </h2>
        {leaderboard.length === 0 ? (
          <p className="text-sm sm:text-lg text-gray-600">
            No scores recorded yet. Be the first!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 w-full">
            {leaderboard.map((entry, index) => (
              <div
                key={index}
                className={`p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between border-2 ${
                  index === 0
                    ? "bg-yellow-100 border-yellow-400"
                    : index === 1
                    ? "bg-gray-100 border-gray-300"
                    : index === 2
                    ? "bg-orange-100 border-orange-300"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center">
                  <span className="text-xl sm:text-3xl font-bold text-green-700 mr-2 sm:mr-4 w-6 sm:w-10 text-center">
                    {index + 1}.
                  </span>
                  <span className="text-xl sm:text-3xl mr-1 sm:mr-2 animate-avatar-pop">
                    {entry.avatar}
                  </span>
                  <span className="text-base sm:text-xl font-semibold text-gray-800">
                    {entry.name}
                  </span>
                </div>
                <span className="text-lg sm:text-2xl font-bold text-green-900">
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onBackToHome}
          className="mt-6 sm:mt-8 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 text-lg sm:py-4 sm:px-8 sm:text-xl rounded-full font-bold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <HomeIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          Back to Home
        </button>
      </div>
    </div>
  );
};

/**
 * @param {{
 * reviewData: QuizSessionResult[] | null;
 * onBackToHome: () => void;
 * }} props
 */
const ReviewQuiz = ({ reviewData, onBackToHome }) => {
  if (!reviewData || reviewData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-red-50 to-orange-100 min-h-screen">
        <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-xl text-center border border-red-200">
          <h2 className="text-lg sm:text-2xl font-bold text-red-700 mb-2 sm:mb-4">
            No quiz data to review.
          </h2>
          <button
            onClick={onBackToHome}
            className="mt-3 sm:mt-4 bg-blue-500 text-white py-2 px-4 text-base sm:py-2 sm:px-4 sm:text-lg rounded-md"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-yellow-100 to-orange-200 min-h-screen">
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl max-w-4xl w-full border-4 border-yellow-300 animate-fade-in">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-orange-700 mb-4 sm:mb-8 text-center">
          Quiz Review
        </h2>
        {reviewData.map((result, index) => (
          <div
            key={index}
            className={`mb-4 sm:mb-6 p-4 sm:p-6 rounded-2xl shadow-md border-2 ${
              result.isCorrect
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <p className="text-base sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
              {index + 1}. {result.question}
            </p>
            {result.type === "multiple-choice" && result.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
                {result.options.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className={`p-2 sm:p-3 rounded-lg text-sm sm:text-lg ${
                      option === result.userAnswer && result.isCorrect
                        ? "bg-green-200 font-bold"
                        : ""
                    } ${
                      option === result.userAnswer && !result.isCorrect
                        ? "bg-red-200 font-bold"
                        : ""
                    } ${
                      option === result.correctAnswer && !result.isCorrect
                        ? "bg-green-100 border border-green-400"
                        : ""
                    } ${
                      option !== result.userAnswer &&
                      option !== result.correctAnswer
                        ? "bg-gray-100"
                        : ""
                    }`}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
            {result.type === "fill-in-the-blank" && (
              <div className="mb-2 sm:mb-3">
                <p className="text-sm sm:text-lg text-gray-700">
                  Your Answer:{" "}
                  <span
                    className={`font-bold ${
                      result.isCorrect ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {result.userAnswer || "[No Answer]"}
                  </span>
                </p>
              </div>
            )}
            {result.type === "true-false" && (
              <div className="mb-2 sm:mb-3 flex justify-center gap-2 sm:gap-3">
                <div
                  className={`p-2 sm:p-3 rounded-lg text-sm sm:text-lg flex-1 text-center ${
                    result.userAnswer === "True" && result.isCorrect
                      ? "bg-green-200 font-bold"
                      : ""
                  } ${
                    result.userAnswer === "True" && !result.isCorrect
                      ? "bg-red-200 font-bold"
                      : ""
                  } ${
                    result.correctAnswer === "True" && !result.isCorrect
                      ? "bg-green-100 border border-green-400"
                      : ""
                  } ${
                    result.userAnswer !== "True" &&
                    result.correctAnswer !== "True"
                      ? "bg-gray-100"
                      : ""
                  }`}
                >
                  True
                </div>
                <div
                  className={`p-2 sm:p-3 rounded-lg text-sm sm:text-lg flex-1 text-center ${
                    result.userAnswer === "False" && result.isCorrect
                      ? "bg-green-200 font-bold"
                      : ""
                  } ${
                    result.userAnswer === "False" && !result.isCorrect
                      ? "bg-red-200 font-bold"
                      : ""
                  } ${
                    result.correctAnswer === "False" && !result.isCorrect
                      ? "bg-green-100 border border-green-400"
                      : ""
                  } ${
                    result.userAnswer !== "False" &&
                    result.correctAnswer !== "False"
                      ? "bg-gray-100"
                      : ""
                  }`}
                >
                  False
                </div>
              </div>
            )}
            {!result.isCorrect && (
              <p className="text-sm sm:text-lg text-gray-700 mt-2">
                Correct Answer:{" "}
                <span className="font-bold text-green-700">
                  {result.correctAnswer}
                </span>
              </p>
            )}
            <p
              className={`text-xs sm:text-sm font-semibold mt-1.5 sm:mt-2 ${
                result.isCorrect ? "text-green-600" : "text-red-600"
              }`}
            >
              {result.isCorrect ? "Correct!" : "Incorrect."}
            </p>
          </div>
        ))}
        <button
          onClick={onBackToHome}
          className="mt-6 sm:mt-8 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 text-lg sm:py-4 sm:px-8 sm:text-xl rounded-full font-bold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <HomeIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          Back to Home
        </button>
      </div>
    </div>
  );
};

/**
 * @param {{
 * storyData: Story | null;
 * onBackToHome: () => void;
 * onStoryComplete: (storyTitle: string, badgeAwardId?: string) => void;
 * }} props
 */
const StoryReader = ({ storyData, onBackToHome, onStoryComplete }) => {
  const [currentPartIndex, setCurrentPartIndex] = useState(0);

  useEffect(() => {
    setCurrentPartIndex(0);
  }, [storyData]);

  if (!storyData || !storyData.parts || storyData.parts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-red-50 to-orange-100 min-h-screen">
        <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-xl text-center border border-red-200">
          <h2 className="text-lg sm:text-2xl font-bold text-red-700 mb-2 sm:mb-4">
            No story selected or story is empty.
          </h2>
          <button
            onClick={onBackToHome}
            className="mt-3 sm:mt-4 bg-blue-500 text-white py-2 px-4 text-base sm:py-2 sm:px-4 sm:text-lg rounded-md"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentPart = storyData.parts[currentPartIndex];
  const isLastPart = currentPartIndex === storyData.parts.length - 1;
  const hasChoices = currentPart.choices && currentPart.choices.length > 0;
  const isEndPart = currentPart.isEnd;

  const handleNextPart = () => {
    if (currentPartIndex < storyData.parts.length - 1) {
      setCurrentPartIndex((prevIndex) => prevIndex + 1);
    } else {
      onStoryComplete(storyData.title, currentPart.badgeAward);
    }
  };

  /**
   * @param {number} nextIndex
   * @param {string | undefined} badgeAward
   */
  const handleChoiceClick = (nextIndex, badgeAward) => {
    setCurrentPartIndex(nextIndex);
    if (badgeAward) {
      onStoryComplete(storyData.title, badgeAward);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-pink-100 to-purple-200 min-h-screen">
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl max-w-4xl w-full border-4 border-pink-300 animate-fade-in">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-pink-700 mb-4 sm:mb-8 text-center">
          {storyData.title}
        </h2>
        <div className="text-base sm:text-lg text-gray-800 leading-relaxed mb-6 sm:mb-8 whitespace-pre-wrap">
          {currentPart.text}
        </div>
        {hasChoices ? (
          <div className="flex flex-col gap-3 sm:gap-4">
            {currentPart.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() =>
                  handleChoiceClick(choice.nextPartIndex, choice.badgeAward)
                }
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 text-lg sm:py-4 sm:px-8 sm:text-xl rounded-full font-bold shadow-lg hover:from-blue-600 hover:to-purple-700 transition transform hover:scale-105"
              >
                {choice.text}
              </button>
            ))}
          </div>
        ) : (
          <>
            {!isEndPart && (
              <button
                onClick={handleNextPart}
                className="w-full bg-gradient-to-r from-teal-500 to-green-600 text-white py-3 px-6 text-lg sm:py-4 sm:px-8 sm:text-xl rounded-full font-bold shadow-lg hover:from-teal-600 hover:to-green-700 transition transform hover:scale-105"
              >
                Next
              </button>
            )}
            {(isEndPart || isLastPart) && (
              <button
                onClick={onBackToHome}
                className="mt-6 sm:mt-8 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 text-lg sm:py-4 sm:px-8 sm:text-xl rounded-full font-bold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <HomeIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                Back to Home
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/**
 * @param {{
 * userBadges: string[];
 * onBackToHome: () => void;
 * }} props
 */
const Achievements = ({ userBadges, onBackToHome }) => {
  const allPossibleBadges = [
    {
      id: "first_quiz",
      name: "First Step",
      description: "Complete your very first quiz!",
      icon: "🌟",
    },
    {
      id: "perfect_score",
      name: "Quiz Whiz",
      description: "Achieve a perfect score on any quiz!",
      icon: "💯",
    },
    {
      id: "general_knowledge_master",
      name: "General Knowledge Guru",
      description: "Master the General Knowledge subject!",
      icon: "🧠",
    },
    {
      id: "animals_master",
      name: "Animal Kingdom Expert",
      description: "Master the Animals subject!",
      icon: "🐾",
    },
    {
      id: "space_master",
      name: "Cosmic Explorer",
      description: "Master the Space subject!",
      icon: "🌌",
    },
    {
      id: "score_100",
      name: "Score Seeker (100)",
      description: "Reach a total score of 100 points!",
      icon: "🏆",
    },
    {
      id: "score_500",
      name: "Score Seeker (500)",
      description: "Reach a total score of 500 points!",
      icon: "🏅",
    },
    {
      id: "score_1000",
      name: "Score Seeker (1000)",
      description: "Reach a total score of 1000 points!",
      icon: "💎",
    },
    {
      id: "kindness_badge",
      name: "Kindness Champion",
      description: "Show kindness in a story!",
      icon: "💖",
    },
  ];

  const earnedBadgesData = allPossibleBadges.filter((badge) =>
    userBadges.includes(badge.id)
  );
  const unearnedBadgesData = allPossibleBadges.filter(
    (badge) => !userBadges.includes(badge.id)
  );

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-orange-100 min-h-screen">
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl max-w-4xl w-full border-4 border-yellow-300 animate-fade-in">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-orange-700 mb-4 sm:mb-8 text-center flex items-center justify-center gap-2 sm:gap-3">
          <GemIcon className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600" />
          Your Achievements
        </h2>
        {earnedBadgesData.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-3 sm:mb-4 text-left">
              Earned Badges ({earnedBadgesData.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {earnedBadgesData.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-green-50 p-4 sm:p-6 rounded-xl shadow-md border-2 border-green-300 text-center animate-pop-in"
                >
                  <p className="text-3xl sm:text-5xl mb-2 sm:mb-3">
                    {badge.icon}
                  </p>
                  <h4 className="text-base sm:text-xl font-bold text-green-800 mb-1 sm:mb-2">
                    {badge.name}
                  </h4>
                  <p className="text-xs sm:text-base text-gray-700">
                    {badge.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {unearnedBadgesData.length > 0 && (
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-3 sm:mb-4 text-left">
              Upcoming Badges ({unearnedBadgesData.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {unearnedBadgesData.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-gray-100 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 text-center opacity-70"
                >
                  <p className="text-3xl sm:text-5xl mb-2 sm:mb-3 grayscale">
                    {badge.icon}
                  </p>
                  <h4 className="text-base sm:text-xl font-bold text-gray-600 mb-1 sm:mb-2">
                    {badge.name}
                  </h4>
                  <p className="text-xs sm:text-base text-gray-500">
                    {badge.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {earnedBadgesData.length === 0 && unearnedBadgesData.length === 0 && (
          <p className="text-sm sm:text-lg text-gray-600 text-center">
            No badges defined yet.
          </p>
        )}
        <button
          onClick={onBackToHome}
          className="mt-6 sm:mt-8 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 text-lg sm:py-4 sm:px-8 sm:text-xl rounded-full font-bold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <HomeIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default function App() {
  /** @type {[string | null, React.Dispatch<React.SetStateAction<string|null>>]} */
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("😊");
  /** @type {[PlayerProgress | null, React.Dispatch<React.SetStateAction<PlayerProgress|null>>]} */
  const [currentPlayerProgress, setCurrentPlayerProgress] = useState(null);
  /** @type {[AllPlayersProgress, React.Dispatch<React.SetStateAction<AllPlayersProgress>>]} */
  const [allPlayersProgress, setAllPlayersProgress] = useState({});
  const [currentView, setCurrentView] = useState("nameInput");
  /** @type {[(QuizCategory & { categoryKey: string }) | null, React.Dispatch<React.SetStateAction<(QuizCategory & { categoryKey: string })|null>>]} */
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  /** @type {[string | null, React.Dispatch<React.SetStateAction<string|null>>]} */
  const [error, setError] = useState(null);
  /** @type {[LastQuizResult | null, React.Dispatch<React.SetStateAction<LastQuizResult|null>>]} */
  const [lastQuizResult, setLastQuizResult] = useState(null);
  /** @type {[LeaderboardEntry[], React.Dispatch<React.SetStateAction<LeaderboardEntry[]>>]} */
  const [leaderboard, setLeaderboard] = useState([]);
  /** @type {[QuizSessionResult[] | null, React.Dispatch<React.SetStateAction<QuizSessionResult[]|null>>]} */
  const [lastQuizReviewData, setLastQuizReviewData] = useState(null);
  /** @type {[Story | null, React.Dispatch<React.SetStateAction<Story|null>>]} */
  const [currentStoryData, setCurrentStoryData] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [streakData, setStreakData] = useState({
    count: 0,
    lastQuizDate: null,
  });
  const [showStreakModal, setShowStreakModal] = useState(false);

  const defaultQuizCategories = useMemo(
    /** @returns {QuizCategories} */
    () => ({
      "General Knowledge": {
        title: "General Knowledge Quiz",
        prerequisites: [],
        mapPosition: { top: "10%", left: "10%" },
        questions: [
          {
            type: "multiple-choice",
            question: "What is the capital of France?",
            options: ["Berlin", "Madrid", "Paris", "Rome"],
            correctAnswer: "Paris",
            points: 15,
            timeLimit: 15,
          },
          {
            type: "fill-in-the-blank",
            question: "The largest planet in our solar system is ___.",
            correctAnswer: "Jupiter",
            points: 20,
            timeLimit: 15,
          },
          {
            type: "multiple-choice",
            question: "Which planet is known as the Red Planet?",
            imageUrl:
              "https://placehold.co/300x200/FF5733/FFFFFF?text=Mars+Planet",
            options: ["Earth", "Mars", "Jupiter", "Venus"],
            correctAnswer: "Mars",
            points: 15,
            timeLimit: 15,
          },
          {
            type: "true-false",
            question: "The Earth is flat.",
            correctAnswer: "False",
            points: 10,
            timeLimit: 10,
          },
          {
            type: "multiple-choice",
            question: "What is the largest ocean on Earth?",
            options: ["Atlantic", "Indian", "Arctic", "Pacific"],
            correctAnswer: "Pacific",
            points: 15,
            timeLimit: 15,
          },
        ],
      },
      Animals: {
        title: "Animal Kingdom Quiz",
        prerequisites: ["General Knowledge"],
        mapPosition: { top: "30%", left: "40%" },
        questions: [
          {
            type: "multiple-choice",
            question: "Which animal is known as the 'King of the Jungle'?",
            imageUrl: "https://placehold.co/300x200/DAA520/FFFFFF?text=Lion",
            options: ["Tiger", "Lion", "Elephant", "Bear"],
            correctAnswer: "Lion",
            points: 15,
            timeLimit: 15,
          },
          {
            type: "fill-in-the-blank",
            question: "A baby kangaroo is called a ___.",
            correctAnswer: "joey",
            points: 20,
            timeLimit: 15,
          },
          {
            type: "multiple-choice",
            question:
              "Which bird is known for its ability to mimic human speech?",
            options: ["Eagle", "Penguin", "Parrot", "Ostrich"],
            correctAnswer: "Parrot",
            points: 15,
            timeLimit: 15,
          },
          {
            type: "true-false",
            question: "Bats are blind.",
            correctAnswer: "False",
            points: 10,
            timeLimit: 10,
          },
          {
            type: "fill-in-the-blank",
            question: "The fastest land animal is the ___.",
            correctAnswer: "cheetah",
            points: 20,
            timeLimit: 15,
          },
        ],
      },
      Space: {
        title: "Space Exploration Quiz",
        prerequisites: ["Animals"],
        mapPosition: { top: "60%", left: "20%" },
        questions: [
          {
            type: "multiple-choice",
            question: "What is the name of our galaxy?",
            imageUrl:
              "https://placehold.co/300x200/8A2BE2/FFFFFF?text=Milky+Way",
            options: ["Andromeda", "Triangulum", "Milky Way", "Sombrero"],
            correctAnswer: "Milky Way",
            points: 15,
            timeLimit: 15,
          },
          {
            type: "fill-in-the-blank",
            question: "The first person to walk on the moon was ___.",
            correctAnswer: "Neil Armstrong",
            points: 20,
            timeLimit: 15,
          },
          {
            type: "multiple-choice",
            question: "Which planet is closest to the Sun?",
            options: ["Earth", "Mars", "Venus", "Mercury"],
            correctAnswer: "Mercury",
            points: 15,
            timeLimit: 15,
          },
          {
            type: "true-false",
            question: "Pluto is still considered a planet.",
            correctAnswer: "False",
            points: 10,
            timeLimit: 10,
          },
          {
            type: "multiple-choice",
            question: "What is a black hole?",
            imageUrl:
              "https://placehold.co/300x200/000000/FFFFFF?text=Black+Hole",
            options: [
              "A star that has exploded",
              "A region of spacetime where gravity is so strong that nothing, not even light, can escape",
              "A type of galaxy",
              "A dark nebula",
            ],
            correctAnswer:
              "A region of spacetime where gravity is so strong that nothing, not even light, can escape",
            points: 25,
            timeLimit: 20,
          },
        ],
      },
    }),
    []
  );

  const sampleStories = useMemo(
    /** @returns {Story[]} */
    () => [
      {
        title: "The Enchanted Forest",
        parts: [
          {
            text: "You stand at the edge of the Whispering Woods. A faint path leads deeper into the trees, while a sparkling river flows to your right. Which way do you go?",
            choices: [
              { text: "Follow the path into the woods", nextPartIndex: 1 },
              { text: "Follow the river downstream", nextPartIndex: 2 },
            ],
          },
          {
            text: "The woods grow dark and mysterious. You hear a rustling in the bushes. Do you investigate or hide?",
            choices: [
              { text: "Investigate the sound", nextPartIndex: 3 },
              { text: "Hide behind a large tree", nextPartIndex: 4 },
            ],
          },
          {
            text: "The river sparkles under the sun. You find a small, abandoned boat tied to a tree. Do you take the boat or continue walking along the bank?",
            choices: [
              { text: "Take the boat", nextPartIndex: 5 },
              { text: "Continue walking", nextPartIndex: 6 },
            ],
          },
          {
            text: "You bravely investigate and find a lost baby unicorn! You gently guide it back to its parents. You gain a 'Kindness' badge! (End of story)",
            isEnd: true,
            badgeAward: "kindness_badge",
          },
          {
            text: "You hide quietly. A grumpy bear lumbers past, oblivious to your presence. You successfully avoided danger! (End of story)",
            isEnd: true,
          },
          {
            text: "You sail down the river. The boat leads you to a hidden waterfall with a sparkling cave behind it. You discover a secret! (End of story)",
            isEnd: true,
          },
          {
            text: "You walk along the river bank and find a beautiful, rare flower. You learn about its magical properties! (End of story)",
            isEnd: true,
          },
        ],
      },
    ],
    []
  );

  /** @type {[QuizCategories, React.Dispatch<React.SetStateAction<QuizCategories>>]} */
  const [dynamicQuizCategories, setDynamicQuizCategories] = useState({});

  useEffect(() => {
    try {
      let storedUserId = localStorage.getItem("userId");
      if (!storedUserId) {
        storedUserId = crypto.randomUUID();
        localStorage.setItem("userId", storedUserId);
      }
      setUserId(storedUserId);

      const storedAllPlayersProgress = JSON.parse(
        localStorage.getItem("allPlayersProgress") || "{}"
      );
      setAllPlayersProgress(storedAllPlayersProgress);

      const storedDynamicQuizCategories = JSON.parse(
        localStorage.getItem("dynamicQuizCategories") || "{}"
      );
      if (Object.keys(storedDynamicQuizCategories).length > 0) {
        setDynamicQuizCategories(storedDynamicQuizCategories);
      } else {
        setDynamicQuizCategories(defaultQuizCategories);
        localStorage.setItem(
          "dynamicQuizCategories",
          JSON.stringify(defaultQuizCategories)
        );
      }

      const storedUserName = localStorage.getItem("userName");
      const storedUserAvatar = localStorage.getItem("userAvatar") || "😊";

      if (storedUserName) {
        setUserName(storedUserName);
        setUserAvatar(storedUserAvatar);
        const initialPlayerProgress = storedAllPlayersProgress[
          storedUserName
        ] || {
          score: 0,
          completedSubjects: [],
          subjectProgress: {},
          badges: [],
          weakQuestions: {},
        };
        setCurrentPlayerProgress(initialPlayerProgress);
        setCurrentView("home");
      } else {
        setCurrentView("nameInput");
      }

      const storedLeaderboard = JSON.parse(
        localStorage.getItem("leaderboard") || "[]"
      );
      setLeaderboard(
        storedLeaderboard.sort((a, b) => b.score - a.score).slice(0, 30)
      );
      setLoading(false);
    } catch (e) {
      setError("Failed to load app data.");
      setLoading(false);
    }
  }, [defaultQuizCategories]);

  const handleNameSubmit = useCallback(
    /**
     * @param {string} name
     * @param {string} avatar
     */
    (name, avatar) => {
      setUserName(name);
      setUserAvatar(avatar);
      localStorage.setItem("userName", name);
      localStorage.setItem("userAvatar", avatar);

      const playerProgressForSession = allPlayersProgress[name] || {
        score: 0,
        completedSubjects: [],
        subjectProgress: {},
        badges: [],
        weakQuestions: {},
        streak: 0,
        lastQuizDate: null,
      };

      const updatedAllPlayersProgress = {
        ...allPlayersProgress,
        [name]: playerProgressForSession,
      };
      setAllPlayersProgress(updatedAllPlayersProgress);
      localStorage.setItem(
        "allPlayersProgress",
        JSON.stringify(updatedAllPlayersProgress)
      );
      setCurrentPlayerProgress(playerProgressForSession);
      setCurrentView("home");
    },
    [allPlayersProgress]
  );

  const handleChangePlayer = useCallback(() => {
    setUserName("");
    setUserAvatar("😊");
    setCurrentPlayerProgress(null);
    setLastQuizResult(null);
    setLastQuizReviewData(null);
    setCurrentView("nameInput");
  }, []);

  const handleSelectQuiz = useCallback(
    /** @param {string} category */
    (category) => {
      setQuizData({
        ...dynamicQuizCategories[category],
        categoryKey: category,
      });
      setLastQuizResult(null);
      setLastQuizReviewData(null);
      setCurrentView("quiz");
    },
    [dynamicQuizCategories]
  );

  const handleQuizComplete = useCallback(
    (
      pointsGainedInQuiz,
      completedSubjectKey,
      correctAnswersCount,
      totalQuestionsCount,
      quizResultsForReview
    ) => {
      const today = new Date().toISOString().split("T")[0];
      let newProgress = { ...currentPlayerProgress };
      let streak = newProgress.streak || 0;
      const lastDate = newProgress.lastQuizDate;
      if (lastDate) {
        const last = new Date(lastDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (
          last.toISOString().split("T")[0] ===
          yesterday.toISOString().split("T")[0]
        ) {
          streak++;
        } else if (last.toISOString().split("T")[0] !== today) {
          streak = 1;
        }
      } else {
        streak = 1;
      }
      newProgress.streak = streak;
      newProgress.lastQuizDate = today;

      if (streak > 1) {
        pointsGainedInQuiz += streak * 5;
        setShowStreakModal(true);
        setStreakData({ count: streak, lastQuizDate: today });
      }

      const isReviewQuiz = completedSubjectKey === "Personalized Review";
      let updatedWeakQuestions = { ...(newProgress.weakQuestions || {}) };
      quizResultsForReview.forEach((result) => {
        const categoryOfQuestion =
          result.originalCategory || completedSubjectKey;
        if (!updatedWeakQuestions[categoryOfQuestion]) {
          updatedWeakQuestions[categoryOfQuestion] = [];
        }
        if (isReviewQuiz && result.isCorrect) {
          updatedWeakQuestions[categoryOfQuestion] = updatedWeakQuestions[
            categoryOfQuestion
          ].filter((q) => q.question !== result.question);
        } else if (!isReviewQuiz && !result.isCorrect) {
          const isAlreadyWeak = updatedWeakQuestions[categoryOfQuestion].some(
            (q) => q.question === result.question
          );
          if (!isAlreadyWeak) {
            updatedWeakQuestions[categoryOfQuestion].push({
              ...result,
              originalCategory: categoryOfQuestion,
            });
          }
        }
      });
      newProgress.weakQuestions = updatedWeakQuestions;

      if (!isReviewQuiz) {
        const updatedSubjectProgress = { ...newProgress.subjectProgress };
        updatedSubjectProgress[completedSubjectKey] = {
          correct: correctAnswersCount,
          total: totalQuestionsCount,
        };
        newProgress.subjectProgress = updatedSubjectProgress;

        let updatedCompletedSubjects = [
          ...(newProgress.completedSubjects || []),
        ];
        if (!updatedCompletedSubjects.includes(completedSubjectKey)) {
          updatedCompletedSubjects.push(completedSubjectKey);
        }
        newProgress.completedSubjects = updatedCompletedSubjects;
      }

      const newTotalScore = (newProgress.score || 0) + pointsGainedInQuiz;
      newProgress.score = newTotalScore;

      if (!isReviewQuiz) {
        let updatedBadges = [...(newProgress.badges || [])];
        if (!updatedBadges.includes("first_quiz")) {
          updatedBadges.push("first_quiz");
        }
        if (
          correctAnswersCount === totalQuestionsCount &&
          totalQuestionsCount > 0 &&
          !updatedBadges.includes("perfect_score")
        ) {
          updatedBadges.push("perfect_score");
        }
        const masterBadgeId = `${completedSubjectKey
          .toLowerCase()
          .replace(/\s/g, "_")}_master`;
        if (
          correctAnswersCount === totalQuestionsCount &&
          !updatedBadges.includes(masterBadgeId)
        ) {
          updatedBadges.push(masterBadgeId);
        }
        if (newTotalScore >= 100 && !updatedBadges.includes("score_100"))
          updatedBadges.push("score_100");
        if (newTotalScore >= 500 && !updatedBadges.includes("score_500"))
          updatedBadges.push("score_500");
        if (newTotalScore >= 1000 && !updatedBadges.includes("score_1000"))
          updatedBadges.push("score_1000");
        newProgress.badges = updatedBadges;
      }

      setCurrentPlayerProgress(newProgress);
      const updatedAllPlayersProgress = {
        ...allPlayersProgress,
        [userName]: newProgress,
      };
      setAllPlayersProgress(updatedAllPlayersProgress);
      localStorage.setItem(
        "allPlayersProgress",
        JSON.stringify(updatedAllPlayersProgress)
      );

      let updatedLeaderboard = leaderboard.filter(
        (entry) => entry.name !== userName
      );
      updatedLeaderboard.push({
        name: userName,
        score: newTotalScore,
        avatar: userAvatar,
      });
      setLeaderboard(
        updatedLeaderboard.sort((a, b) => b.score - a.score).slice(0, 30)
      );
      localStorage.setItem("leaderboard", JSON.stringify(updatedLeaderboard));

      setLastQuizResult({
        score: newTotalScore,
        pointsGained: pointsGainedInQuiz,
        quizType: completedSubjectKey,
      });
      setLastQuizReviewData(quizResultsForReview);
      setCurrentView("home");
    },
    [
      leaderboard,
      userName,
      allPlayersProgress,
      currentPlayerProgress,
      userAvatar,
    ]
  );

  const handleStoryComplete = useCallback(
    (storyTitle, badgeAwardId) => {
      if (badgeAwardId && currentPlayerProgress) {
        let updatedBadges = [...(currentPlayerProgress.badges || [])];
        if (!updatedBadges.includes(badgeAwardId)) {
          updatedBadges.push(badgeAwardId);
          const newCurrentPlayerProgress = {
            ...currentPlayerProgress,
            badges: updatedBadges,
          };
          setCurrentPlayerProgress(newCurrentPlayerProgress);
          const updatedAllPlayersProgress = {
            ...allPlayersProgress,
            [userName]: newCurrentPlayerProgress,
          };
          setAllPlayersProgress(updatedAllPlayersProgress);
          localStorage.setItem(
            "allPlayersProgress",
            JSON.stringify(updatedAllPlayersProgress)
          );
        }
      }
      setCurrentView("home");
    },
    [currentPlayerProgress, allPlayersProgress, userName]
  );

  const handleStartPersonalizedReview = useCallback(() => {
    const weakQuestionsByCategory = currentPlayerProgress?.weakQuestions || {};
    let allWeakQuestions = [];
    for (const category in weakQuestionsByCategory) {
      allWeakQuestions = allWeakQuestions.concat(
        weakQuestionsByCategory[category]
      );
    }
    if (allWeakQuestions.length > 0) {
      const reviewQuizData = {
        title: "Personalized Review",
        categoryKey: "Personalized Review",
        questions: shuffleArray(allWeakQuestions),
        prerequisites: [],
        mapPosition: { top: "", left: "" },
      };
      setQuizData(reviewQuizData);
      setLastQuizResult(null);
      setLastQuizReviewData(null);
      setCurrentView("quiz");
    }
  }, [currentPlayerProgress]);

  const handleShowLeaderboard = useCallback(() => {
    setCurrentView("leaderboard");
  }, []);
  const handleBackToHome = useCallback(() => {
    setCurrentView("home");
  }, []);
  const handleShowReview = useCallback(() => {
    setCurrentView("reviewQuiz");
  }, []);
  const handleShowStory = useCallback((story) => {
    setCurrentStoryData(story);
    setCurrentView("storyReader");
  }, []);
  const handleShowAchievements = useCallback(() => {
    setCurrentView("achievements");
  }, []);
  const handleUpdateDynamicQuizCategories = useCallback((updatedCategories) => {
    setDynamicQuizCategories(updatedCategories);
    localStorage.setItem(
      "dynamicQuizCategories",
      JSON.stringify(updatedCategories)
    );
  }, []);
  const handleShowAdminPanel = useCallback(() => {
    setCurrentView("adminPanel");
  }, []);
  const handleShowAdminDashboard = useCallback(() => {
    setCurrentView("adminDashboard");
  }, []);
  const handleResetAllData = useCallback(() => {
    setShowResetModal(true);
  }, []);
  const confirmResetAllData = useCallback(() => {
    localStorage.removeItem("leaderboard");
    setLeaderboard([]);
    localStorage.removeItem("allPlayersProgress");
    setAllPlayersProgress({});
    setCurrentPlayerProgress(null);
    localStorage.removeItem("userName");
    localStorage.removeItem("userAvatar");
    setUserName("");
    setUserAvatar("😊");
    localStorage.setItem(
      "dynamicQuizCategories",
      JSON.stringify(defaultQuizCategories)
    );
    setDynamicQuizCategories(defaultQuizCategories);
    setLastQuizResult(null);
    setLastQuizReviewData(null);
    setShowResetModal(false);
    setCurrentView("nameInput");
  }, [defaultQuizCategories]);

  const weakQuestionsCount = useMemo(() => {
    if (!currentPlayerProgress || !currentPlayerProgress.weakQuestions)
      return 0;
    return Object.values(currentPlayerProgress.weakQuestions).reduce(
      (acc, questions) => acc + questions.length,
      0
    );
  }, [currentPlayerProgress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <GlobalStyles />
        <div className="text-2xl font-semibold text-gray-700">
          Loading app...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100">
        <GlobalStyles />
        <div className="text-2xl font-semibold text-red-700 p-4 rounded-lg border border-red-300 bg-white shadow-md">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <GlobalStyles />
      <BuyMeACoffeeWidget />
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Reset</h3>
            <p>
              Are you sure you want to reset all player data and custom quizzes?
            </p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowResetModal(false)}
                className="bg-gray-200 py-2 px-4 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetAllData}
                className="bg-red-500 text-white py-2 px-4 rounded-lg font-bold"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
      {showStreakModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
            <h3 className="text-2xl font-bold text-yellow-500 mb-4">
              🔥 {streakData.count}-Day Streak!
            </h3>
            <p>
              You've earned {streakData.count * 5} bonus points for your
              consistency!
            </p>
            <button
              onClick={() => setShowStreakModal(false)}
              className="mt-6 bg-blue-500 text-white py-2 px-6 rounded-lg font-bold"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
      {(() => {
        switch (currentView) {
          case "nameInput":
            return (
              <NameInput
                onNameSubmit={handleNameSubmit}
                existingName={userName}
                existingAvatar={userAvatar}
              />
            );
          case "home":
            return (
              <Home
                key={userName}
                onSelectQuiz={handleSelectQuiz}
                userId={userId}
                lastQuizResult={lastQuizResult}
                quizCategories={dynamicQuizCategories}
                onShowLeaderboard={handleShowLeaderboard}
                userProgress={currentPlayerProgress}
                userName={userName}
                onChangePlayer={handleChangePlayer}
                onResetLeaderboard={handleResetAllData}
                onShowAdminPanel={handleShowAdminPanel}
                onShowAdminDashboard={handleShowAdminDashboard}
                userAvatar={userAvatar}
                onShowReview={handleShowReview}
                lastQuizReviewData={lastQuizReviewData}
                onShowStory={handleShowStory}
                stories={sampleStories}
                onShowAchievements={handleShowAchievements}
                onStartPersonalizedReview={handleStartPersonalizedReview}
                weakQuestionsCount={weakQuestionsCount}
              />
            );
          case "quiz":
            return quizData ? (
              <Quiz
                quizData={quizData}
                onQuizComplete={handleQuizComplete}
                userAvatar={userAvatar}
              />
            ) : null;
          case "leaderboard":
            return (
              <Leaderboard
                leaderboard={leaderboard}
                onBackToHome={handleBackToHome}
              />
            );
          case "adminPanel":
            return (
              <AdminPanel
                quizCategories={dynamicQuizCategories}
                onUpdateQuizCategories={handleUpdateDynamicQuizCategories}
                onBackToHome={handleBackToHome}
                onShowDashboard={handleShowAdminDashboard}
              />
            );
          case "adminDashboard":
            return (
              <AdminDashboard
                allPlayersProgress={allPlayersProgress}
                quizCategories={dynamicQuizCategories}
                onBackToAdminPanel={handleShowAdminPanel}
              />
            );
          case "reviewQuiz":
            return (
              <ReviewQuiz
                reviewData={lastQuizReviewData}
                onBackToHome={handleBackToHome}
              />
            );
          case "storyReader":
            return (
              <StoryReader
                storyData={currentStoryData}
                onBackToHome={handleBackToHome}
                onStoryComplete={handleStoryComplete}
              />
            );
          case "achievements":
            return (
              <Achievements
                userBadges={currentPlayerProgress?.badges || []}
                onBackToHome={handleBackToHome}
              />
            );
          default:
            return null;
        }
      })()}
      <AppFooter />
    </>
  );
}
