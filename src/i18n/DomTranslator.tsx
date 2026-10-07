import { useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { arDictionary } from './dictionary.ar';

// Phrase-level Arabic for every static UI string that isn't routed through
// t() — i.e. most screens. In Arabic mode this watches the DOM and replaces
// text nodes / placeholder / title / aria-label / alt whose English matches
// the dictionary (exact phrase, or a "{0}" template for interpolated text).
// Originals are remembered so switching back to English restores them.
//
// The dictionary (./dictionary.ar.ts) is generated from the source's JSX
// text and UI string literals. New UI text should prefer t() keys; anything
// missing from both simply stays English.

type Template = { regex: RegExp; arabic: string };

const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();

const exact = new Map<string, string>();
const templates: Template[] = [];

for (const [english, arabic] of Object.entries(arDictionary)) {
  const key = normalize(english);
  if (!key || !arabic) continue;
  if (/\{\d+\}/.test(key)) {
    // "Asset listing \"{0}\" deleted" → /^Asset listing "(.+?)" deleted$/
    const pattern = key
      .split(/(\{\d+\})/)
      .map(part => (/^\{\d+\}$/.test(part) ? '(.+?)' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      .join('');
    // Skip templates that are only placeholders/punctuation (would match anything).
    if (key.replace(/\{\d+\}|[\s\W]/g, '').length < 2) continue;
    templates.push({ regex: new RegExp(`^${pattern}$`), arabic });
  } else {
    exact.set(key, arabic);
  }
}
// Longer (more specific) templates first.
templates.sort((a, b) => b.regex.source.length - a.regex.source.length);

function translateText(raw: string): string | null {
  const text = normalize(raw);
  if (!text || !/[A-Za-z]/.test(text)) return null;
  const hit = exact.get(text);
  if (hit) return hit;
  for (const { regex, arabic } of templates) {
    const m = regex.exec(text);
    if (m) {
      return arabic.replace(/\{(\d+)\}/g, (_, i) => {
        const value = m[Number(i) + 1] ?? '';
        // Translate an interpolated value too when it's itself a known phrase.
        return exact.get(normalize(value)) ?? value;
      });
    }
  }
  return null;
}

const ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'] as const;
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'NOSCRIPT']);

// Originals, so English can be restored; lastWritten guards against
// re-translating our own writes (MutationObserver sees them too).
const textOriginals = new Map<Text, string>();
const textLastWritten = new WeakMap<Text, string>();
const attrOriginals = new Map<Element, Map<string, string>>();

function skipNode(el: Element | null): boolean {
  for (let n = el; n; n = n.parentElement) {
    if (SKIP_TAGS.has(n.tagName)) return true;
    if (n instanceof HTMLElement && (n.isContentEditable || n.dataset.noTranslate !== undefined)) return true;
  }
  return false;
}

function translateTextNode(node: Text) {
  const value = node.nodeValue ?? '';
  if (textLastWritten.get(node) === value) return; // our own write
  if (skipNode(node.parentElement)) return;
  const arabic = translateText(value);
  if (arabic === null) return;
  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  textOriginals.set(node, value);
  const next = `${leading}${arabic}${trailing}`;
  textLastWritten.set(node, next);
  node.nodeValue = next;
}

function translateAttributes(el: Element) {
  if (skipNode(el)) return;
  for (const attr of ATTRIBUTES) {
    const value = el.getAttribute(attr);
    if (!value) continue;
    const saved = attrOriginals.get(el)?.get(attr);
    // Already translated by us and unchanged since.
    if (saved !== undefined && value !== saved && translateText(saved) === value) continue;
    const arabic = translateText(value);
    if (arabic === null) continue;
    if (!attrOriginals.has(el)) attrOriginals.set(el, new Map());
    attrOriginals.get(el)!.set(attr, value);
    el.setAttribute(attr, arabic);
  }
}

function translateTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  translateAttributes(el);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) translateTextNode(n as Text);
    else translateAttributes(n as Element);
  }
}

function restoreEnglish() {
  for (const [node, original] of textOriginals) {
    if (node.isConnected && node.nodeValue === textLastWritten.get(node)) node.nodeValue = original;
  }
  textOriginals.clear();
  for (const [el, attrs] of attrOriginals) {
    if (!el.isConnected) continue;
    for (const [attr, original] of attrs) el.setAttribute(attr, original);
  }
  attrOriginals.clear();
}

export const DomTranslator = () => {
  const { language } = useLanguage();

  useEffect(() => {
    if (language !== 'ar') {
      restoreEnglish();
      return;
    }
    translateTree(document.body);

    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'characterData') translateTextNode(m.target as Text);
        else if (m.type === 'attributes') translateAttributes(m.target as Element);
        else m.addedNodes.forEach(n => translateTree(n));
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTES],
    });

    // Drop references to nodes that left the DOM (keeps the maps small).
    const sweep = window.setInterval(() => {
      for (const node of textOriginals.keys()) if (!node.isConnected) textOriginals.delete(node);
      for (const el of attrOriginals.keys()) if (!el.isConnected) attrOriginals.delete(el);
    }, 30000);

    return () => {
      observer.disconnect();
      window.clearInterval(sweep);
    };
  }, [language]);

  return null;
};
