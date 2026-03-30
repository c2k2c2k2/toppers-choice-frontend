"use client";

import {
  countSubjectTreeNotes,
  countTopicTreeNotes,
  matchesNoteMedium,
  type NoteTreeSubjectNode,
  type NoteTreeTopicNode,
} from "@/lib/notes";

function TopicBranch({
  activeTopicId,
  depth = 0,
  mediumId,
  onSelectTopic,
  topic,
}: Readonly<{
  activeTopicId: string | null;
  depth?: number;
  mediumId?: string | null;
  onSelectTopic: (topicId: string) => void;
  topic: NoteTreeTopicNode;
}>) {
  const directNotes = topic.notes.filter((note) => matchesNoteMedium(note, mediumId));
  const noteCount =
    directNotes.length + countTopicTreeNotes(topic.children, mediumId);
  const isActive = activeTopicId === topic.id;

  return (
    <div className={depth > 0 ? "tc-topic-branch pl-4" : ""}>
      <button
        type="button"
        onClick={() => onSelectTopic(topic.id)}
        className="flex w-full items-center justify-between gap-3 rounded-[18px] border border-transparent px-3 py-3 text-left transition-colors duration-200 hover:border-[rgba(0,30,64,0.08)] hover:bg-white/84"
        data-active={isActive}
        style={{
          background: isActive ? "rgba(0, 51, 102, 0.06)" : "transparent",
        }}
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[color:var(--brand)]">
            {topic.name}
          </span>
          <span className="mt-1 block text-xs text-[color:var(--muted)]">
            {directNotes.length > 0
              ? `${directNotes.length} direct notes`
              : "Nested notes inside this topic"}
          </span>
        </span>
        <span className="tc-code-chip">{noteCount}</span>
      </button>

      {topic.children.length > 0 ? (
        <div className="mt-2 flex flex-col gap-1">
          {topic.children.map((childTopic) => (
            <TopicBranch
              key={childTopic.id}
              activeTopicId={activeTopicId}
              depth={depth + 1}
              mediumId={mediumId}
              onSelectTopic={onSelectTopic}
              topic={childTopic}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function StudentNotesTree({
  activeSubjectId,
  activeTopicId,
  mediumId,
  onSelectAll,
  onSelectSubject,
  onSelectTopic,
  subjects,
}: Readonly<{
  activeSubjectId: string | null;
  activeTopicId: string | null;
  mediumId?: string | null;
  onSelectAll: () => void;
  onSelectSubject: (subjectId: string) => void;
  onSelectTopic: (subjectId: string, topicId: string) => void;
  subjects: NoteTreeSubjectNode[];
}>) {
  const totalNotes = subjects.reduce((total, subject) => {
    return total + countSubjectTreeNotes(subject, mediumId);
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onSelectAll}
        className="tc-student-nav-link"
        data-active={activeSubjectId === null && activeTopicId === null}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-semibold text-[color:var(--brand)]">All notes</span>
          <span className="tc-muted text-xs leading-5">
            Browse every published note in the active student context.
          </span>
        </span>
        <span className="tc-code-chip">{totalNotes}</span>
      </button>

      {subjects.map((subject) => {
        const subjectCount = countSubjectTreeNotes(subject, mediumId);
        const isSubjectActive =
          activeSubjectId === subject.id && activeTopicId === null;

        return (
          <section key={subject.id} className="tc-student-card-muted rounded-[24px] p-3">
            <button
              type="button"
              onClick={() => onSelectSubject(subject.id)}
              className="tc-student-nav-link w-full"
              data-active={isSubjectActive}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-semibold text-[color:var(--brand)]">
                  {subject.name}
                </span>
                <span className="tc-muted text-xs leading-5">
                  Subject-level discovery and untagged notes.
                </span>
              </span>
              <span className="tc-code-chip">{subjectCount}</span>
            </button>

            {subject.topics.length > 0 ? (
              <div className="mt-3 flex flex-col gap-1">
                {subject.topics.map((topic) => (
                  <TopicBranch
                    key={topic.id}
                    activeTopicId={activeTopicId}
                    mediumId={mediumId}
                    onSelectTopic={(topicId) => onSelectTopic(subject.id, topicId)}
                    topic={topic}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
