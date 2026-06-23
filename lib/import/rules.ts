export const IMPORT_MAX_TEXT_BYTES = 512 * 1024;
export const IMPORT_MAX_DOCX_BYTES = 5 * 1024 * 1024;

export const IMPORT_TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".json",
  ".csv",
  ".html",
  ".htm",
  ".xml",
  ".yaml",
  ".yml",
  ".log",
]);

export const IMPORT_DOCX_EXTENSIONS = new Set([".docx"]);

export const IMPORT_ACCEPT =
  ".txt,.md,.markdown,.json,.csv,.log,.html,.htm,.xml,.yaml,.yml,.docx";

function getExtension(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export function isDocxFile(name: string): boolean {
  return IMPORT_DOCX_EXTENSIONS.has(getExtension(name));
}

export function validateImportFile(file: File): string | null {
  const ext = getExtension(file.name);
  const isText = IMPORT_TEXT_EXTENSIONS.has(ext);
  const isDocx = IMPORT_DOCX_EXTENSIONS.has(ext);

  if (!isText && !isDocx) {
    return `不支持的文件类型「${ext || "未知"}」，请上传 .txt / .md / .docx 等文件`;
  }

  const maxBytes = isDocx ? IMPORT_MAX_DOCX_BYTES : IMPORT_MAX_TEXT_BYTES;
  if (file.size > maxBytes) {
    return isDocx
      ? "Word 文件过大，请上传小于 5MB 的 .docx 文件"
      : "文件过大，请上传小于 512KB 的文件";
  }

  if (file.size === 0) {
    return "文件为空";
  }

  return null;
}

/** @deprecated use IMPORT_MAX_TEXT_BYTES */
export const IMPORT_MAX_FILE_BYTES = IMPORT_MAX_TEXT_BYTES;
