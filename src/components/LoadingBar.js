import React from "react";
import { LoadingSquares } from "./Loading";

function LoadingBar({ isLoading = true, offsetClass = "top-20" }) {
  if (!isLoading) return null;

  return (
    <div
      className={`fixed ${offsetClass} left-0 right-0 z-[9999] flex justify-center pt-2 pointer-events-none`}
      aria-hidden={!isLoading}
    >
      <div className="rounded-full bg-white/95 shadow-md px-3 py-2 border border-gray-100">
        <LoadingSquares size="sm" />
      </div>
    </div>
  );
}

export default LoadingBar;
