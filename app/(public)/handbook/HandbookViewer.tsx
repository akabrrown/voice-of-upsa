"use client";

export default function HandbookViewer() {
    return (
        <div className="h-[85vh] w-full border border-zinc-200 rounded-lg overflow-hidden shadow-sm bg-white">
            <object 
                data="/students-handbook-2018.pdf" 
                type="application/pdf" 
                width="100%" 
                height="100%"
                className="w-full h-full"
            >
                <p>
                    Your browser does not support PDFs. 
                    <a href="/students-handbook-2018.pdf" className="text-orange-600 hover:underline ml-1">
                        Download the PDF
                    </a>.
                </p>
            </object>
        </div>
    );
}
