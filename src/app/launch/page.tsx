import type { Metadata } from "next";
import { LaunchExperience } from "@/components/public/launch-experience";

export const metadata: Metadata = {
  title: "Launch Day",
  description:
    "Celebrate the Founder's Day launch moment for Toppers' Choice.",
};

export default function LaunchPage() {
  return <LaunchExperience />;
}
