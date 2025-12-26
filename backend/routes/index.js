// routes/index.js
import { Router } from "express";
import {
  getCourses,
  getLectures,
  getQuiz,
  getFlashcards,
  saveQuiz,
  saveFlashcards,
} from "../controllers/course.controller.js";

const router = Router();

router.get("/courses", getCourses);
router.get("/courses/:course/lectures", getLectures);
router.get("/courses/:course/:lecture/quiz", getQuiz);
router.get("/courses/:course/:lecture/flashcards", getFlashcards);
router.post("/courses/:course/:lecture/quiz", saveQuiz);
router.post("/courses/:course/:lecture/flashcards", saveFlashcards);

export default router;
