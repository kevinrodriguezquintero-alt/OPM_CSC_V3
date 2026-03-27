import re

html_path = r"c:\Users\kevin\OneDrive\Escritorio\V3\03-web-model\index.html"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

replacements = [
    (r'\bbg-gray-50\b', 'bg-page'),
    (r'\bbg-white\b', 'bg-surface'),
    (r'\btext-gray-800\b', 'text-main'),
    (r'\btext-gray-700\b', 'text-main'),
    (r'\btext-gray-600\b', 'text-muted'),
    (r'\btext-gray-500\b', 'text-muted'),
    (r'\btext-gray-400\b', 'text-subtle'),
    (r'\bborder-gray-200\b', 'border-line'),
    (r'\bborder-gray-100\b', 'border-line'),
    (r'\bborder-gray-300\b', 'border-strong'),
    (r'\bbg-indigo-600\b', 'bg-accent'),
    (r'\bhover:bg-indigo-700\b', 'hover:bg-accent-hover'),
    (r'\btext-indigo-600\b', 'text-accent'),
    (r'\btext-white\b', 'text-accent-fg'),
    (r'\btext-amber-600\b', 'text-[var(--c-warning-text)]'),
    (r'\bbg-amber-50\b', 'bg-[var(--c-warning-bg)]'),
    (r'\bborder-amber-200\b', 'border-[var(--c-warning-text)]')
]

for pattern, repl in replacements:
    html = re.sub(pattern, repl, html)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)
    
print("HTML rewritten.")
