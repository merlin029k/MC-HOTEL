// Human-readable booking reference, e.g. MC-20260914-0007
function generateReferenceCode() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `MC-${datePart}-${randomPart}`;
}

module.exports = { generateReferenceCode };
