"use client";

import dynamic from "next/dynamic";

const HandbookViewer = dynamic(() => import("./HandbookViewer"), {
  ssr: false,
});

export default function HandbookViewerWrapper() {
  return <HandbookViewer />;
}
