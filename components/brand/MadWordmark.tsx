"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import type { CSSProperties, FocusEvent, KeyboardEvent } from "react";
import "./MadWordmark.css";

const CONCEPTS = ["Hood", "Iberia"];
const DESTINATIONS = [
  { href: "/", label: "Hood", description: "Barrios de Madrid" },
  { href: "/iberia", label: "Iberia", description: "Península ibérica" },
];
type ReelStyle = CSSProperties & { "--concept-index": number };

function MadCircle() {
  return (
    <Link href="/" className="mad-circle" aria-label="MAD Hood, inicio">
      MAD
    </Link>
  );
}

function ConceptReel({ concept }: { concept: string }) {
  const reelStyle: ReelStyle = { "--concept-index": CONCEPTS.indexOf(concept) };
  return (
    <span className="mad-concept-window" aria-hidden="true">
      <span className="mad-concept-reel" style={reelStyle}>
        {CONCEPTS.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </span>
    </span>
  );
}

function BrandDestinations({
  pathname,
  close,
}: {
  pathname: string;
  close: () => void;
}) {
  return (
    <div id="brand-destinations" className="mad-destinations">
      {DESTINATIONS.map((destination) => (
        <Link
          key={destination.href}
          href={destination.href}
          prefetch={false}
          aria-current={pathname === destination.href ? "page" : undefined}
          onClick={close}
        >
          <span>{destination.label} ↗</span>
          <small>{destination.description}</small>
        </Link>
      ))}
    </div>
  );
}

export function MadWordmark() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const concept = pathname === "/iberia" ? "Iberia" : "Hood";
  const label = `${concept}: cambiar de mapa`;

  function close() {
    setOpen(false);
  }
  function show() {
    setOpen(true);
  }
  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) close();
  }
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    toggleRef.current?.focus();
    close();
  }

  return (
    <nav
      className="mad-wordmark"
      aria-label="MAD Hood"
      onMouseEnter={show}
      onMouseLeave={close}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <MadCircle />
      <button
        ref={toggleRef}
        className="mad-concept-button"
        aria-label={label}
        aria-expanded={open}
        aria-controls="brand-destinations"
        onClick={show}
        onFocus={show}
      >
        <ConceptReel concept={concept} />
        <span aria-hidden="true">⌄</span>
      </button>
      {open && <BrandDestinations pathname={pathname} close={close} />}
    </nav>
  );
}
