"use client";

import { Worker, Viewer, ScrollMode, ViewMode, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { pageNavigationPlugin, RenderGoToNextPageProps, RenderGoToPreviousPageProps } from '@react-pdf-viewer/page-navigation';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function HandbookViewer() {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    const pageNavigationPluginInstance = pageNavigationPlugin();
    const { GoToPreviousPage, GoToNextPage } = pageNavigationPluginInstance;

    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center space-y-4">
            <div className="relative h-[650px] w-full border border-zinc-200 rounded-lg overflow-hidden shadow-sm bg-white flex">
                <Worker workerUrl="/pdf.worker.min.js">
                    <Viewer
                        fileUrl="/students-handbook-2018.pdf"
                        plugins={[defaultLayoutPluginInstance, pageNavigationPluginInstance]}
                        scrollMode={ScrollMode.Page}
                        viewMode={ViewMode.SinglePage}
                        defaultScale={SpecialZoomLevel.PageFit}
                        theme="light"
                        renderLoader={(percentages: number) => (
                            <div className="flex flex-col items-center justify-center w-full h-full space-y-4 bg-gray-50">
                                <Loader2 className="w-8 h-8 animate-spin text-upsa-navy" />
                                <div className="w-64 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="bg-[#1F7A6C] h-2.5 rounded-full transition-all duration-300" 
                                        style={{ width: `${Math.round(percentages)}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm font-medium text-gray-600">Loading Handbook ({Math.round(percentages)}%)</p>
                            </div>
                        )}
                    />
                </Worker>

                {/* Floating Left Button */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <GoToPreviousPage>
                        {(props: RenderGoToPreviousPageProps) => (
                            <button
                                onClick={props.onClick}
                                disabled={props.isDisabled}
                                className={`p-2 rounded-full shadow-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all ${props.isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'}`}
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}
                    </GoToPreviousPage>
                </div>

                {/* Floating Right Button */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                    <GoToNextPage>
                        {(props: RenderGoToNextPageProps) => (
                            <button
                                onClick={props.onClick}
                                disabled={props.isDisabled}
                                className={`p-2 rounded-full shadow-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all ${props.isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'}`}
                                aria-label="Next page"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}
                    </GoToNextPage>
                </div>
            </div>
        </div>
    );
}
