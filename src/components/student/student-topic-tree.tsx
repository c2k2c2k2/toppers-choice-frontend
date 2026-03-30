import {
  countTopics,
  getOptionalText,
  type StudentTopicTreeNode,
} from "@/lib/student";

function TopicBranch({
  depth = 0,
  topics,
}: Readonly<{
  depth?: number;
  topics: StudentTopicTreeNode[];
}>) {
  return (
    <ul className="flex list-none flex-col gap-3 p-0">
      {topics.map((topic) => {
        const descendantCount = countTopics(topic.children);
        const description = getOptionalText(topic.description);

        return (
          <li
            key={topic.id}
            className="tc-topic-branch"
            style={{ marginLeft: `${depth * 1.05}rem` }}
          >
            <div className="tc-student-card rounded-[24px] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-semibold text-[color:var(--brand)]">
                  {topic.name}
                </h3>
                <span className="tc-code-chip">{topic.code}</span>
                {descendantCount > 0 ? (
                  <span className="tc-muted text-xs">
                    {descendantCount} subtopic{descendantCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
              {description ? (
                <p className="tc-muted mt-2 text-sm leading-6">
                  {description}
                </p>
              ) : null}
            </div>
            {topic.children.length > 0 ? (
              <div className="mt-3">
                <TopicBranch depth={depth + 1} topics={topic.children} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function StudentTopicTree({
  topics,
}: Readonly<{
  topics: StudentTopicTreeNode[];
}>) {
  if (topics.length === 0) {
    return (
      <div className="tc-student-panel rounded-[28px] p-6">
        <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
          Topic map
        </p>
        <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
          Topics will appear here once the subject tree is published.
        </h2>
        <p className="tc-muted mt-3 text-sm leading-6">
          The catalog route is ready for notes, practice, and test entry points
          even when the backend has not published topic nodes yet.
        </p>
      </div>
    );
  }

  return <TopicBranch topics={topics} />;
}
