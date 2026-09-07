"use client";

import dynamic from "next/dynamic";

/** react-markdown and remark-gfm are only needed once a result or agent output is opened. */
export const Markdown = dynamic(() => import("./MarkdownContent").then((m) => m.MarkdownContent), {
  loading: () => <p className="text-sm text-muted-foreground">Rendering...</p>,
});
