import { useId } from "react";
import content from "@/config/madrid-construction.json";
import type { MadridConstructionProject } from "./MadridTypes";
import "./MadridConstruction.css";

type ConstructionProps = {
  projects: MadridConstructionProject[];
  visible: boolean;
};

function ConstructionShape({
  project,
  patternId,
}: {
  project: MadridConstructionProject;
  patternId: string;
}) {
  const corridor = project.kind === "corridor";
  const className = corridor
    ? "madrid-construction-corridor"
    : "madrid-construction-area";
  const fill = corridor ? "none" : `url(#${patternId})`;
  const title = `${project.name} · ${project.status}. ${project.description} ${project.geometryNote}`;
  return (
    <g role="img" aria-label={title}>
      <title>{title}</title>
      <path
        className={className}
        d={project.path}
        strokeWidth={project.width}
      />
      {!corridor && <path d={project.path} fill={fill} />}
    </g>
  );
}

export function MadridConstructionAreas({
  projects,
  visible,
}: ConstructionProps) {
  const patternId = useId();
  if (!visible) return null;
  return (
    <g className="madrid-construction">
      <defs>
        <pattern
          id={patternId}
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <path d="M0 0V12" className="madrid-construction-hatch" />
        </pattern>
      </defs>
      {projects.map((project) => (
        <ConstructionShape
          key={project.id}
          project={project}
          patternId={patternId}
        />
      ))}
    </g>
  );
}

function ConstructionName({
  project,
  scale,
}: {
  project: MadridConstructionProject;
  scale: number;
}) {
  const transform = `translate(${project.point[0]} ${project.point[1]}) scale(${scale})`;
  const [x, y] = project.labelOffset;
  const anchor = x === 0 ? "middle" : x < 0 ? "end" : "start";
  return (
    <text
      transform={transform}
      x={x}
      y={y}
      textAnchor={anchor}
      className="madrid-construction-name"
    >
      {project.label}
    </text>
  );
}

export function MadridConstructionNames({
  projects,
  visible,
  scale,
}: ConstructionProps & { scale: number }) {
  if (!visible) return null;
  return (
    <g className="madrid-construction">
      {projects.map((project) => (
        <ConstructionName key={project.id} project={project} scale={scale} />
      ))}
    </g>
  );
}

function ConstructionSource({
  project,
}: {
  project: MadridConstructionProject;
}) {
  return (
    <a
      href={project.source}
      target="_blank"
      rel="noreferrer"
      className="block underline decoration-map-line underline-offset-2 hover:text-ink"
      title={project.description}
    >
      {project.name} · {project.status}
    </a>
  );
}

export function MadridConstructionLegend({
  projects,
  visible,
}: ConstructionProps) {
  if (!visible) return null;
  return (
    <aside
      className="absolute bottom-16 left-3 max-w-64 border border-map-line bg-paper p-3 text-xs text-muted md:left-6"
      aria-label={content.title}
    >
      <p className="mb-2 flex items-center gap-2 font-medium text-ink">
        <span
          className="size-3 shrink-0 border border-yellow-700 bg-yellow-300"
          aria-hidden="true"
        />
        {content.title}
      </p>
      {projects.map((project) => (
        <ConstructionSource key={project.id} project={project} />
      ))}
      <p className="mt-2">{content.note}</p>
    </aside>
  );
}
