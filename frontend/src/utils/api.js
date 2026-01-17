/**
 * SCHOLAR DRIVE - CORE API UTILITY
 * Interface between the Academic Void Frontend and the Node.js Materialization Engine.
 */

const API_BASE = "http://localhost:5000/api";

/**
 * GENERIC REQUEST ENGINE
 * Handles JSON headers, base URL injection, and standardized error catching.
 */
export const request = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Void Communication Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`🔴 API FAILURE [${endpoint}]:`, error.message);
    throw error; 
  }
};

// --- 1. SYSTEM & SYNC OPERATIONS ---

/** Forces a physical disk scan of I:/Scholar_Drive and syncs with MySQL */
export const syncFiles = () => request('/sync/all', { method: 'POST' });


// --- 2. DASHBOARD & ANALYTICS ---

/** Fetches global statistics for the Dashboard (Counts, Mastery %, etc.) */
export const getStats = () => request('/stats'); 

/** Searches all modules, courses, and cards via query string */
export const searchDatabase = (query) => request(`/search?q=${query}`);

/** Retrieves the full attempt registry for the History Page */
export const getFullHistoryRegistry = () => request(`/stats/full-history?t=${Date.now()}`);


// --- 3. COURSE MANAGEMENT ---

export const getCourses = () => request('/courses');
export const getCourseBySlug = (slug) => request(`/courses/${slug}`);
export const createCourse = (data) => request('/courses', { method: 'POST', body: JSON.stringify(data) });
export const updateCourse = (id, data) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCourse = (id) => request(`/courses/${id}`, { method: 'DELETE' });


// --- 4. QUIZ ENGINE ---

/** Retrieves a full quiz structure by UID */
export const getQuiz = (uid) => request(`/quizzes/${uid}`);

/** Saves a full quiz payload (Used by QuizEditor for initial materialization) */
export const saveFullQuiz = (quizData) => 
  request('/quizzes/save', {
    method: 'POST',
    body: JSON.stringify(quizData)
  });

/** * NEW: Create Individual Segment
 * Used when clicking the '+' in QuizPlayer to add a question to an existing quiz.
 */
export const createIndividualQuestion = (quizId, questionData) =>
  request(`/quizzes/${quizId}/questions`, {
    method: 'POST',
    body: JSON.stringify(questionData)
  });

/** * NEW: Update Existing Segment
 * Used for inline edits in QuizPlayer. Resolves 404/500 errors on specific segments.
 */
export const updateIndividualQuestion = (questionId, questionData) =>
  request(`/quizzes/questions/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(questionData)
  });

/** Moves a quiz to the Archive Vault */
export const deleteQuiz = (id) => request(`/quizzes/${id}`, { method: 'DELETE' });

/** Logs a session score and updates the user's daily streak */
export const saveQuizResult = (quizId, score, totalItems) => 
  request('/quizzes/save-result', {
    method: 'POST',
    body: JSON.stringify({ quizId, score, totalItems })
  });

/** Fetches history registry for a specific quiz (Used in CourseDetail modals) */
export const getQuizHistory = (id) => request(`/quizzes/${id}/history`);


// --- 5. FLASHCARD & SPACED REPETITION ENGINE ---

export const getFlashcards = (uid) => request(`/flashcards/${uid}`);

/** Upserts a single flashcard and triggers physical I: Drive sync */
export const saveFlashcard = (setId, cardData) => 
  request(`/flashcards/${setId}/save-card`, {
    method: 'POST',
    body: JSON.stringify(cardData)
  });

/** Updates Leitner System rating (1-5 scale) to adjust review intervals */
export const updateMastery = (cardId, rating) => 
  request('/flashcards/mastery', {
    method: 'POST',
    body: JSON.stringify({ card_id: cardId, rating })
  });

/** Archives a full concept cluster set */
export const deleteFlashcardSet = (id) => request(`/flashcard-sets/${id}`, { method: 'DELETE' });

/** Archives a single card segment from a set */
export const deleteSingleFlashcard = (setId, cardId) => 
  request(`/flashcards/${setId}/cards/${cardId}`, { method: 'DELETE' });


// --- 6. GEMINI AI GENERATION ---

export const generateAiQuiz = (topic, courseId) => 
  request('/ai/generate-quiz', {
    method: 'POST',
    body: JSON.stringify({ topic, courseId })
  });

export const generateAiFlashcards = (topic, courseId) => 
  request('/ai/generate-flashcards', {
    method: 'POST',
    body: JSON.stringify({ topic, courseId })
  });


// --- 7. ARCHIVE VAULT ---

/** Retrieves all soft-deleted items (Recycle Bin) */
export const getArchiveItems = () => request('/archive');

/** Restores an archived item back to active library */
export const restoreArchiveItem = (type, id) => 
  request('/archive/restore', {
    method: 'POST',
    body: JSON.stringify({ type, id })
  });

/** Permanently purges an item from Scholar Drive and MySQL */
export const purgeArchiveItem = (type, id) => 
  request('/archive/permanent', {
    method: 'DELETE',
    body: JSON.stringify({ type, id })
  });