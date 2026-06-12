function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  if (images.length === 0) return Promise.resolve();

  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  ).then(() => undefined);
}

function waitForIframeDocument(iframe: HTMLIFrameElement): Promise<Document> {
  const existing = iframe.contentDocument;
  if (existing?.body && existing.readyState === "complete") {
    return Promise.resolve(existing);
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("טעינת המסמך נכשלה"));
    }, 15_000);

    const finish = () => {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      window.clearTimeout(timeout);
      resolve(doc);
    };

    iframe.addEventListener("load", finish, { once: true });
    finish();
  });
}

/** הדפסת גוף המסמך מתוך iframe התצוגה. */
export async function printOnboardingFromIframe(iframe: HTMLIFrameElement) {
  const doc = await waitForIframeDocument(iframe);
  await waitForImages(doc);

  const win = doc.defaultView;
  if (!win) throw new Error("לא ניתן להדפיס את המסמך");

  win.focus();
  win.print();
}

/** הדפסה דרך Blob URL — גיבוי כשאין iframe. */
export function printOnboardingHtml(html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");

  if (!printWindow) {
    URL.revokeObjectURL(url);
    throw new Error("יש לאפשר חלונות קופצים כדי להדפיס");
  }

  const cleanup = () => URL.revokeObjectURL(url);
  printWindow.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(cleanup, 120_000);

  printWindow.addEventListener(
    "load",
    () => {
      printWindow.focus();
      printWindow.print();
    },
    { once: true },
  );
}

async function renderElementToPdfPages(
  element: HTMLElement,
  pdf: import("jspdf").jsPDF,
  html2canvas: typeof import("html2canvas").default,
  options: { isFirstPage: boolean },
) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png");

  let heightLeft = imgHeight;
  let position = 0;
  let isFirstSlice = options.isFirstPage;

  while (heightLeft > 0) {
    if (!isFirstSlice) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    position = heightLeft - imgHeight;
    isFirstSlice = false;
  }
}

/** מוריד PDF מתוך גוף המסמך ב-iframe (ללא UI נוסף). */
export async function downloadOnboardingPdfFromIframe(
  iframe: HTMLIFrameElement,
  fileName: string,
) {
  const doc = await waitForIframeDocument(iframe);
  await waitForImages(doc);

  const body = doc.body;
  if (!body) throw new Error("מסמך ריק");

  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });

  const exportPages = Array.from(body.querySelectorAll<HTMLElement>(".export-page"));
  const targets = exportPages.length > 0 ? exportPages : [body];
  let isFirstPage = true;

  for (const target of targets) {
    await renderElementToPdfPages(target, pdf, html2canvas, { isFirstPage });
    isFirstPage = false;
  }

  pdf.save(`${fileName}.pdf`);
}
