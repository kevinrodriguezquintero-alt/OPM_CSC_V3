import re

js_path = r"c:\Users\kevin\OneDrive\Escritorio\V3\03-web-model\js\render.js"

with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

replacements = [
    (r'\bbg-gray-50\b', 'bg-surface-alt'),
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
    (r'\btext-black\b', 'text-main'),
    (r'\btext-red-500\b', 'text-[var(--c-error-text)]'),
    (r'\btext-red-400\b', 'text-[var(--c-error-text)]'),
    (r'border-color:\s*#fecaca', 'border-color: var(--c-error-border)'),
    (r'background:\s*#fffcfc', 'background: var(--c-error-bg)'),
    (r'color:\s*#dc2626', 'color: var(--c-error-text)'),
    (r'background:#fff', 'background:var(--c-bg-surface)'),
    (r'border:1px\s+solid\s+#e5e7eb', 'border:1px solid var(--c-border)'),
]

for pattern, repl in replacements:
    js = re.sub(pattern, repl, js)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)
    
print("JS rewritten.")
