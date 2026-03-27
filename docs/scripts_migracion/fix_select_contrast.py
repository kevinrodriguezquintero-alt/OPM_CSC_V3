import re

html_path = r"c:\Users\kevin\OneDrive\Escritorio\V3\03-web-model\index.html"
css_path = r"c:\Users\kevin\OneDrive\Escritorio\V3\03-web-model\css\app.css"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Make regex DOTALL to match newlines
replacements = [
    (re.compile(r'(<select\b[^>]*?class=")([^"]*?)(")', re.DOTALL), r'\g<1>\g<2> bg-surface text-main dark:bg-[var(--c-bg-surface-alt)]\g<3>'),
    (re.compile(r'(<input\b[^>]*?class=")([^"]*?)(")', re.DOTALL), r'\g<1>\g<2> bg-surface text-main dark:bg-[var(--c-bg-surface-alt)]\g<3>')
]

for pattern, repl in replacements:
    # First, let's remove any duplicates we might accidentally add if we run it twice
    html = pattern.sub(repl, html)

# Clean up possible duplication from script runs
html = html.replace(" bg-surface text-main bg-surface text-main", " bg-surface text-main")
html = html.replace(" dark:bg-[var(--c-bg-surface-alt)] dark:bg-[var(--c-bg-surface-alt)]", " dark:bg-[var(--c-bg-surface-alt)]")

# Now inject color-scheme: dark into the inline style block for index.html
if ".dark {" in html and "color-scheme: dark;" not in html:
    html = html.replace(".dark {", ".dark {\n      color-scheme: dark;")
if ":root {" in html and "color-scheme: light;" not in html:
    html = html.replace(":root {", ":root {\n      color-scheme: light;")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

print("HTML and UI styles fixed.")
