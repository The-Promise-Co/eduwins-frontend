import type { AssessmentQuestion, AssessmentSection } from '@/misc/types/assessment';

export interface GroupedItem {
  q: AssessmentQuestion;
  n: number;
}

export interface SectionGroup {
  section: AssessmentSection;
  items: GroupedItem[];
  marks: number;
}

/**
 * Groups questions by section (sections in order, then unassigned),
 * numbering continuously across the whole assessment.
 */
export function groupQuestionsBySection(
  questions: AssessmentQuestion[],
  sections: AssessmentSection[] = [],
): { ordered: SectionGroup[]; unassigned: GroupedItem[] } {
  let n = 0;
  const ordered = sections.map((section) => {
    const items = questions
      .filter((q) => q.sectionId === section.id)
      .map((q) => ({ q, n: ++n }));
    return {
      section,
      items,
      marks: items.reduce((s, { q }) => s + (Number(q.marks) || 0), 0),
    };
  });
  const unassigned = questions
    .filter((q) => !q.sectionId || !sections.some((s) => s.id === q.sectionId))
    .map((q) => ({ q, n: ++n }));
  return { ordered, unassigned };
}
