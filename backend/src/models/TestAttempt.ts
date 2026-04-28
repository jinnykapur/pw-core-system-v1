import mongoose, { Schema } from "mongoose";

export type TestType = "initial" | "skill" | "level";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type SkillReport = {
  skill: string;
  correct: number;
  total: number;
  score: number; // 0..100
};

export type PracticeRecommendation = {
  skill: string;
  focusAreas: string[];
  advice: string;
};
export type IntegrityEventType = "window-blur" | "window-focus" | "visibility-hidden" | "visibility-visible";
export type IntegrityEvent = {
  type: IntegrityEventType;
  at: Date;
};
export type IntegrityReport = {
  warnings: number;
  disqualified: boolean;
  scorePenalty: number;
  events: IntegrityEvent[];
};

export type McqQuestion = {
  id: string;
  skill: string;
  topic?: string;
  difficulty: Difficulty;
  prompt: string;
  options: string[];
  correctIndex: number;
  explain?: string;
};

export type TestAttemptDoc = mongoose.Document & {
  userId: mongoose.Types.ObjectId;
  type: TestType;
  difficulty: Difficulty;
  skills: string[];
  questions: McqQuestion[];
  answers?: number[];
  score?: number; // 0..100
  marksObtained?: number;
  totalMarks?: number;
  passed?: boolean;
  improvementTopics?: string[];
  skillReports?: SkillReport[];
  practiceRecommendations?: PracticeRecommendation[];
  integrity?: IntegrityReport;
  createdAt: Date;
  updatedAt: Date;
};

const questionSchema = new Schema<McqQuestion>(
  {
    id: { type: String, required: true },
    skill: { type: String, required: true },
    topic: { type: String, required: false },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
    prompt: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
    explain: { type: String, required: false }
  },
  { _id: false }
);

const testAttemptSchema = new Schema<TestAttemptDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["initial", "skill", "level"], required: true, index: true },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true, index: true },
    skills: { type: [String], default: [] },
    questions: { type: [questionSchema], default: [] },
    answers: { type: [Number], required: false },
    score: { type: Number, required: false },
    marksObtained: { type: Number, required: false },
    totalMarks: { type: Number, required: false },
    passed: { type: Boolean, required: false },
    improvementTopics: { type: [String], required: false },
    skillReports: {
      type: [
        new Schema<SkillReport>(
          {
            skill: { type: String, required: true },
            correct: { type: Number, required: true },
            total: { type: Number, required: true },
            score: { type: Number, required: true }
          },
          { _id: false }
        )
      ],
      required: false
    },
    practiceRecommendations: {
      type: [
        new Schema<PracticeRecommendation>(
          {
            skill: { type: String, required: true },
            focusAreas: { type: [String], default: [] },
            advice: { type: String, required: true }
          },
          { _id: false }
        )
      ],
      required: false
    },
    integrity: {
      type: new Schema<IntegrityReport>(
        {
          warnings: { type: Number, default: 0 },
          disqualified: { type: Boolean, default: false },
          scorePenalty: { type: Number, default: 0 },
          events: {
            type: [
              new Schema<IntegrityEvent>(
                {
                  type: { type: String, enum: ["window-blur", "window-focus", "visibility-hidden", "visibility-visible"], required: true },
                  at: { type: Date, required: true }
                },
                { _id: false }
              )
            ],
            default: []
          }
        },
        { _id: false }
      ),
      required: false
    }
  },
  { timestamps: true }
);

export const TestAttemptModel = mongoose.model<TestAttemptDoc>("TestAttempt", testAttemptSchema);
