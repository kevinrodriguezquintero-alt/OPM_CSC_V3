import re

html_path = r"c:\Users\kevin\OneDrive\Escritorio\V3\03-web-model\index.html"
css_path = r"c:\Users\kevin\OneDrive\Escritorio\V3\03-web-model\css\app.css"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Add text-main to body if missing
html = html.replace('<body class="bg-page min-h-screen">', '<body class="bg-page text-main min-h-screen">')

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Replace hardcoded type-tag text color
css = css.replace('color: #3730a3;', 'color: var(--c-accent-text);')

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Fixed tags and body text.")
