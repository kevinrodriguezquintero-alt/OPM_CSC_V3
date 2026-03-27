import re
import os

css_path = r"c:\Users\kevin\OneDrive\Escritorio\V3\03-web-model\css\app.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

prepend = """@theme {
  --color-page: var(--c-bg-page);
  --color-surface: var(--c-bg-surface);
  --color-surface-hover: var(--c-bg-surface-hover);
  --color-line: var(--c-border);
  --color-line-strong: var(--c-border-strong);
  
  --color-main: var(--c-text-main);
  --color-muted: var(--c-text-muted);
  --color-subtle: var(--c-text-subtle);
  
  --color-accent: var(--c-accent);
  --color-accent-hover: var(--c-accent-hover);
  --color-accent-fg: var(--c-accent-fg);
  --color-accent-bg: var(--c-accent-bg);
  --color-accent-bg-hover: var(--c-accent-bg-hover);

  --color-success-bg: var(--c-success-bg);
  --color-success-text: var(--c-success-text);
  
  --color-error-bg: var(--c-error-bg);
  --color-error-border: var(--c-error-border);
  --color-error-text: var(--c-error-text);
  
  --color-warning-bg: var(--c-warning-bg);
  --color-warning-text: var(--c-warning-text);
}

:root {
  --c-bg-page: #f9fafb;
  --c-bg-surface: #ffffff;
  --c-bg-surface-hover: #f3f4f6;
  --c-bg-surface-alt: #f1f5f9;
  --c-bg-table-head: #f9fafb;
  
  --c-border: #e5e7eb;
  --c-border-strong: #d1d5db;
  
  --c-text-main: #1f2937;
  --c-text-muted: #6b7280;
  --c-text-subtle: #9ca3af;
  
  --c-accent: #4f46e5;
  --c-accent-hover: #4338ca;
  --c-accent-bg: #eef2ff;
  --c-accent-bg-hover: #e0e7ff;
  --c-accent-text: #4338ca;
  --c-accent-fg: #ffffff;
  
  --c-success-bg: #dcfce7;
  --c-success-text: #16a34a;
  
  --c-error-bg: #fee2e2;
  --c-error-border: #fecaca;
  --c-error-text: #dc2626;

  --c-warning-text: #d97706;
  --c-warning-bg: #fef3c7;
  
  --c-term-bg: #0f172a;
  --c-term-header: #1e293b;
  --c-term-text: #86efac;
}

.dark {
  --c-bg-page: #131314;
  --c-bg-surface: #1e1f22;
  --c-bg-surface-hover: #282a2c;
  --c-bg-surface-alt: #2a2c30;
  --c-bg-table-head: #282a2c;
  
  --c-border: #444746;
  --c-border-strong: #5f6368;
  
  --c-text-main: #e3e3e3;
  --c-text-muted: #c4c7c5;
  --c-text-subtle: #8e918f;
  
  --c-accent: #a8c7fa;
  --c-accent-hover: #d3e3fd;
  --c-accent-bg: #041e49;
  --c-accent-bg-hover: #0842a0;
  --c-accent-text: #a8c7fa;
  --c-accent-fg: #041e49;
  
  --c-success-bg: #0d3b23;
  --c-success-text: #6dd58c;
  
  --c-error-bg: #4f1519;
  --c-error-border: #8c1d18;
  --c-error-text: #f2b8b5;

  --c-warning-text: #fcd663;
  --c-warning-bg: #4d3a08;
  
  --c-term-bg: #0b0c0f;
  --c-term-header: #131314;
  --c-term-text: #a8c7fa;
}

/* ── Dark Mode Toggle UI ──────────────────────────────────────────────────── */
.theme-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  background: #ffffff;
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
  border-radius: 99px;
  border: 1px solid var(--c-border);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: all 0.2s;
}
.theme-switch:hover { border-color: var(--c-border-strong); }
.dark .theme-switch { background: #000000; border-color: #333; }

.switch-pill {
  width: 3.25rem;
  height: 1.75rem;
  background: #111827;
  border-radius: 99px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.4rem;
  transition: all 0.2s;
}
.dark .switch-pill { background: #111827; }

.switch-circle {
  position: absolute;
  top: 0.15rem;
  left: 0.15rem;
  width: 1.45rem;
  height: 1.45rem;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.switch-icon { width: 14px; height: 14px; z-index: 1; }
.switch-icon-sun { color: #facc15; }
.switch-icon-moon { color: #8e918f; }

.dark .switch-circle { transform: translateX(1.5rem); background: #ffffff; }
.dark .switch-icon-sun { color: #8e918f; }
.dark .switch-icon-moon { color: #111827; }

.switch-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #111827;
}
.dark .switch-label { color: #ffffff; }

"""

replacements = [
    ('#e5e7eb', 'var(--c-border)'),
    ('#d1d5db', 'var(--c-border-strong)'),
    ('#6366f1', 'var(--c-accent)'),
    ('#4f46e5', 'var(--c-accent)'),
    ('#4338ca', 'var(--c-accent-hover)'),
    ('#6b7280', 'var(--c-text-muted)'),
    ('#374151', 'var(--c-text-main)'),
    ('#1e293b', 'var(--c-text-main)'),
    ('#9ca3af', 'var(--c-text-subtle)'),
    ('#eef2ff', 'var(--c-accent-bg)'),
    ('#e0e7ff', 'var(--c-accent-bg-hover)'),
    ('#dcfce7', 'var(--c-success-bg)'),
    ('#16a34a', 'var(--c-success-text)'),
    ('#fee2e2', 'var(--c-error-bg)'),
    ('#dc2626', 'var(--c-error-text)'),
    ('#fecaca', 'var(--c-error-border)'),
    ('#f1f5f9', 'var(--c-bg-surface-alt)'),
    ('#f8fafc', 'var(--c-bg-surface-hover)'),
    ('#f9fafb', 'var(--c-bg-table-head)'),
    ('#fff', 'var(--c-bg-surface)'),
    ('#ffffff', 'var(--c-bg-surface)'),
    ('#0f172a', 'var(--c-term-bg)'),
    ('#86efac', 'var(--c-term-text)'),
    ('#334155', 'var(--c-border-strong)'),
    ('#cbd5e1', 'var(--c-text-main)'),
    ('#475569', 'var(--c-border)')
]

for old, new in replacements:
    css = css.replace(old, new)
    css = css.replace(old.upper(), new)

with open(css_path, "w", encoding="utf-8") as f:
    f.write(prepend + css)
    
print("CSS rewritten.")
