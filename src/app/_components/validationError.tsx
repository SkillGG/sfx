"use client";

import { type ValidationError, cn } from "@/utils";

type ValidationErrorDisplayProps = {
  errors: ValidationError[];
  field?: string;
  className?: string;
  compact?: boolean;
};

export const ValidationErrorDisplay = ({
  errors,
  field,
  className,
  compact = false,
}: ValidationErrorDisplayProps) => {
  // Filter errors by field if specified
  const filteredErrors = field
    ? errors.filter((error) => error.field === field)
    : errors;

  if (filteredErrors.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn(className)}>
        {filteredErrors.map((error, index) => (
          <div
            key={`${error.field}-${index}`}
            className={cn(
              "flex items-center gap-1 text-xs text-red-600 dark:text-red-400",
            )}
          >
            <svg
              className={cn("h-3 w-3 flex-shrink-0")}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error.message}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("mt-1 space-y-1", className)}>
      {filteredErrors.map((error, index) => (
        <div
          key={`${error.field}-${index}`}
          className={cn(
            "flex items-start gap-2 rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400",
          )}
        >
          <svg
            className={cn("mt-0.5 h-4 w-4 flex-shrink-0")}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">{error.message}</div>
        </div>
      ))}
    </div>
  );
};

type ValidationErrorSummaryProps = {
  errors: ValidationError[];
  className?: string;
  title?: string;
};

export const ValidationErrorSummary = ({
  errors,
  className,
  title = "Please fix the following errors:",
}: ValidationErrorSummaryProps) => {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <svg
          className={cn(
            "mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400",
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <div className="flex-1">
          <h3
            className={cn("text-sm font-medium text-red-800 dark:text-red-200")}
          >
            {title}
          </h3>
          <div className="mt-2 space-y-1">
            {errors.map((error, index) => (
              <div
                key={`${error.field}-${index}`}
                className={cn("text-sm text-red-700 dark:text-red-300")}
              >
                <span className="font-medium capitalize">
                  {error.field.replace(/([A-Z])/g, " $1").toLowerCase()}:
                </span>{" "}
                {error.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
