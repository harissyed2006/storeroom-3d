import type { Metadata } from "next";
import StoreroomApp from "@/components/StoreroomApp";

export const metadata: Metadata = {
  title: "Live demo | Storeroom 3D",
  description: "Try the 3D storeroom: search, open drawers, take items out and move boxes. All data is made up.",
};

export default function DemoPage() {
  return <StoreroomApp />;
}
