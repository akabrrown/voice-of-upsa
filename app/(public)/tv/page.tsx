import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Not Found | Voice of UPSA",
};

export default function VideoTVPage() {
  // Video TV is not yet released on live site
  notFound();
}
