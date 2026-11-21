import { InfoPageView, infoPageMetadata } from "@/components/shared/info-page";

export const metadata = infoPageMetadata("privacy-policy");

export default function Page() {
  return <InfoPageView slug="privacy-policy" />;
}
