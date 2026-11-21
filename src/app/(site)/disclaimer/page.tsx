import { InfoPageView, infoPageMetadata } from "@/components/shared/info-page";

export const metadata = infoPageMetadata("disclaimer");

export default function Page() {
  return <InfoPageView slug="disclaimer" />;
}
