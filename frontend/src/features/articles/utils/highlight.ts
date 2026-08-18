/** Lightweight, dependency-free syntax highlighting (regex tokenizer). */

type TokenRule = [RegExp, string]

const TOKENIZERS: Record<string, TokenRule[]> = {
  javascript: [
    [/\b(const|let|var|function|return|import|export|from|async|await|if|else|for|while|class|new|typeof)\b/g, "kw"],
    [/\b(true|false|null|undefined)\b/g, "lit"],
    [/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g, "str"],
    [/\b\d+(?:\.\d+)?\b/g, "num"],
    [/(\/\/.*$)/gm, "cmt"],
  ],
  python: [
    [/\b(def|class|return|import|from|if|elif|else|for|while|try|except|with|as|lambda|yield)\b/g, "kw"],
    [/\b(None|True|False)\b/g, "lit"],
    [/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g, "str"],
    [/\b\d+(?:\.\d+)?\b/g, "num"],
    [/(#.*$)/gm, "cmt"],
  ],
  bash: [
    [/\b(if|then|else|fi|for|do|done|export|echo|cd|sudo|docker|npm|python|curl)\b/g, "kw"],
    [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, "str"],
    [/(#.*$)/gm, "cmt"],
  ],
  sql: [
    [/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN|GROUP|BY|ORDER|LIMIT|CREATE|TABLE|INTO|VALUES|AND|OR|NOT|NULL|PRIMARY|KEY|REFERENCES)\b/gi, "kw"],
    [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, "str"],
    [/\b\d+(?:\.\d+)?\b/g, "num"],
  ],
  json: [
    [/"(?:[^"\\]|\\.)*"/g, "str"],
    [/\b(true|false|null)\b/g, "lit"],
    [/\b-?\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/gi, "num"],
  ],
  text: [],
}

const TOKEN_COLORS: Record<string, string> = {
  kw: "text-violet-500 dark:text-violet-300",
  str: "text-emerald-600 dark:text-emerald-300",
  num: "text-amber-600 dark:text-amber-300",
  lit: "text-sky-600 dark:text-sky-300",
  cmt: "text-slate-400 italic",
}

function escapeHtml(code: string): string {
  return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/** Highlight code with a single combined pass (avoids nested span corruption). */
export function highlight(code: string, language: string): string {
  const rules = TOKENIZERS[language] ?? TOKENIZERS.text
  if (rules.length === 0) return escapeHtml(code)

  const combinedSource = rules.map(([pattern]) => pattern.source).join("|")
  const combined = new RegExp(combinedSource, "g")
  const kinds: string[] = rules.map(([, kind]) => kind)

  let lastIndex = 0
  let out = ""
  while (true) {
    const match = combined.exec(code)
    if (!match) break
    const kindIndex = match.slice(1).findIndex((group) => group !== undefined)
    const kind = kinds[kindIndex === -1 ? 0 : kindIndex] ?? "text"
    out += escapeHtml(code.slice(lastIndex, match.index))
    out += `<span class="${TOKEN_COLORS[kind] ?? ""}">${escapeHtml(match[0])}</span>`
    lastIndex = match.index + match[0].length
    if (match.index === combined.lastIndex) combined.lastIndex++
  }
  out += escapeHtml(code.slice(lastIndex))
  return out
}