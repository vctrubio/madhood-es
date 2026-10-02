import type { Metadata } from "next";
import { EditorialSite } from "@/components/site/EditorialSite";
import { DevelopmentNotebook } from "@/components/dev/DevelopmentNotebook";

export const metadata: Metadata = {
  title: "MAD Hood",
  robots: { index: false, follow: true },
};

export default function DevelopmentPage() {
  return (
    <EditorialSite>
      <DevelopmentNotebook />
    </EditorialSite>
  );
}
