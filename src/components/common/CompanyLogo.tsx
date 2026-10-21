import React, { useState } from "react";
import { cn } from "../../lib/utils";

interface CompanyLogoProps {
  name: string;
  logoUrl?: string;
  websiteUrl?: string;
  className?: string;
  sizeClassName?: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  name,
  logoUrl,
  websiteUrl,
  className,
  sizeClassName = "w-10 h-10",
}) => {
  const [errorCount, setErrorCount] = useState<number>(0);

  // Extract domain for Logo.dev if key is available
  const logoDevKey = import.meta.env.VITE_LOGO_DEV_PUBLISHABLE_KEY;
  let domain = "";
  if (websiteUrl) {
    try {
      const url = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
      domain = url.hostname.replace(/^www\./, "");
    } catch {
      domain = "";
    }
  }

  const logoDevUrl = logoDevKey && domain ? `https://img.logo.dev/${domain}?token=${logoDevKey}` : "";

  // Priority: Logo.dev (if key & domain) -> DB logoUrl -> initial letter fallback
  let currentSrc = "";
  if (errorCount === 0 && logoDevUrl) {
    currentSrc = logoDevUrl;
  } else if ((errorCount <= 1 && logoUrl) || (errorCount === 0 && !logoDevUrl && logoUrl)) {
    currentSrc = logoUrl;
  }

  const initial = (name || "C").trim().charAt(0).toUpperCase();

  if (!currentSrc || errorCount >= 2) {
    return (
      <div
        className={cn(
          "shrink-0 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-700 select-none shadow-xs",
          sizeClassName,
          className
        )}
        aria-label={name}
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "shrink-0 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-1 shadow-xs",
        sizeClassName,
        className
      )}
    >
      <img
        src={currentSrc}
        alt={`${name} logo`}
        referrerPolicy="no-referrer"
        onError={() => setErrorCount((c) => c + 1)}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
