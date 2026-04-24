import { describe, it, expect } from "vitest";
import { scoreAssessment } from "./assessmentRouter";
import {
  GATE_1_QUESTIONS,
  GATE_2_QUESTIONS,
  SCORING,
  ALL_QUESTIONS,
} from "./assessmentData";

describe("Assessment Data Validation", () => {
  it("should have 6 Gate 1 questions", () => {
    expect(GATE_1_QUESTIONS.length).toBe(6);
  });

  it("should have 6 Gate 2 questions (5 MC + 1 free text)", () => {
    expect(GATE_2_QUESTIONS.length).toBe(6);
    const freeText = GATE_2_QUESTIONS.filter((q) => q.freeText);
    expect(freeText.length).toBe(1);
    expect(freeText[0].id).toBe("sa6");
  });

  it("should have 12 total questions", () => {
    expect(ALL_QUESTIONS.length).toBe(12);
  });

  it("each MC question should have exactly 4 options", () => {
    const mcQuestions = ALL_QUESTIONS.filter((q) => !q.freeText);
    for (const q of mcQuestions) {
      expect(q.options.length).toBe(4);
    }
  });

  it("each MC question should have exactly one option scoring 3 (best)", () => {
    const mcQuestions = ALL_QUESTIONS.filter((q) => !q.freeText);
    for (const q of mcQuestions) {
      const bestOptions = q.options.filter((o) => o.score === 3);
      expect(bestOptions.length).toBe(1);
    }
  });

  it("each MC question should have at least one option scoring 0 (red flag)", () => {
    const mcQuestions = ALL_QUESTIONS.filter((q) => !q.freeText);
    for (const q of mcQuestions) {
      const redFlags = q.options.filter((o) => o.score === 0);
      expect(redFlags.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("all question IDs should be unique", () => {
    const ids = ALL_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all option IDs should be unique across all questions", () => {
    const allOptionIds = ALL_QUESTIONS.flatMap((q) =>
      q.options.map((o) => o.id)
    );
    expect(new Set(allOptionIds).size).toBe(allOptionIds.length);
  });
});

describe("Scoring Engine", () => {
  it("should return 100% for all perfect answers", () => {
    const answers: Record<string, string> = {};
    for (const q of ALL_QUESTIONS) {
      if (q.freeText) continue;
      const best = q.options.find((o) => o.score === 3);
      if (best) answers[q.id] = best.id;
    }
    const result = scoreAssessment(answers);
    expect(result.gate1Score).toBe(100);
    expect(result.gate2Score).toBe(100);
    expect(result.totalScore).toBe(100);
    expect(result.status).toBe("passed");
  });

  it("should return 0% for all worst answers", () => {
    const answers: Record<string, string> = {};
    for (const q of ALL_QUESTIONS) {
      if (q.freeText) continue;
      const worst = q.options.find((o) => o.score === 0);
      if (worst) answers[q.id] = worst.id;
    }
    const result = scoreAssessment(answers);
    expect(result.gate1Score).toBe(0);
    expect(result.gate2Score).toBe(0);
    expect(result.totalScore).toBe(0);
    expect(result.status).toBe("failed");
  });

  it("should fail if Gate 1 score is below minimum (55%)", () => {
    const answers: Record<string, string> = {};
    // Gate 1: pick worst answers (0 score) for all 6 → 0%
    for (const q of GATE_1_QUESTIONS) {
      const worst = q.options.find((o) => o.score === 0);
      if (worst) answers[q.id] = worst.id;
    }
    // Gate 2: pick best answers (3 score) for all 5 MC → 100%
    for (const q of GATE_2_QUESTIONS) {
      if (q.freeText) continue;
      const best = q.options.find((o) => o.score === 3);
      if (best) answers[q.id] = best.id;
    }
    const result = scoreAssessment(answers);
    expect(result.gate1Score).toBe(0);
    expect(result.gate2Score).toBe(100);
    // Even with high total, Gate 1 minimum fails
    expect(result.status).toBe("failed");
  });

  it("should fail if Gate 2 score is below minimum (40%)", () => {
    const answers: Record<string, string> = {};
    // Gate 1: pick best answers → 100%
    for (const q of GATE_1_QUESTIONS) {
      const best = q.options.find((o) => o.score === 3);
      if (best) answers[q.id] = best.id;
    }
    // Gate 2: pick worst answers → 0%
    for (const q of GATE_2_QUESTIONS) {
      if (q.freeText) continue;
      const worst = q.options.find((o) => o.score === 0);
      if (worst) answers[q.id] = worst.id;
    }
    const result = scoreAssessment(answers);
    expect(result.gate1Score).toBe(100);
    expect(result.gate2Score).toBe(0);
    expect(result.status).toBe("failed");
  });

  it("should return borderline for scores between 50-69%", () => {
    const answers: Record<string, string> = {};
    // Gate 1: 4 best (3) + 2 acceptable (2) = 16/18 = 88.89% (passes gate1 min)
    const g1 = [...GATE_1_QUESTIONS];
    for (let i = 0; i < 4; i++) {
      const best = g1[i].options.find((o) => o.score === 3);
      if (best) answers[g1[i].id] = best.id;
    }
    for (let i = 4; i < 6; i++) {
      const acceptable = g1[i].options.find((o) => o.score === 1);
      if (acceptable) answers[g1[i].id] = acceptable.id;
    }
    // Gate 2: 1 best (3) + 1 acceptable (2) + 3 weak (1) = 8/15 = 53.33% (passes gate2 min)
    const g2mc = GATE_2_QUESTIONS.filter((q) => !q.freeText);
    const best2 = g2mc[0].options.find((o) => o.score === 3);
    if (best2) answers[g2mc[0].id] = best2.id;
    const acc2 = g2mc[1].options.find((o) => o.score === 2);
    if (acc2) answers[g2mc[1].id] = acc2.id;
    for (let i = 2; i < 5; i++) {
      const weak = g2mc[i].options.find((o) => o.score === 1);
      if (weak) answers[g2mc[i].id] = weak.id;
    }

    const result = scoreAssessment(answers);
    // Gate 1: (12+2)/18 = 77.78%, Gate 2: (3+2+3)/15 = 53.33%
    // Total: (77.78*2 + 53.33*1) / 3 = 69.63%
    expect(result.gate1Score).toBeGreaterThanOrEqual(SCORING.gate1MinPercent);
    expect(result.gate2Score).toBeGreaterThanOrEqual(SCORING.gate2MinPercent);
    // Should be borderline (50-69%)
    expect(result.totalScore).toBeGreaterThanOrEqual(SCORING.borderlineMin);
    expect(result.totalScore).toBeLessThan(SCORING.autoPassThreshold);
    expect(result.status).toBe("borderline");
  });

  it("should weight Gate 1 (character) 2x more than Gate 2 (sales)", () => {
    // Verify the weighted formula
    const g1 = 80;
    const g2 = 50;
    const expected = (g1 * 2 + g2 * 1) / 3;
    expect(expected).toBeCloseTo(70, 0);
    expect(SCORING.gate1Weight).toBe(2);
    expect(SCORING.gate2Weight).toBe(1);
  });

  it("should handle missing answers gracefully (score 0 for unanswered)", () => {
    const answers: Record<string, string> = {};
    // Only answer first Gate 1 question
    const best = GATE_1_QUESTIONS[0].options.find((o) => o.score === 3);
    if (best) answers[GATE_1_QUESTIONS[0].id] = best.id;

    const result = scoreAssessment(answers);
    expect(result.gate1Raw).toBe(3);
    expect(result.gate2Raw).toBe(0);
    expect(result.status).toBe("failed");
  });
});

describe("Scoring Configuration", () => {
  it("should have correct thresholds", () => {
    expect(SCORING.autoPassThreshold).toBe(70);
    expect(SCORING.borderlineMin).toBe(50);
    expect(SCORING.autoRejectBelow).toBe(50);
    expect(SCORING.gate1MinPercent).toBe(55);
    expect(SCORING.gate2MinPercent).toBe(40);
  });

  it("should have correct max scores", () => {
    expect(SCORING.gate1MaxPerQuestion).toBe(3);
    expect(SCORING.gate1QuestionCount).toBe(6);
    expect(SCORING.gate2MaxPerQuestion).toBe(3);
    expect(SCORING.gate2QuestionCount).toBe(5);
  });
});
