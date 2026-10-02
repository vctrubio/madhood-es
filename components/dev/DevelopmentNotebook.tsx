import content from "@/config.json";
import "./DevelopmentNotebook.css";

const dev = content.dev;
type Status = (typeof dev.statuses)[number];
type Track = (typeof dev.tracks)[number];

function NotebookHeading() {
  return (
    <header className="development-heading">
      <span className="small-label">{dev.eyebrow}</span>
      <h1>{dev.title}</h1>
      <p>{dev.description}</p>
      <span className="small-label">{dev.updated}</span>
    </header>
  );
}

function StatusCard({ status }: { status: Status }) {
  return (
    <article>
      <h3>{status.title}</h3>
      <p>{status.text}</p>
    </article>
  );
}

function ProjectStatus() {
  return (
    <section aria-labelledby="development-status">
      <h2 id="development-status">{dev.statusTitle}</h2>
      <div className="status-grid">
        {dev.statuses.map((status) => (
          <StatusCard key={status.title} status={status} />
        ))}
      </div>
    </section>
  );
}

function RoadmapNavigation() {
  return (
    <nav className="roadmap-nav" aria-label="Cuaderno">
      {dev.tracks.map((track) => (
        <a key={track.id} href={`#${track.id}`}>
          {track.title} ↘
        </a>
      ))}
    </nav>
  );
}

function RoadmapTrack({ track, number }: { track: Track; number: number }) {
  const label = `${String(number).padStart(2, "0")} / ${track.status}`;

  return (
    <section className="roadmap-track" id={track.id}>
      <div>
        <span className="small-label">{label}</span>
        <h2>{track.title}</h2>
        <p>{track.goal}</p>
      </div>
      <ul>
        {track.tasks.map((task) => (
          <li key={task}>{task}</li>
        ))}
      </ul>
    </section>
  );
}

function RoadmapTracks() {
  return (
    <div className="roadmap-tracks">
      {dev.tracks.map((track, index) => (
        <RoadmapTrack key={track.id} track={track} number={index + 1} />
      ))}
    </div>
  );
}

function NotebookReferences() {
  return (
    <>
      <p className="dev-source">
        <a href={dev.sourceUrl}>{dev.sourceLabel} ↗</a>
      </p>
      <p className="dev-footnote">{dev.footnote}</p>
    </>
  );
}

export function DevelopmentNotebook() {
  return (
    <div className="development-page">
      <NotebookHeading />
      <ProjectStatus />
      <RoadmapNavigation />
      <RoadmapTracks />
      <NotebookReferences />
    </div>
  );
}
