import type { ReactNode } from "react";
import { SiteHeader, SiteFooter } from "./SiteChrome";
import "./EditorialSite.css";

type EditorialSiteProps = { children: ReactNode };

export function EditorialSite({ children }: EditorialSiteProps) {
  return (
    <div className="editorial-site">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
