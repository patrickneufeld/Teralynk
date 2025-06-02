const formatFileSize = (bytes, decimalPlaces = 1) => {
  if (typeof bytes !== "number" || bytes < 0) {
    throw new Error("Invalid input. Bytes must be a non-negative number.");
  }

  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(decimalPlaces)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(decimalPlaces)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(decimalPlaces)} GB`;
};

export default formatFileSize;
