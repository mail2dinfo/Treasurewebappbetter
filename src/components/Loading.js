import React from "react";

const sizeClass = {
  sm: "page-loading-squares--sm",
  md: "page-loading-squares--md",
  lg: "page-loading-squares--lg",
};

export const LoadingSquares = ({ size = "md" }) => (
  <div
    className={`page-loading-squares ${sizeClass[size] || sizeClass.md}`}
    role="status"
    aria-label="Loading"
  >
    {[0, 1, 2, 3, 4].map((index) => (
      <span
        key={index}
        className="page-loading-square"
        style={{ animationDelay: `${index * 0.12}s` }}
      />
    ))}
  </div>
);

const Loading = ({
  size = "md",
  className = "",
  label,
  fullscreen = false,
}) => {
  const body = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <LoadingSquares size={size} />
      {label ? (
        <p className="mt-3 text-sm font-medium text-gray-600">{label}</p>
      ) : null}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] w-full py-12">
        {body}
      </div>
    );
  }

  return body;
};

export default Loading;
