'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LaTeXRendererProps {
  content: string;
  className?: string;
}

export function LaTeXRenderer({ content, className = '' }: LaTeXRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Process the content to find LaTeX expressions
    const processedContent = renderLatexInText(content);
    containerRef.current.innerHTML = processedContent;
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className={`latex-content ${className}`}
    />
  );
}

function renderLatexInText(text: string): string {
  // Handle display math ($$...$$ or \[...\])
  let processed = text.replace(
    /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g,
    (match, p1, p2) => {
      const latex = p1 || p2;
      try {
        return katex.renderToString(latex, {
          displayMode: true,
          throwOnError: false,
          trust: true,
          strict: false
        });
      } catch (error) {
        console.warn('LaTeX display math rendering error:', error);
        return `<span class="text-red-500 bg-red-50 px-2 py-1 rounded text-sm">LaTeX Error: ${match}</span>`;
      }
    }
  );

  // Handle inline math ($...$ or \(...\))
  processed = processed.replace(
    /\$([^$\n]+?)\$|\\\((.*?)\\\)/g,
    (match, p1, p2) => {
      const latex = p1 || p2;
      try {
        return katex.renderToString(latex, {
          displayMode: false,
          throwOnError: false,
          trust: true,
          strict: false
        });
      } catch (error) {
        console.warn('LaTeX inline math rendering error:', error);
        return `<span class="text-red-500 bg-red-50 px-1 rounded text-xs">LaTeX Error: ${match}</span>`;
      }
    }
  );

  // Handle line breaks and preserve formatting
  processed = processed.replace(/\n/g, '<br />');

  return processed;
}

// Helper component for inline LaTeX in regular text
export function InlineMath({ latex }: { latex: string }) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) {
      try {
        spanRef.current.innerHTML = katex.renderToString(latex, {
          displayMode: false,
          throwOnError: false,
          trust: true,
          strict: false
        });
      } catch (error) {
        console.warn('Inline LaTeX rendering error:', error);
        if (spanRef.current) {
          spanRef.current.innerHTML = `<span class="text-red-500">LaTeX Error</span>`;
        }
      }
    }
  }, [latex]);

  return <span ref={spanRef} />;
}

// Helper component for display LaTeX
export function DisplayMath({ latex }: { latex: string }) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current) {
      try {
        divRef.current.innerHTML = katex.renderToString(latex, {
          displayMode: true,
          throwOnError: false,
          trust: true,
          strict: false
        });
      } catch (error) {
        console.warn('Display LaTeX rendering error:', error);
        if (divRef.current) {
          divRef.current.innerHTML = `<div class="text-red-500 bg-red-50 p-2 rounded">LaTeX Error</div>`;
        }
      }
    }
  }, [latex]);

  return <div ref={divRef} className="my-2 text-center" />;
}