import React from "react";
import { ExternalLink, Star, Mail, PlayCircle } from "lucide-react";
import { isNullish, splitItems } from "../../lib/companyData";
import { cn } from "../../lib/utils";

interface FieldRowProps {
  label: string;
  value: string | number;
  type?: "text" | "url" | "video" | "rating" | "email" | "badge-list";
  className?: string;
}

export const FieldRow: React.FC<FieldRowProps> = React.memo(({ label, value, type, className }) => {
  const strValue = String(value ?? "").trim();

  if (isNullish(strValue)) {
    return (
      <div className={cn("py-3 sm:py-3.5 flex flex-col sm:flex-row gap-1 sm:gap-4 border-b border-slate-100 last:border-0", className)}>
        <span className="sm:w-1/3 text-xs sm:text-sm font-medium text-slate-500 shrink-0">{label}</span>
        <div className="sm:w-2/3 flex items-center">
          <span className="text-xs text-slate-400 italic bg-slate-50 border border-slate-200/80 rounded px-2 py-0.5">
            Not Available
          </span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // 1. Email
    if (type === "email" || (strValue.includes("@") && !strValue.includes(" ") && !strValue.includes(";"))) {
      return (
        <a
          href={`mailto:${strValue}`}
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline break-all"
        >
          <Mail className="w-3.5 h-3.5 shrink-0 text-blue-500" />
          <span>{strValue}</span>
        </a>
      );
    }

    // 2. Video URL
    if (type === "video" || strValue.includes("youtube.com") || strValue.includes("vimeo.com")) {
      return (
        <a
          href={strValue}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1 rounded-md text-xs font-medium transition-colors"
        >
          <PlayCircle className="w-3.5 h-3.5 shrink-0 text-purple-600" />
          <span>Watch Corporate Media</span>
          <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
        </a>
      );
    }

    // 3. URL
    if (type === "url" || strValue.startsWith("http://") || strValue.startsWith("https://")) {
      return (
        <a
          href={strValue}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline break-all"
        >
          <span>{strValue}</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-blue-500" />
        </a>
      );
    }

    // 4. Rating (e.g. "4.1/5" or contains "/5")
    if (type === "rating" || (strValue.includes("/5") && strValue.length < 10)) {
      return (
        <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-0.5 rounded-md text-xs font-semibold">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
          <span>{strValue}</span>
        </div>
      );
    }

    // 5. Multi-item list (contains semicolons or bullets)
    const items = splitItems(strValue);
    if (items.length > 1) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-xs font-medium bg-slate-100/90 text-slate-800 border border-slate-200/90 rounded px-2.5 py-1"
            >
              {item}
            </span>
          ))}
        </div>
      );
    }

    // 6. Paragraph or regular text
    if (strValue.length > 120) {
      return <p className="text-sm text-slate-700 leading-relaxed">{strValue}</p>;
    }

    // Default inline text
    return <span className="text-sm text-slate-800 font-medium">{strValue}</span>;
  };

  return (
    <div className={cn("py-3 sm:py-3.5 flex flex-col sm:flex-row gap-1 sm:gap-4 border-b border-slate-100 last:border-0", className)}>
      <span className="sm:w-1/3 text-xs sm:text-sm font-medium text-slate-500 shrink-0">{label}</span>
      <div className="sm:w-2/3">{renderContent()}</div>
    </div>
  );
});

FieldRow.displayName = "FieldRow";
