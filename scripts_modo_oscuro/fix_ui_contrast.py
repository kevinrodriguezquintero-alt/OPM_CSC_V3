import re

html_path = r"c:\Users\kevin\OneDrive\Escritorio\V3\03-web-model\index.html"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

replacements = [
    # Add background/text colors to all <select> tags
    (r'<select(.*?)class="(.*?)"', r'<select\1class="\2 bg-surface text-main"'),
    (r'<input(.*?)class="(.*?)"', r'<input\1class="\2 bg-surface text-main"'),
    
    # Leftover gray buttons
    (r'\bbg-gray-100\b', 'bg-surface-alt'),
    (r'\bhover:bg-gray-200\b', 'hover:bg-surface-hover'),
    (r'\bbg-gray-200\b', 'bg-surface-hover'),
    
    # Leftover white background if any
    (r'\bbg-white\b', 'bg-surface'),
    
    # Leftover text grays if any
    (r'\btext-gray-[89]00\b', 'text-main'),
    (r'\btext-gray-[567]00\b', 'text-muted'),
    (r'\btext-gray-400\b', 'text-subtle'),
]

for pattern, repl in replacements:
    html = re.sub(pattern, repl, html)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)
    
print("UI contrast adjusted.")
