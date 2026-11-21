import { InfoPageView, infoPageMetadata } from "@/components/shared/info-page";

export const metadata = infoPageMetadata("editorial-policy");

export default function Page() {
  return <InfoPageView slug="editorial-policy" />;
}
