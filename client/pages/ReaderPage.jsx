import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ReaderPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [manga, setManga] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setManga(null);
      const { data } = await api.get(`/manga/${id}`);
      if (!mounted) return;
      setManga(data.manga);
      if (user) {
        const progress = await api.get(`/progress/${id}`);
        if (mounted && progress.data.page > 1 && searchParams.get('resume')) setPageNumber(progress.data.page);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id, user?.uid]);

  useEffect(() => {
    if (!user || !manga) return;
    const timer = setTimeout(() => {
      api.post(`/progress/${id}`, { page: pageNumber });
    }, 800);
    return () => clearTimeout(timer);
  }, [pageNumber, id, user?.uid, manga]);

  const containerClass = useMemo(() => (fullscreen ? 'fixed inset-0 z-50 overflow-auto bg-black p-2' : ''), [fullscreen]);

  if (!manga) return <div className="mx-auto max-w-3xl animate-pulse rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">Loading reader...</div>;

  return (
    <div className={containerClass}>
      <div className="mx-auto w-full max-w-5xl space-y-3 pb-20">
        <div className="sticky top-16 z-10 flex items-center justify-between rounded-xl bg-slate-900/95 p-3 backdrop-blur">
          <h1 className="truncate text-sm font-medium">{manga.title}</h1>
          <div className="flex items-center gap-2">
            <button className="rounded bg-slate-800 p-1" onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}><ZoomOut size={16} /></button>
            <button className="rounded bg-slate-800 p-1" onClick={() => setScale((s) => Math.min(2, s + 0.1))}><ZoomIn size={16} /></button>
            <button className="rounded bg-slate-800 p-1" onClick={() => setFullscreen((f) => !f)}>{fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
          </div>
        </div>

        <div className="flex justify-center rounded-2xl border border-slate-800 bg-slate-900 p-2 sm:p-4">
          <Document file={manga.pdfUrl} onLoadSuccess={({ numPages: total }) => setNumPages(total)} loading={<p className="p-10 text-slate-400">Loading PDF...</p>}>
            <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} width={Math.min(window.innerWidth - 32, 900)} />
          </Document>
        </div>
      </div>

      <div className="fixed bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900/95 px-3 py-2 text-sm backdrop-blur">
        <button onClick={() => setPageNumber((p) => Math.max(1, p - 1))} className="rounded bg-slate-800 px-2 py-1">Prev</button>
        <span>{pageNumber} / {numPages || 1}</span>
        <button onClick={() => setPageNumber((p) => Math.min(numPages || 1, p + 1))} className="rounded bg-slate-800 px-2 py-1">Next</button>
      </div>
    </div>
  );
};

export default ReaderPage;
