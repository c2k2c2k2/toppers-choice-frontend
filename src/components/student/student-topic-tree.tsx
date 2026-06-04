import Link from "next/link";
import { countTopics, type StudentTopicTreeNode } from "@/lib/student";

function TopicBranch({
  buildTopicHref,
  depth = 0,
  topics,
}: Readonly<{
  buildTopicHref?: (topic: StudentTopicTreeNode) => string;
  depth?: number;
  topics: StudentTopicTreeNode[];
}>) {
  return (
    <ul className="flex list-none flex-col gap-3 p-0">
      {topics.map((topic) => {
        const descendantCount = countTopics(topic.children);
        return (
          <li
            key={topic.id}
            className="tc-topic-branch"
            style={{ marginLeft: `${depth * 1.05}rem` }}
          >
            <Link
              href={buildTopicHref?.(topic) ?? "#"}
              className="tc-student-card block rounded-[24px] p-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-semibold text-[color:var(--brand)]">
                  {topic.name}
                </h3>
                {descendantCount > 0 ? (
                  <span className="tc-muted text-xs">
                    {descendantCount} subtopic{descendantCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </Link>
            {topic.children.length > 0 ? (
              <div className="mt-3">
                <TopicBranch
                  buildTopicHref={buildTopicHref}
                  depth={depth + 1}
                  topics={topic.children}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function StudentTopicTree({
  buildTopicHref,
  topics,
}: Readonly<{
  buildTopicHref?: (topic: StudentTopicTreeNode) => string;
  topics: StudentTopicTreeNode[];
}>) {
  if (topics.length === 0) {
    return (
      <div className="tc-student-panel rounded-[20px] p-4">
        <p className="font-semibold text-[color:var(--brand)]">
          No topics available.
        </p>
      </div>
    );
  }

  return <TopicBranch buildTopicHref={buildTopicHref} topics={topics} />;
}
