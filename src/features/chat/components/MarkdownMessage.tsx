import { useState, type ReactNode, isValidElement } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Check, Copy } from 'lucide-react';
import 'highlight.js/styles/atom-one-dark.css';

type Accent = 'teal' | 'gold';

interface MarkdownMessageProps {
  /** Raw markdown string (assistant message content). */
  content: string;
  /** Accent palette used for links / code chrome. */
  accent?: Accent;
}

/** Recursively flattens React children into a plain string (for copy buttons). */
function nodeToString(node: ReactNode): string {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToString).join('');
  if (isValidElement(node)) {
    return nodeToString((node.props as { children?: ReactNode }).children);
  }
  return '';
}

/** Fenced code block with a hover "copy" affordance and syntax highlighting. */
function CodeBlock({ children, accent }: { children: ReactNode; accent: Accent }) {
  const [copied, setCopied] = useState(false);
  const code = nodeToString(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  const ring = accent === 'gold' ? 'focus-visible:ring-gold-400/50' : 'focus-visible:ring-teal-400/50';

  return (
    <div className="group/code relative my-2.5 first:mt-0 last:mb-0">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className={`absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 text-white/70 opacity-0 backdrop-blur-sm transition-all duration-200 hover:bg-black/60 hover:text-white focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 group-hover/code:opacity-100 ${ring}`}
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
      <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3.5 font-mono text-[0.8rem] leading-relaxed [&_code]:!bg-transparent [&_code]:!p-0">
        {children}
      </pre>
    </div>
  );
}

/** Builds the react-markdown component map for the given accent. */
function buildComponents(accent: Accent): Components {
  const linkColor = accent === 'gold' ? 'text-gold-300 hover:text-gold-200' : 'text-teal-300 hover:text-teal-200';

  return {
    p: ({ children }) => (
      <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>
    ),
    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    del: ({ children }) => <del className="text-white/50">{children}</del>,
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`font-medium underline decoration-white/30 underline-offset-2 transition-colors ${linkColor}`}
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="my-2 list-disc space-y-1 pl-5 marker:text-white/40 first:mt-0 last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-white/40 first:mt-0 last:mb-0">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed [&>ul]:my-1 [&>ol]:my-1">{children}</li>,
    h1: ({ children }) => (
      <h1 className="mb-2 mt-3 font-sans text-lg font-bold normal-case leading-snug text-white first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-2 mt-3 font-sans text-base font-bold normal-case leading-snug text-white first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-1.5 mt-2.5 font-sans text-sm font-bold normal-case leading-snug text-white first:mt-0">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="mb-1.5 mt-2 font-sans text-sm font-semibold normal-case leading-snug text-white/90 first:mt-0">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className={`my-2.5 border-l-2 pl-3 italic text-white/70 first:mt-0 last:mb-0 ${
          accent === 'gold' ? 'border-gold-400/60' : 'border-teal-400/60'
        }`}
      >
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-3 border-white/10" />,
    code: ({ className, children, ...props }) => {
      // rehype-highlight only adds a `language-*`/`hljs` class to fenced blocks;
      // inline code stays class-less, so this reliably distinguishes the two.
      if (className) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className="rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[0.82em] text-white">
          {children}
        </code>
      );
    },
    pre: ({ children }) => <CodeBlock accent={accent}>{children}</CodeBlock>,
    table: ({ children }) => (
      <div className="my-2.5 overflow-x-auto first:mt-0 last:mb-0">
        <table className="w-full border-collapse text-left text-[0.82rem]">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="border-b border-white/15">{children}</thead>,
    th: ({ children }) => <th className="px-2.5 py-1.5 font-semibold text-white">{children}</th>,
    td: ({ children }) => <td className="border-t border-white/5 px-2.5 py-1.5 text-white/80">{children}</td>,
    img: ({ src, alt }) => (
      <img src={typeof src === 'string' ? src : undefined} alt={alt} className="my-2 max-w-full rounded-xl" loading="lazy" />
    ),
  };
}

const TEAL_COMPONENTS = buildComponents('teal');
const GOLD_COMPONENTS = buildComponents('gold');

/**
 * Renders an assistant message as rich markdown — bold/italics, ordered &
 * unordered lists, headings, blockquotes, tables, inline & fenced code with
 * syntax highlighting, and auto-linked URLs (via remark-gfm). User messages
 * stay plain text and never reach this component.
 */
export function MarkdownMessage({ content, accent = 'gold' }: MarkdownMessageProps) {
  return (
    <div className="text-sm text-white [overflow-wrap:anywhere]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={accent === 'gold' ? GOLD_COMPONENTS : TEAL_COMPONENTS}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
