"use client";

import { Worker, Viewer, ScrollMode, ViewMode, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

export default function HandbookViewer() {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    return (
        <div className="h-[70vh] min-h-[600px] w-full border border-zinc-200 rounded-lg overflow-hidden shadow-sm bg-white">
            <Worker workerUrl="/pdf.worker.min.js">
                <Viewer
                    fileUrl="/students-handbook-2018.pdf"
                    plugins={[defaultLayoutPluginInstance]}
                    scrollMode={ScrollMode.Horizontal}
                    viewMode={ViewMode.SinglePage}
                    defaultScale={SpecialZoomLevel.PageFit}
                />
            </Worker>
        </div>
    );
}
