import Link from "next/link";
import content from "@/config.json";
import "./SiteChrome.css";

type Destination = (typeof content.footer.links)[number];

function MainNavigation() {
  return (
    <nav aria-label="Principal">
      {content.navigation.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function MadridLink() {
  return (
    <Link className="header-map" href="/">
      Madrid <span aria-hidden="true">↗</span>
    </Link>
  );
}

function FooterHeading() {
  return (
    <div className="footer-heading">
      <h2>{content.footer.title}</h2>
      <p>{content.footer.description}</p>
    </div>
  );
}

function DestinationLink({ destination }: { destination: Destination }) {
  return (
    <Link href={destination.href} prefetch={false} className="destination-link">
      <span className="small-label">
        {destination.number} / {destination.status}
      </span>
      <span className="destination-title">
        {destination.title}
        <span aria-hidden="true">↗</span>
      </span>
      <span>{destination.description}</span>
    </Link>
  );
}

function DestinationLinks() {
  return (
    <div className="destination-links">
      {content.footer.links.map((destination) => (
        <DestinationLink key={destination.href} destination={destination} />
      ))}
    </div>
  );
}

function FooterColophon() {
  return (
    <div className="footer-bottom">
      <span className="footer-family">MAD / Madrid neighbourhoods</span>
      <span>{content.footer.note}</span>
      <Link href="/dev">{content.footer.dev} ↗</Link>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <span className="brand-descriptor">{content.identity.descriptor}</span>
      <MainNavigation />
      <MadridLink />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <FooterHeading />
      <DestinationLinks />
      <FooterColophon />
    </footer>
  );
}
