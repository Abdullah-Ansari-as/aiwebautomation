import { InfoPageView, infoPageMetadata } from "@/components/shared/info-page";

export const metadata = infoPageMetadata("terms");

export default function Page() {
  return <InfoPageView slug="terms" />;
}
