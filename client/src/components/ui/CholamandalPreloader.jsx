import React, { useState, useEffect, useRef } from "react";

const LOGO_SRC = "/logo.png";
const CLOUDINARY_FALLBACK_LOGO = "https://res.cloudinary.com/rlokioxu/image/upload/v1788252768/CCC-Logo_dzceec.png";

// Brand tokens pulled from the Cholamandal Cargo Connections mark
const NAVY = "#032143";
const NAVY_SOFT = "#0a2e52";
const ORANGE = "#fc6713";
const BLUE = "#0cacfa";
const MIST = "#f5f7fa";

function usePreloadProgress(active, duration = 2600, onDone) {
  const [progress, setProgress] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    doneRef.current = false;
    startRef.current = null;
    setProgress(0);

    const tick = (t) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      // ease-out cubic so the bar settles rather than ticking linearly
      const raw = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - raw, 3);
      setProgress(eased);
      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current?.();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [active, duration]);

  return progress;
}

/**
 * CholamandalPreloader
 *
 * Drop this at the root of the app. Pass `loading` to control it yourself
 * (e.g. tie it to your data-fetch / auth check), or omit it and it will
 * run for `duration` ms and then reveal `children` on its own.
 *
 * Usage:
 *   <CholamandalPreloader loading={isBooting}>
 *     <App />
 *   </CholamandalPreloader>
 */
export function CholamandalPreloader({
  loading,
  duration = 2600,
  children,
  onFinish,
}) {
  const controlled = typeof loading === "boolean";
  const [internalLoading, setInternalLoading] = useState(true);
  const isLoading = controlled ? loading : internalLoading;
  const [hidden, setHidden] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const progress = usePreloadProgress(
    !controlled && isLoading,
    duration,
    () => setInternalLoading(false)
  );

  // when isLoading flips to false (controlled or self-timed), run exit fade
  useEffect(() => {
    if (!isLoading && !hidden) {
      setLeaving(true);
      const t = setTimeout(() => {
        setHidden(true);
        onFinishRef.current?.();
      }, 520);
      return () => clearTimeout(t);
    }
  }, [isLoading, hidden]);

  const pct = controlled ? null : Math.round(progress * 100);

  return (
    <>
      {!hidden && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `radial-gradient(circle at 50% 42%, ${MIST} 0%, #ffffff 60%)`,
            opacity: leaving ? 0 : 1,
            transition: "opacity 520ms ease",
            pointerEvents: leaving ? "none" : "auto",
          }}
          role="status"
          aria-live="polite"
          aria-label="Loading Cholamandal Cargo Connections"
        >
          <style>{`
            @keyframes ccc-spin-cw {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes ccc-spin-ccw {
              from { transform: rotate(0deg); }
              to { transform: rotate(-360deg); }
            }
            @keyframes ccc-breathe {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.035); }
            }
            @keyframes ccc-rise {
              0% { opacity: 0; transform: translateY(10px) scale(0.96); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes ccc-dash {
              to { stroke-dashoffset: -400; }
            }
            .ccc-reduced-motion {
              animation: none !important;
            }
            @media (prefers-reduced-motion: reduce) {
              .ccc-orbit, .ccc-orbit-track, .ccc-logo-wrap {
                animation: none !important;
              }
            }
          `}</style>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "28px",
              animation: "ccc-rise 620ms cubic-bezier(0.22, 1, 0.36, 1) both",
            }}
          >
            {/* Orbit + logo */}
            <div
              style={{
                position: "relative",
                width: 220,
                height: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* outer dashed track, slow clockwise - the shipping route */}
              <svg
                className="ccc-orbit-track"
                width="220"
                height="220"
                viewBox="0 0 220 220"
                style={{
                  position: "absolute",
                  inset: 0,
                  animation: "ccc-spin-cw 9s linear infinite",
                }}
              >
                <circle
                  cx="110"
                  cy="110"
                  r="102"
                  fill="none"
                  stroke={BLUE}
                  strokeOpacity="0.28"
                  strokeWidth="2"
                  strokeDasharray="1 11"
                  strokeLinecap="round"
                />
              </svg>

              {/* inner arc trio echoing the mark's own swoosh, opposite spin */}
              <svg
                className="ccc-orbit"
                width="220"
                height="220"
                viewBox="0 0 220 220"
                style={{
                  position: "absolute",
                  inset: 0,
                  animation: "ccc-spin-ccw 3.4s cubic-bezier(0.65, 0, 0.35, 1) infinite",
                }}
              >
                <circle
                  cx="110"
                  cy="110"
                  r="94"
                  fill="none"
                  stroke={BLUE}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="70 400"
                />
                <circle
                  cx="110"
                  cy="110"
                  r="94"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="46 400"
                  strokeDashoffset="-150"
                />
                <circle
                  cx="110"
                  cy="110"
                  r="94"
                  fill="none"
                  stroke={NAVY}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="34 400"
                  strokeDashoffset="-230"
                />
              </svg>

              {/* logo mark */}
              <div
                className="ccc-logo-wrap"
                style={{
                  width: 136,
                  height: 136,
                  borderRadius: "50%",
                  background: "#ffffff",
                  boxShadow: "0 8px 30px rgba(3, 33, 67, 0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "ccc-breathe 2.6s ease-in-out infinite",
                }}
              >
                <img
                  src={LOGO_SRC}
                  onError={(e) => {
                    if (e.currentTarget.src !== CLOUDINARY_FALLBACK_LOGO) {
                      e.currentTarget.src = CLOUDINARY_FALLBACK_LOGO;
                    }
                  }}
                  alt="Cholamandal Cargo Connections"
                  style={{ width: 92, height: 92, objectFit: "contain" }}
                  draggable={false}
                />
              </div>
            </div>

            {/* status line */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                minWidth: 220,
              }}
            >
              <div
                style={{
                  width: 180,
                  height: 4,
                  borderRadius: 999,
                  background: "#e6eaf0",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    width: controlled ? "70%" : `${Math.max(6, progress * 100)}%`,
                    background: `linear-gradient(90deg, ${BLUE}, ${ORANGE})`,
                    transition: controlled ? "width 400ms ease" : "none",
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily:
                    "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                  fontSize: 12.5,
                  letterSpacing: "0.04em",
                  color: NAVY_SOFT,
                  opacity: 0.75,
                }}
              >
                {controlled
                  ? "Connecting your shipment..."
                  : `Loading network - ${pct}%`}
              </div>
            </div>
          </div>
        </div>
      )}

      {children}
    </>
  );
}

export default CholamandalPreloader;
