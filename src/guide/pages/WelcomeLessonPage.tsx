import OnboardingLessonLayout from "../lesson/onboarding/OnboardingLessonLayout";
import type { OnboardingLessonContent } from "../lesson/onboarding/types";
import type { GuideSectionId } from "../data/navigation";

// Lesson 1 — the first fully-authored lesson of the onboarding
// template introduced in Phase 2. Every future "tour" style lesson
// should follow this same shape (see lesson/onboarding/types.ts).
const WELCOME_LESSON: OnboardingLessonContent = {
  id: "welcome-to-wegn-store",
  sectionId: "getting-started",
  title: "Welcome to WEGN Store",
  minutes: 5,
  welcome: {
    intro:
      "WEGN Store is where you run your shop day to day — sales, stock, staff, and the numbers behind them, all in one place.",
    problems: [
      "No more juggling a separate till, spreadsheet, and notebook",
      "Stock levels update the moment something sells",
      "Everyone on your team sees the same live numbers",
    ],
    youWillLearn: [
      "The 10 areas that make up the platform",
      "Where to find what you need, fast",
      "How to complete your first hands-on task",
    ],
  },
  platformTour: [
    { id: "dashboard", label: "Dashboard", icon: "grid", description: "Your at-a-glance view of today's sales, stock alerts, and what needs attention." },
    { id: "pos", label: "POS", icon: "cart", description: "Ring up sales, take payment, and print receipts." },
    { id: "inventory", label: "Inventory", icon: "box", description: "Every product you sell, its stock level, and low-stock alerts." },
    { id: "purchasing", label: "Purchasing", icon: "receipt", description: "Order stock from suppliers and receive shipments when they arrive." },
    { id: "customers", label: "Customers", icon: "users", description: "Your customer list, purchase history, and loyalty rewards." },
    { id: "cash_drawer", label: "Cash Drawer", icon: "box", description: "Open and close the drawer, record paid-outs, and review the end-of-day summary." },
    { id: "reports", label: "Reports", icon: "chart", description: "Sales analytics, inventory value, and profit — read on screen, no export." },
    { id: "employees", label: "Employees", icon: "badge", description: "Staff accounts and the role that controls what each person can access." },
    { id: "settings", label: "Settings", icon: "gear", description: "Store details, tax rates, and how WEGN Store is configured for you." },
    { id: "copilot", label: "Wegn AI", icon: "spark", description: "Ask questions about your sales, stock, and suppliers — owners and managers only, read-only answers." },
  ],
  quickChallenge: {
    intro: "Try it yourself — tap through the areas below to check off each task.",
    steps: [
      { id: "open-pos", instruction: "Open the POS", targetStopId: "pos" },
      { id: "return-dashboard", instruction: "Return to the Dashboard", targetStopId: "dashboard" },
      { id: "open-inventory", instruction: "Open Inventory", targetStopId: "inventory" },
      { id: "mark-complete", instruction: "Mark the lesson complete" },
    ],
  },
  knowledgeCheck: [
    {
      question: "Where would you go to ring up a sale?",
      options: [
        { text: "POS", correct: true },
        { text: "Reports", correct: false },
        { text: "Settings", correct: false },
      ],
      explanation: "The POS is where sales happen — items, payment, and receipts.",
    },
    {
      question: "Where do you check if a product is running low on stock?",
      options: [
        { text: "Employees", correct: false },
        { text: "Inventory", correct: true },
        { text: "Customers", correct: false },
      ],
      explanation: "Inventory tracks every product's stock level and low-stock alerts.",
    },
    {
      question: "You need to order more stock from a supplier. Where do you go?",
      options: [
        { text: "Purchasing", correct: true },
        { text: "Dashboard", correct: false },
        { text: "Reports", correct: false },
      ],
      explanation: "Purchasing is for ordering from suppliers and receiving shipments.",
    },
    {
      question: "Where's the fastest place to see today's sales at a glance?",
      options: [
        { text: "Settings", correct: false },
        { text: "Employees", correct: false },
        { text: "Dashboard", correct: true },
      ],
      explanation: "The Dashboard is your at-a-glance view of today's activity.",
    },
    {
      question: "Where would you check today's sales analytics and profit?",
      options: [
        { text: "Reports", correct: true },
        { text: "Customers", correct: false },
        { text: "POS", correct: false },
      ],
      explanation: "Reports is where Sales Analytics, Inventory Valuation, and the Profit Report live — all read on screen.",
    },
  ],
  completion: {
    badgeId: "first-steps",
    message: "You know your way around WEGN Store. Next, let's open the cash drawer and start a shift.",
    nextLesson: { sectionId: "getting-started", lessonId: "opening-cash-drawer", title: "Opening the Cash Drawer" },
  },
};

interface WelcomeLessonPageProps {
  onBackToSection: () => void;
  onGoToLesson: (sectionId: GuideSectionId, lessonId: string | null) => void;
}

export default function WelcomeLessonPage({ onBackToSection, onGoToLesson }: WelcomeLessonPageProps) {
  return (
    <OnboardingLessonLayout
      lesson={WELCOME_LESSON}
      sectionLabel="Getting Started"
      onBackToSection={onBackToSection}
      onGoToLesson={onGoToLesson}
    />
  );
}
