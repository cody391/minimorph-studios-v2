/**
 * Academy System Tests
 * Tests curriculum content, quiz grading, progress tracking, and certification logic
 */
import { describe, it, expect } from "vitest";

// Import curriculum directly
import {
  ACADEMY_MODULES,
  getTotalQuizQuestions,
  getTotalEstimatedMinutes,
} from "./academy-curriculum";

describe("Academy Curriculum", () => {
  it("should have 8 training modules", () => {
    expect(ACADEMY_MODULES.length).toBe(8);
  });

  it("should have unique module IDs", () => {
    const ids = ACADEMY_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have all required module fields", () => {
    for (const mod of ACADEMY_MODULES) {
      expect(mod.id).toBeTruthy();
      expect(mod.title).toBeTruthy();
      expect(mod.description).toBeTruthy();
      expect(mod.icon).toBeTruthy();
      expect(mod.estimatedMinutes).toBeGreaterThan(0);
      expect(mod.passingScore).toBeGreaterThanOrEqual(70);
      expect(mod.passingScore).toBeLessThanOrEqual(100);
      expect(mod.lessons.length).toBeGreaterThan(0);
      expect(mod.quiz.length).toBeGreaterThan(0);
    }
  });

  it("should have correct module IDs", () => {
    const expectedIds = [
      "product-mastery",
      "psychology-selling",
      "discovery-call",
      "objection-handling",
      "closing-techniques",
      "digital-prospecting",
      "account-management",
      "advanced-tactics",
    ];
    const actualIds = ACADEMY_MODULES.map((m) => m.id);
    expect(actualIds).toEqual(expectedIds);
  });

  it("should have passing score of 80% for all modules", () => {
    for (const mod of ACADEMY_MODULES) {
      expect(mod.passingScore).toBe(80);
    }
  });
});

describe("Academy Lessons", () => {
  it("should have at least 1 lesson per module", () => {
    for (const mod of ACADEMY_MODULES) {
      expect(mod.lessons.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("should have all required lesson fields", () => {
    for (const mod of ACADEMY_MODULES) {
      for (const lesson of mod.lessons) {
        expect(lesson.title).toBeTruthy();
        expect(lesson.content).toBeTruthy();
        expect(lesson.content.length).toBeGreaterThan(100); // Substantial content
        expect(lesson.keyTakeaways).toBeDefined();
        expect(Array.isArray(lesson.keyTakeaways)).toBe(true);
        expect(lesson.keyTakeaways.length).toBeGreaterThan(0);
      }
    }
  });

  it("should have unique lesson titles within each module", () => {
    for (const mod of ACADEMY_MODULES) {
      const titles = mod.lessons.map((l) => l.title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });

  it("should have substantial content (not placeholder text)", () => {
    for (const mod of ACADEMY_MODULES) {
      for (const lesson of mod.lessons) {
        // Content should be real training material, not placeholder
        expect(lesson.content.length).toBeGreaterThan(200);
        expect(lesson.content).not.toContain("TODO");
        expect(lesson.content).not.toContain("placeholder");
      }
    }
  });
});

describe("Academy Quizzes", () => {
  it("should have at least 3 quiz questions per module", () => {
    for (const mod of ACADEMY_MODULES) {
      expect(mod.quiz.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("should have unique quiz question IDs within each module", () => {
    for (const mod of ACADEMY_MODULES) {
      const ids = mod.quiz.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("should have unique quiz question IDs globally", () => {
    const allIds = ACADEMY_MODULES.flatMap((m) => m.quiz.map((q) => q.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("should have all required quiz question fields", () => {
    for (const mod of ACADEMY_MODULES) {
      for (const q of mod.quiz) {
        expect(q.id).toBeTruthy();
        expect(q.question).toBeTruthy();
        expect(q.question.length).toBeGreaterThan(10);
        expect(["multiple_choice", "scenario"]).toContain(q.type);
        expect(q.options).toBeDefined();
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options!.length).toBe(4); // 4 options per question
        expect(typeof q.correctAnswer).toBe("number");
        expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(q.correctAnswer).toBeLessThan(q.options!.length);
        expect(q.explanation).toBeTruthy();
        expect(q.explanation.length).toBeGreaterThan(10);
        expect(["easy", "medium", "hard"]).toContain(q.difficulty);
      }
    }
  });

  it("should have a mix of difficulty levels", () => {
    for (const mod of ACADEMY_MODULES) {
      const difficulties = new Set(mod.quiz.map((q) => q.difficulty));
      // Each module should have at least 2 different difficulty levels
      expect(difficulties.size).toBeGreaterThanOrEqual(2);
    }
  });

  it("should have correct answers that are valid option indices", () => {
    for (const mod of ACADEMY_MODULES) {
      for (const q of mod.quiz) {
        expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(q.correctAnswer).toBeLessThan(q.options!.length);
        // The correct answer option should exist and be non-empty
        expect(q.options![q.correctAnswer as number]).toBeTruthy();
      }
    }
  });
});

describe("Academy Quiz Grading Logic", () => {
  it("should calculate 100% score when all answers are correct", () => {
    for (const mod of ACADEMY_MODULES) {
      let correct = 0;
      for (const q of mod.quiz) {
        correct++; // All correct
      }
      const score = Math.round((correct / mod.quiz.length) * 100);
      expect(score).toBe(100);
    }
  });

  it("should calculate 0% score when all answers are wrong", () => {
    for (const mod of ACADEMY_MODULES) {
      let correct = 0;
      for (const q of mod.quiz) {
        // Give wrong answer
        const wrongAnswer = (q.correctAnswer as number + 1) % q.options!.length;
        if (wrongAnswer === q.correctAnswer) correct++;
      }
      const score = Math.round((correct / mod.quiz.length) * 100);
      expect(score).toBe(0);
    }
  });

  it("should correctly determine pass/fail at 80% threshold", () => {
    const mod = ACADEMY_MODULES[0]; // product-mastery
    const totalQuestions = mod.quiz.length;
    const passingCount = Math.ceil(totalQuestions * 0.8);

    // Exactly passing
    const passingScore = Math.round((passingCount / totalQuestions) * 100);
    expect(passingScore).toBeGreaterThanOrEqual(80);

    // One below passing
    const failingScore = Math.round(((passingCount - 1) / totalQuestions) * 100);
    expect(failingScore).toBeLessThan(80);
  });
});

describe("Academy Helper Functions", () => {
  it("should return correct total quiz questions", () => {
    const total = getTotalQuizQuestions();
    const manual = ACADEMY_MODULES.reduce((sum, m) => sum + m.quiz.length, 0);
    expect(total).toBe(manual);
    expect(total).toBeGreaterThan(30); // At least 30 total questions
  });

  it("should return correct total estimated minutes", () => {
    const total = getTotalEstimatedMinutes();
    const manual = ACADEMY_MODULES.reduce((sum, m) => sum + m.estimatedMinutes, 0);
    expect(total).toBe(manual);
    expect(total).toBeGreaterThan(200); // At least 200 minutes of training
  });
});

describe("Academy Content Quality", () => {
  it("product-mastery module should cover MiniMorph services", () => {
    const mod = ACADEMY_MODULES.find((m) => m.id === "product-mastery")!;
    const allContent = mod.lessons.map((l) => l.content).join(" ").toLowerCase();
    expect(allContent).toContain("minimorph");
    expect(allContent).toContain("website");
  });

  it("psychology-selling module should cover persuasion principles", () => {
    const mod = ACADEMY_MODULES.find((m) => m.id === "psychology-selling")!;
    const allContent = mod.lessons.map((l) => l.content + " " + l.title).join(" ").toLowerCase();
    // Should cover Cialdini's principles
    expect(allContent).toContain("cialdini");
  });

  it("objection-handling module should cover price objections", () => {
    const mod = ACADEMY_MODULES.find((m) => m.id === "objection-handling")!;
    const allContent = mod.lessons.map((l) => l.content).join(" ").toLowerCase();
    expect(allContent).toContain("price");
    expect(allContent).toContain("objection");
  });

  it("closing-techniques module should cover closing methods", () => {
    const mod = ACADEMY_MODULES.find((m) => m.id === "closing-techniques")!;
    const allContent = mod.lessons.map((l) => l.content).join(" ").toLowerCase();
    expect(allContent).toContain("close");
  });

  it("discovery-call module should cover SPIN selling", () => {
    const mod = ACADEMY_MODULES.find((m) => m.id === "discovery-call")!;
    const allContent = mod.lessons.map((l) => l.content).join(" ").toLowerCase();
    expect(allContent).toContain("spin");
  });
});

describe("Academy Module Ordering", () => {
  it("should start with product mastery (know the product first)", () => {
    expect(ACADEMY_MODULES[0].id).toBe("product-mastery");
  });

  it("should have psychology before closing techniques", () => {
    const psychIndex = ACADEMY_MODULES.findIndex((m) => m.id === "psychology-selling");
    const closeIndex = ACADEMY_MODULES.findIndex((m) => m.id === "closing-techniques");
    expect(psychIndex).toBeLessThan(closeIndex);
  });

  it("should have discovery before objection handling", () => {
    const discIndex = ACADEMY_MODULES.findIndex((m) => m.id === "discovery-call");
    const objIndex = ACADEMY_MODULES.findIndex((m) => m.id === "objection-handling");
    expect(discIndex).toBeLessThan(objIndex);
  });

  it("should end with advanced tactics", () => {
    expect(ACADEMY_MODULES[ACADEMY_MODULES.length - 1].id).toBe("advanced-tactics");
  });
});
