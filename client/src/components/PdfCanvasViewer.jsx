import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Spinner } from './ui/Spinner';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, MoveVertical } from 'lucide-react';

// Configure local pdfjs worker from bundle
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export function PdfCanvasViewer({ pdfBlobUrl }) {
  const canvasRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [fitMode, setFitMode] = useState('width'); // 'width' | 'page'

  useEffect(() => {
    let isCancelled = false;

    async function renderDoc() {
      if (!pdfBlobUrl) return;
      setLoading(true);
      setError(false);

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfBlobUrl,
          cMapPacked: true,
        });
        const doc = await loadingTask.promise;
        if (isCancelled) return;
        setPdfDoc(doc);
      } catch (err) {
        if (isCancelled) return;
        console.warn('PDF.js canvas init failed, falling back to object viewer:', err);
        setError(true);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    renderDoc();

    return () => {
      isCancelled = true;
    };
  }, [pdfBlobUrl]);

  useEffect(() => {
    let renderTask = null;

    async function drawPage() {
      if (!pdfDoc || !canvasRef.current || !scrollContainerRef.current) return;

      try {
        const page = await pdfDoc.getPage(1);
        const container = scrollContainerRef.current;
        const containerWidth = container.clientWidth || 800;
        const containerHeight = container.clientHeight || 700;

        const unscaledViewport = page.getViewport({ scale: 1.0 });

        let baseScale = 1.0;
        if (fitMode === 'page') {
          // Fit entire page in viewport
          const scaleX = (containerWidth - 36) / unscaledViewport.width;
          const scaleY = (containerHeight - 36) / unscaledViewport.height;
          baseScale = Math.min(scaleX, scaleY);
        } else {
          // Fit to width for crisp full readability
          baseScale = Math.min((containerWidth - 48) / unscaledViewport.width, 1.45);
        }

        const finalScale = Math.max(0.5, baseScale * scale);
        const viewport = page.getViewport({ scale: finalScale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // High-DPI Retina support
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        const renderContext = {
          canvasContext: context,
          transform,
          viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Canvas render notice:', err);
        }
      }
    }

    drawPage();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, scale, fitMode]);

  // Fallback to clean object view if PDF.js fails
  if (error) {
    return (
      <div className="w-full h-full flex-1 overflow-hidden rounded-xl bg-white no-scrollbar">
        <object
          data={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          type="application/pdf"
          className="w-full h-full min-h-[580px] border-0 rounded-xl no-scrollbar"
        >
          <p className="p-6 text-center text-sm text-slate-500">
            Preview is ready. Use Download PDF or Print buttons above.
          </p>
        </object>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex-1 min-h-[580px] flex flex-col bg-slate-100/90 rounded-xl overflow-hidden select-none no-scrollbar">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100/80 backdrop-blur-xs">
          <Spinner size="lg" className="text-brand-600 mb-2" />
          <span className="text-xs font-medium text-slate-500">Rendering tax invoice...</span>
        </div>
      )}

      {/* Floating Zoom and View toolbar */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-navy-950/85 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl shadow-xl border border-navy-700/60">
        <button
          type="button"
          onClick={() => {
            setFitMode((m) => (m === 'width' ? 'page' : 'width'));
            setScale(1.0);
          }}
          title={fitMode === 'width' ? 'Fit Whole Page' : 'Fit to Width'}
          className="px-2 py-1 text-[11px] font-medium bg-white/10 hover:bg-white/20 rounded-lg transition active:scale-95 flex items-center gap-1"
        >
          {fitMode === 'width' ? (
            <>
              <Maximize2 className="w-3 h-3" /> <span>Fit Page</span>
            </>
          ) : (
            <>
              <MoveVertical className="w-3 h-3" /> <span>Fit Width</span>
            </>
          )}
        </button>

        <div className="w-px h-3.5 bg-white/20 mx-0.5" />

        <button
          type="button"
          onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
          title="Zoom Out"
          className="p-1 hover:bg-white/10 rounded-lg transition active:scale-95"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-semibold font-mono px-1 min-w-[38px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}
          title="Zoom In"
          className="p-1 hover:bg-white/10 rounded-lg transition active:scale-95"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3.5 bg-white/20 mx-0.5" />

        <button
          type="button"
          onClick={() => setScale(1.0)}
          title="Reset Zoom"
          className="p-1 hover:bg-white/10 rounded-lg transition active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Smooth scrollable container with 100% hidden scrollbars */}
      <div
        ref={scrollContainerRef}
        className="w-full flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 flex justify-center items-start no-scrollbar"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          className="bg-white rounded-lg shadow-2xl border border-slate-300/80 mx-auto transition-all"
        />
      </div>
    </div>
  );
}
