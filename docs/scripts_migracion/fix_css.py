import re
import os

css_path = r"c:\Users\kevin\OneDrive\Escritorio\V3\03-web-model\css\app.css"
html_path = r"c:\Users\kevin\OneDrive\Escritorio\V3\03-web-model\index.html"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Extract the @theme, :root, and .dark blocks
theme_match = re.search(r'@theme\s*\{.*?\}(?=\n\n|\n:|\n\.)', css, flags=re.DOTALL)
root_match = re.search(r':root\s*\{.*?\}', css, flags=re.DOTALL)
dark_match = re.search(r'\.dark\s*\{.*?\}', css, flags=re.DOTALL)

# The injected css had them explicitly at the top
theme_block = theme_match.group(0) if theme_match else ""
root_block = root_match.group(0) if root_match else ""
dark_block = dark_match.group(0) if dark_match else ""

# Remove them from app.css
if theme_block: css = css.replace(theme_block, "")
if root_block: css = css.replace(root_block, "")
if dark_block: css = css.replace(dark_block, "")

# Remove the Dark Mode Toggle UI from app.css and move to inline to be safe, or just leave it.
# Actually, the Dark Mode Toggle UI can stay in app.css, it's just standard CSS.

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

# Now inject into index.html
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

style_injection = f"""<style type="text/tailwindcss">
{theme_block}
{root_block}
{dark_block}
</style>
"""

# Inject right before </head>
html = html.replace('</head>', style_injection + '</head>')

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Fixed CSS injection.")
