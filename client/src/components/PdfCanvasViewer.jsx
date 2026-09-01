import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Spinner } from './ui/Spinner';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  MoveVertical,
} from 'lucide-react';

// Configure local pdfjs worker from bundle
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export function PdfCanvasViewer({ pdfBlobUrl }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [fitMode, setFitMode] = useState('page'); // 'page' | 'width'
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Drag & Pan tracking refs
  const dragStart = useRef({ mouseX: 0, mouseY: 0, startPanX: 0, startPanY: 0 });
  const touchStartDist = useRef(null);
  const touchStartScale = useRef(1.0);
  const touchStartPan = useRef({ x: 0, y: 0, clientX: 0, clientY: 0 });

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
      if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

      try {
        const page = await pdfDoc.getPage(1);
        const container = containerRef.current;
        const containerWidth = container.clientWidth || 800;
        const containerHeight = container.clientHeight || 600;

        const unscaledViewport = page.getViewport({ scale: 1.0 });

        let baseScale = 1.0;
        if (fitMode === 'page') {
          // Fit entire page in viewport with clean margins
          const scaleX = (containerWidth - 28) / unscaledViewport.width;
          const scaleY = (containerHeight - 28) / unscaledViewport.height;
          baseScale = Math.min(scaleX, scaleY);
        } else {
          // Fit to width for crisp full readability
          baseScale = Math.min((containerWidth - 36) / unscaledViewport.width, 1.45);
        }

        const finalScale = Math.max(0.35, baseScale * scale);
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

  // Handle Mouse Drag & Pan in ALL directions (Left, Right, Up, Down)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // only left click
    setIsDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.current.mouseX;
    const dy = e.clientY - dragStart.current.mouseY;
    setPan({
      x: dragStart.current.startPanX + dx,
      y: dragStart.current.startPanY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle Double Click to Zoom In / Reset toggle
  const handleDoubleClick = () => {
    if (scale > 1.2 || pan.x !== 0 || pan.y !== 0) {
      setScale(1.0);
      setPan({ x: 0, y: 0 });
    } else {
      setScale(1.75);
    }
  };

  // Handle Wheel Zoom (Ctrl+Wheel or Trackpad pinch)
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      setScale((prev) => Math.min(3.0, Math.max(0.35, Number((prev * zoomFactor).toFixed(2)))));
    }
  }, []);

  // Attach non-passive wheel listener for smooth Ctrl+Wheel zooming
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Touch Events for Mobile (1-finger drag/pan, 2-finger pinch-to-zoom)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      touchStartPan.current = {
        x: pan.x,
        y: pan.y,
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
      touchStartScale.current = scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      const dx = e.touches[0].clientX - touchStartPan.current.clientX;
      const dy = e.touches[0].clientY - touchStartPan.current.clientY;
      setPan({
        x: touchStartPan.current.x + dx,
        y: touchStartPan.current.y + dy,
      });
    } else if (e.touches.length === 2 && touchStartDist.current) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = touchStartScale.current * (dist / touchStartDist.current);
      setScale(Math.min(3.0, Math.max(0.35, Number(newScale.toFixed(2)))));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDist.current = null;
  };

  const handleReset = () => {
    setScale(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleToggleFit = () => {
    setFitMode((m) => (m === 'width' ? 'page' : 'width'));
    setScale(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Fallback to clean object view if PDF.js fails
  if (error) {
    return (
      <div className="w-full h-full flex-1 min-h-0 overflow-hidden rounded-xl bg-white no-scrollbar">
        <object
          data={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          type="application/pdf"
          className="w-full h-full border-0 rounded-xl no-scrollbar"
        >
          <p className="p-6 text-center text-sm text-slate-500">
            Preview is ready. Use Download PDF or Print buttons above.
          </p>
        </object>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex-1 min-h-0 flex flex-col bg-slate-100/90 rounded-xl overflow-hidden select-none no-scrollbar">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100/80 backdrop-blur-xs">
          <Spinner size="lg" className="text-brand-600 mb-2" />
          <span className="text-xs font-medium text-slate-500">Rendering tax invoice...</span>
        </div>
      )}

      {/* Floating Zoom and View Toolbar */}
      <div className="absolute bottom-3 right-3 sm:bottom-3.5 sm:right-3.5 z-20 flex items-center gap-1 sm:gap-1.5 bg-navy-950/90 backdrop-blur-md text-white px-2.5 sm:px-3 py-1.5 rounded-2xl shadow-xl border border-navy-700/60 max-w-[calc(100vw-32px)]">
        {/* Fit Toggle */}
        <button
          type="button"
          onClick={handleToggleFit}
          title={fitMode === 'width' ? 'Fit Whole Page' : 'Fit to Width'}
          className="px-2 py-1 text-[10px] sm:text-[11px] font-medium bg-white/10 hover:bg-white/20 rounded-lg transition active:scale-95 flex items-center gap-1 shrink-0"
        >
          {fitMode === 'width' ? (
            <>
              <Maximize2 className="w-3 h-3 text-brand-400" /> <span className="hidden xs:inline">Fit Page</span>
            </>
          ) : (
            <>
              <MoveVertical className="w-3 h-3 text-brand-400" /> <span className="hidden xs:inline">Fit Width</span>
            </>
          )}
        </button>

        <div className="w-px h-3.5 bg-white/20 mx-0.5 shrink-0" />

        {/* Zoom Out Button */}
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(0.35, Number((s - 0.2).toFixed(2))))}
          title="Zoom Out (Ctrl + Scroll Down)"
          className="p-1 hover:bg-white/10 rounded-lg transition active:scale-95 shrink-0"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Percentage Clickable Reset */}
        <button
          type="button"
          onClick={handleReset}
          title="Click to reset zoom and pan"
          className="text-[10px] sm:text-[11px] font-semibold font-mono px-1 min-w-[34px] sm:min-w-[40px] text-center hover:text-brand-300 transition shrink-0"
        >
          {Math.round(scale * 100)}%
        </button>

        {/* Zoom In Button */}
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(3.0, Number((s + 0.2).toFixed(2))))}
          title="Zoom In (Ctrl + Scroll Up)"
          className="p-1 hover:bg-white/10 rounded-lg transition active:scale-95 shrink-0"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3.5 bg-white/20 mx-0.5 shrink-0" />

        {/* Reset Zoom & Pan */}
        <button
          type="button"
          onClick={handleReset}
          title="Reset Zoom & Position"
          className="p-1 hover:bg-white/10 rounded-lg transition active:scale-95 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Infinite 2D Drag/Pan Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full flex-1 min-h-0 overflow-hidden relative flex items-center justify-center select-none transition-colors ${
          isDragging ? 'cursor-grabbing bg-slate-200/50' : 'cursor-grab'
        }`}
        style={{
          touchAction: 'none',
        }}
      >
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
            willChange: 'transform',
            transition: isDragging ? 'none' : 'transform 0.08s ease-out',
          }}
          className="flex items-center justify-center"
        >
          <canvas
            ref={canvasRef}
            className="bg-white rounded-lg shadow-xl border border-slate-300/80 pointer-events-none transition-shadow"
          />
        </div>
      </div>
    </div>
  );
}
