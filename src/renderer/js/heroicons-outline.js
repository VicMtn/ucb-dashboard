/* Heroicons (MIT) — outline set, minimal runtime wrapper.
   Source: https://heroicons.com/ (paths adapted for inline SVG use) */

"use strict";

(() => {
  const ICONS = {
    plus: `
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    `,
    "arrow-left": `
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    `,
    "ellipsis-horizontal": `
      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm6 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm6 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    `,
    "folder-open": `
      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    `,
    "document-text": `
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    `,
    "arrow-path": `
      <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M2.985 14.652 6.166 11.47a8.25 8.25 0 0 1 13.803 3.7" />
    `,
    "arrow-path-rounded-square": `
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
    `,
    "x-mark": `
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
    `,
    trash: `
      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    `,
    "pencil-square": `
      <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487 19.5 7.125m-2.638-2.638a2.25 2.25 0 0 1 3.182 3.182l-8.25 8.25a4.5 4.5 0 0 1-1.897 1.13l-2.685.896.896-2.685a4.5 4.5 0 0 1 1.13-1.897l8.25-8.25Zm0 0L19.5 7.125" />
    `,
    "cog-6-tooth": `
      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12a7.5 7.5 0 0 1 13.5-4.5m0 0V4.5m0 3h3m-1.5 4.5a7.5 7.5 0 0 1-13.5 4.5m0 0v3m0-3h-3" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 15.75A3.75 3.75 0 1 0 12 8.25a3.75 3.75 0 0 0 0 7.5Z" />
    `,
    "exclamation-triangle": `
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.03-1.5 3.896 0l7.355 12.748ZM12 16.5h.008v.008H12V16.5Z" />
    `,
    "globe-alt": `
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.6 9h16.8M3.6 15h16.8" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M11.5 3c-2.5 2.5-4 5.5-4 9s1.5 6.5 4 9m1 0c2.5-2.5 4-5.5 4-9s-1.5-6.5-4-9" />
    `,
    calculator: `
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 7.5h6m-6 4.5h.008v.008H9V12Zm3 0h.008v.008H12V12Zm3 0h.008v.008H15V12ZM9 15h.008v.008H9V15Zm3 0h.008v.008H12V15Zm3 0h.008v.008H15V15ZM9 18h.008v.008H9V18Zm3 0h.008v.008H12V18Zm3 0h.008v.008H15V18Z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 3.75h9A2.25 2.25 0 0 1 18.75 6v12A2.25 2.25 0 0 1 16.5 20.25h-9A2.25 2.25 0 0 1 5.25 18V6A2.25 2.25 0 0 1 7.5 3.75Z" />
    `,
  };

  const escapeAttr = (s) =>
    String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;");

  function svg(name, opts = {}) {
    const body = ICONS[name];
    if (!body) return "";

    const size = Number.isFinite(opts.size) ? opts.size : 18;
    const cls = ["hi", opts.className].filter(Boolean).join(" ");
    const title = opts.title ? `<title>${escapeAttr(opts.title)}</title>` : "";

    return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="${escapeAttr(
      cls,
    )}" width="${size}" height="${size}">${title}${body}</svg>`;
  }

  window.HeroIcon = { svg };
})();
