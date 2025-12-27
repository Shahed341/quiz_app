## 1. AI Prompt

> "Convert this text into two JSON structures: a **Quiz** and a **Flashcard Set**. Follow the schemas below strictly. Use exactly 4 options for quizzes. Provide raw JSON only."


## 2. JSON Schemas

### Quiz (`-quiz.json`)

```json
{
  "quiz": { "title": "Title", "description": "Desc" },
  "questions": [
    {
      "question_text": "Text?",
      "option_a": "A", "option_b": "B", "option_c": "C", "option_d": "D",
      "correct_answer": "A", "hint": "Clue"
    }
  ]
}


### Flashcard (`-flash.json`)

```json
{
  "set": { "title": "Title", "description": "Desc" },
  "cards": [
    { "front": "Q", "back": "A", "hint": "Clue", "difficulty": "medium" }
  ]
}


## 3. Storage Rules

### Folder Structure

* Location: `/Courses/[category-name]/`
* Naming: Quizzes must end in `-quiz.json`
* Flashcards must end in `-flash.json`


* Sync: Restart the backend server (`node server.js`) to trigger the database upload.