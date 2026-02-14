import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import api from '../services/api';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ReaderPage = () => {
  const { id } = useParams();
  const [manga, setManga] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    setManga(null);
    api.get(`/manga/${id}`).then(({ data }) => setManga(data.manga));
  }, [id]);

  if (!manga) {
    return <div className="mx-auto max-w-3xl animate-pulse rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">Loading reader...</div>;
  }

  return (
    <div className={`${fullscreen ? 'fixed inset-0 z-50 overflow-auto bg-black p-4' : ''}`}>
      <div className="mx-auto max-w-4xl space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-slate-900 p-3">
          <h1 className="truncate text-sm font-medium">{manga.title}</h1>
          <div className="flex gap-2">
            <button onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}><ZoomOut size={16} /></button>
            <button onClick={() => setScale((s) => Math.min(2, s + 0.1))}><ZoomIn size={16} /></button>
            <button onClick={() => setFullscreen((f) => !f)}>{fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
          </div>
        </div>

        <div className="flex justify-center rounded-2xl border border-slate-800 bg-slate-900 p-2 sm:p-4">
          <Document
            file={manga.pdfUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<p className="p-10 text-slate-400">Loading PDF...</p>}
          >
            <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
          </Document>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm">
          <button onClick={() => setPageNumber((p) => Math.max(1, p - 1))} className="rounded bg-slate-800 px-2 py-1">Prev</button>
          <span>{pageNumber} / {numPages || 1}</span>
          <button onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))} className="rounded bg-slate-800 px-2 py-1">Next</button>
        </div>
      </div>
    </div>
  );
};

export default ReaderPage;
