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
    api.get(`/manga/${id}`).then(({ data }) => setManga(data.manga));
  }, [id]);

  if (!manga) return <p>Loading reader...</p>;

  return (
    <div className={`space-y-3 ${fullscreen ? 'fixed inset-0 z-50 overflow-auto bg-black p-4' : ''}`}>
      <div className="flex items-center justify-between rounded-xl bg-slate-900 p-3">
        <h1 className="text-sm font-medium">{manga.title}</h1>
        <div className="flex gap-2">
          <button onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}><ZoomOut size={16} /></button>
          <button onClick={() => setScale((s) => Math.min(2, s + 0.1))}><ZoomIn size={16} /></button>
          <button onClick={() => setFullscreen((f) => !f)}>{fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
        </div>
      </div>

      <div className="flex justify-center">
        <Document file={manga.pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)} loading={<p>Loading PDF...</p>}>
          <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm">
        <button onClick={() => setPageNumber((p) => Math.max(1, p - 1))} className="rounded bg-slate-800 px-2 py-1">Prev</button>
        <span>{pageNumber} / {numPages || 1}</span>
        <button onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))} className="rounded bg-slate-800 px-2 py-1">Next</button>
      </div>
    </div>
  );
};

export default ReaderPage;
