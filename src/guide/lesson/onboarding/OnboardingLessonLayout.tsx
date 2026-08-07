import { useState } from "react";
import { GuideIcon } from "../../components/icons";
import { useGuideProgress } from "../../context/useGuideProgress";
import { getBadge } from "../../data/badges";
import type { GuideSectionId } from "../../data/navigation";
import WelcomeSection from "./WelcomeSection";
import PlatformTourSection from "./PlatformTourSection";
import InteractiveWalkthroughSection from "./InteractiveWalkthroughSection";
import QuickChallengeSection from "./QuickChallengeSection";
import KnowledgeCheckScreen from "./KnowledgeCheckScreen";
import CompletionSection from "./CompletionSection";
import { ONBOARDING_STEP_LABELS, type OnboardingLessonContent } from "./types";

interface OnboardingLessonLayoutProps {
  lesson: OnboardingLessonContent;
  sectionLabel: string;
  onBackToSection: () => void;
  onGoToLesson: (sectionId: GuideSectionId, lessonId: string | null) => void;
}

/**
 * Screen-by-screen lesson template (as opposed to LessonLayout's
 * single scrolling page) — one focused action per screen, matching
 * "every screen should guide the user to take an action." This is
 * the template Lesson 1 establishes for every lesson of this kind.
 */
export default function OnboardingLessonLayout({ lesson, sectionLabel, onBackToSection, onGoToLesson }: OnboardingLessonLayoutProps) {
  const { markLessonComplete, awardBadge, isBookmarked, toggleBookmark } = useGuideProgress();
  const [step, setStep] = useState(0);
  const [walkthroughSeen, setWalkthroughSeen] = useState(false);
  const [challengeDone, setChallengeDone] = useState(false);
  const [quizAnswered, setQuizAnswered] = useState(false);

  const bookmarked = isBookmarked(lesson.id);
  const lastStep = ONBOARDING_STEP_LABELS.length - 1;
  const isCompletionStep = step === lastStep;

  const canAdvance =
    step === 2 ? walkthroughSeen : step === 3 ? challengeDone : step === 4 ? quizAnswered : true;

  const handleChallengeDone = () => {
    setChallengeDone(true);
    markLessonComplete(lesson.id);
    awardBadge(lesson.completion.badgeId);
  };

  const goNext = () => setStep((s) => Math.min(lastStep, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const nextLesson = lesson.completion.nextLesson;

  return (
    <div>
      <div className="wg-breadcrumb">
        <button type="button" onClick={onBackToSection}>{sectionLabel}</button>
        <GuideIcon.chevronRight />
        <span>{lesson.title}</span>
      </div>

      <div className="wg-ob-header">
        <div>
          <span className="wg-eyebrow">Lesson · {lesson.minutes} min</span>
          <h1 className="wg-page-title" style={{ marginBottom: 0 }}>{lesson.title}</h1>
        </div>
        {!isCompletionStep && (
          <button
            type="button"
            className="wg-icon-btn"
            aria-pressed={bookmarked}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark this lesson"}
            onClick={() => toggleBookmark(lesson.id)}
          >
            <GuideIcon.bookmark />
          </button>
        )}
      </div>

      <div className="wg-ob-progress" role="progressbar" aria-valuemin={0} aria-valuemax={lastStep} aria-valuenow={step}>
        {ONBOARDING_STEP_LABELS.map((label, i) => (
          <div className="wg-ob-progress-segment" data-state={i < step ? "done" : i === step ? "active" : "todo"} key={label}>
            <span className="wg-ob-progress-dot" />
            <span className="wg-ob-progress-label">{label}</span>
          </div>
        ))}
      </div>

      {step === 0 && <WelcomeSection welcome={lesson.welcome} />}
      {step === 1 && <PlatformTourSection stops={lesson.platformTour} />}
      {step === 2 && (
        <InteractiveWalkthroughSection stops={lesson.platformTour} onAllSeen={() => setWalkthroughSeen(true)} />
      )}
      {step === 3 && (
        <QuickChallengeSection
          intro={lesson.quickChallenge.intro}
          steps={lesson.quickChallenge.steps}
          stops={lesson.platformTour}
          onAllStepsDone={handleChallengeDone}
        />
      )}
      {step === 4 && <KnowledgeCheckScreen quiz={lesson.knowledgeCheck} onAllAnswered={() => setQuizAnswered(true)} />}
      {step === 5 && (
        <CompletionSection
          badge={getBadge(lesson.completion.badgeId)}
          message={lesson.completion.message}
          nextLessonTitle={nextLesson?.title ?? null}
          onGoToNext={() => nextLesson && onGoToLesson(nextLesson.sectionId, nextLesson.lessonId)}
        />
      )}

      {!isCompletionStep && (
        <div className="wg-ob-nav">
          <button type="button" className="wg-btn wg-btn-secondary" onClick={goBack} disabled={step === 0}>
            <GuideIcon.chevronLeft /> Back
          </button>
          <button type="button" className="wg-btn wg-btn-primary" onClick={goNext} disabled={!canAdvance}>
            {step === 0 ? "Let's go" : step === 4 ? "Finish" : "Next"}
            <GuideIcon.chevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
