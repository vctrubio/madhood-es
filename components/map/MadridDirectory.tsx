import type { ChangeEvent } from "react";
import content from "@/config/madrid.json";
import { normalizeSearch, type MadridController } from "./MadridController";
import type { MadridHood, MadridState } from "./MadridTypes";

type DirectoryProps = { controller: MadridController; state: MadridState };

function DirectoryHeading() {
  return (
    <header className="hidden md:block">
      <h1 className="m-0 text-3xl font-normal tracking-tight">
        {content.title}
      </h1>
      <p className="mt-3 text-xs leading-relaxed text-paper/70">
        {content.description}
      </p>
    </header>
  );
}

function HoodSearch({ controller, state }: DirectoryProps) {
  function search(event: ChangeEvent<HTMLInputElement>) {
    controller.setQuery(event.target.value);
  }
  return (
    <label className="block text-xs text-paper/70">
      {content.search}
      <input
        type="search"
        value={state.query}
        onChange={search}
        className="mt-2 block w-full rounded-none border-0 border-b border-paper/40 bg-transparent py-2 text-sm text-paper outline-offset-4"
      />
    </label>
  );
}

function HoodRow({
  hood,
  selected,
  controller,
}: {
  hood: MadridHood;
  selected: boolean;
  controller: MadridController;
}) {
  function toggle() {
    controller.toggleHood(hood);
  }
  function focus() {
    controller.focusHood(hood);
  }
  const selectedClass = selected ? "text-selected" : "text-paper";
  const rowClass = `flex items-center border-b border-paper/15 ${selectedClass}`;
  const focusLabel = `Centrar ${hood.name}`;
  const marker = selected ? "−" : "+";
  return (
    <div className={rowClass}>
      <button
        onClick={toggle}
        aria-pressed={selected}
        className="flex min-h-11 flex-1 items-center justify-between gap-3 border-0 bg-transparent py-3 text-left text-xs"
      >
        <span>
          {hood.name}
          <small className="mt-1 block text-paper/50">{hood.district}</small>
        </span>
        <span aria-hidden="true">{marker}</span>
      </button>
      <button
        aria-label={focusLabel}
        onClick={focus}
        className="ml-2 size-11 border-0 bg-transparent text-lg"
      >
        ↗
      </button>
    </div>
  );
}

function HoodList({ controller, state }: DirectoryProps) {
  const query = normalizeSearch(state.query);
  const hoods = controller.geography.hoods.filter((hood) =>
    normalizeSearch(`${hood.name} ${hood.district}`).includes(query),
  );
  if (!hoods.length) return <p className="text-xs">{content.empty}</p>;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {hoods.map((hood) => (
        <HoodRow
          key={hood.code}
          hood={hood}
          selected={state.selected.includes(hood.code)}
          controller={controller}
        />
      ))}
    </div>
  );
}

function SelectionSummary({ controller, state }: DirectoryProps) {
  const selectedHoods = controller.geography.hoods.filter((hood) =>
    state.selected.includes(hood.code),
  );
  const names = selectedHoods.map((hood) => hood.name).join(" · ");
  const descriptions = selectedHoods
    .map((hood) => hood.description)
    .filter(Boolean)
    .join(" ");
  function clear() {
    controller.clearSelection();
  }
  return (
    <div className="border-t border-paper/30 pt-3 text-xs" aria-live="polite">
      <div className="flex items-center justify-between">
        <span>
          {content.selection}: {state.selected.length}
        </span>
        <button
          className="border-0 bg-transparent text-xs text-paper/70 underline"
          onClick={clear}
          disabled={!state.selected.length}
        >
          {content.clear}
        </button>
      </div>
      <p className="mb-0 mt-2 leading-relaxed text-paper/70">
        {names || content.none}
        {descriptions && <span className="mt-2 block">{descriptions}</span>}
      </p>
    </div>
  );
}

export function MadridDirectory({ controller, state }: DirectoryProps) {
  return (
    <aside className="flex h-60 shrink-0 flex-col gap-3 bg-ink px-5 py-4 text-paper md:h-full md:w-72 md:gap-5 md:px-6 md:py-7">
      <DirectoryHeading />
      <HoodSearch controller={controller} state={state} />
      <HoodList controller={controller} state={state} />
      <SelectionSummary controller={controller} state={state} />
    </aside>
  );
}
