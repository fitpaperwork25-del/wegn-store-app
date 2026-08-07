import LessonLayout from "../lesson/LessonLayout";
import type { LessonContent } from "../lesson/types";
import type { GuideSectionId } from "../data/navigation";

// The one fully-authored lesson for Phase 1 — proves the LessonLayout
// template end-to-end with real (if simple) content. Every other
// lesson in the nav stays a titled "coming soon" stub until Phase 2.
const SAMPLE_LESSON: LessonContent = {
  id: "sample-first-sale",
  sectionId: "getting-started",
  title: "Ringing up your first sale",
  minutes: 4,
  overview: {
    summary:
      "This lesson walks through completing a single sale from start to finish: adding an item, taking payment, and printing or emailing the receipt.",
    whyItMatters:
      "Every other feature in WEGN Store builds on this one flow. Once it's second nature, opening a shift, handling returns, and reading reports all make a lot more sense.",
  },
  walkthrough: {
    screenLabel: "Checkout screen (illustrative placeholder for Phase 1)",
    callouts: [
      { label: "1", title: "Item search", description: "Type a product name or scan a barcode to add it to the cart." },
      { label: "2", title: "Cart summary", description: "Shows running totals, tax, and any discounts applied." },
      { label: "3", title: "Charge button", description: "Opens the payment screen — card, cash, or split tender." },
    ],
  },
  practice: {
    intro: "In the real lesson, you'd complete these steps in a sandboxed checkout that never touches live data.",
    steps: [
      { title: "Add an item", description: "Search for any product and add it to the cart." },
      { title: "Apply a discount", description: "Try applying a 10% discount to see how totals update." },
      { title: "Take payment", description: "Choose a tender type and complete the sale." },
    ],
  },
  tips: {
    good: [
      { text: "Use barcode scanning when possible — it's faster and avoids picking the wrong item." },
      { text: "Double-check the cart total with the customer before charging." },
    ],
    watchOutFor: [
      { text: "Applying a discount to the whole cart instead of a single item." },
      { text: "Closing the sale screen before payment finishes processing." },
    ],
  },
  quiz: [
    {
      question: "What's the fastest way to add a product you're holding in your hand?",
      options: [
        { text: "Scan its barcode", correct: true },
        { text: "Type its full name from memory", correct: false },
        { text: "Browse the entire catalog", correct: false },
      ],
      explanation: "Barcode scanning is faster and avoids picking the wrong item from a search list.",
    },
  ],
  nextLesson: {
    lessonId: null,
    sectionId: "getting-started",
    title: "Touring your dashboard",
  },
};

interface SampleLessonPageProps {
  onBackToSection: () => void;
  onGoToSection: (sectionId: GuideSectionId) => void;
  onGoToLesson: (sectionId: GuideSectionId, lessonId: string | null) => void;
}

export default function SampleLessonPage({ onBackToSection, onGoToSection, onGoToLesson }: SampleLessonPageProps) {
  return (
    <LessonLayout
      lesson={SAMPLE_LESSON}
      sectionLabel="Getting Started"
      onBackToSection={onBackToSection}
      onGoToSection={onGoToSection}
      onGoToLesson={onGoToLesson}
    />
  );
}
