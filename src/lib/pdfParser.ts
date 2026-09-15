export async function parseMT103(file: File) {
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) throw new Error("PDF library not loaded yet");

  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const loadingTask = pdfjsLib.getDocument({
    data,
    password: "T137101",
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  let allItems: any[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items
      .filter((item: any) => item.str.trim().length > 0)
      .map((item: any) => ({
        str: item.str.trim(),
        x: item.transform[4],
        y: item.transform[5],
      }));
    allItems = allItems.concat(items);
  }

  // Sort by Y descending (top to bottom in PDF space), then X ascending
  allItems.sort((a, b) => {
    if (Math.abs(b.y - a.y) < 5) {
      return a.x - b.x;
    }
    return b.y - a.y;
  });

  let colAmountX = -1, colValueDateX = -1, colReceivedFromX = -1, colOrderingCustomerX = -1, colDetailsX = -1;
  let headerY = -1;

  for (const item of allItems) {
    const s = item.str.toLowerCase();
    if (s.includes("amount")) colAmountX = item.x;
    if (s.includes("value date")) colValueDateX = item.x;
    if (s.includes("received from")) colReceivedFromX = item.x;
    if (s.includes("ordering customer") || s.includes("orderingcustomer")) {
      colOrderingCustomerX = item.x;
      headerY = item.y;
    }
    if (s.includes("details")) colDetailsX = item.x;
  }

  // Fallbacks if columns are shifted or not perfectly aligned
  if (colOrderingCustomerX === -1) colOrderingCustomerX = 400; // approximate
  if (colDetailsX === -1) colDetailsX = 600;

  const dataItems = headerY !== -1 ? allItems.filter((i) => i.y < headerY - 10) : allItems;

  let currency = "";
  let amount = "";
  let value_date = "";
  let invoice_number = "";
  let swift_code = "";
  const orderingCustomerLines: string[] = [];
  const fullTextLines = allItems.map((i) => i.str); // For fallback SWIFT regex if needed

  for (const item of dataItems) {
    const str = item.str;

    if (item.x >= colAmountX - 40 && item.x < colValueDateX - 20) {
      if (/^[\d\,\.]+$/.test(str)) {
        amount = str.replace(/,/g, "");
      }
    }

    if (/^(USD|EUR|GBP|BDT)$/i.test(str)) {
      currency = str.toUpperCase();
    }

    if (item.x >= colValueDateX - 20 && item.x < colReceivedFromX - 20) {
      if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
        value_date = str;
      }
    }

    if (item.x >= colReceivedFromX - 20 && item.x < colOrderingCustomerX - 20) {
      if (str.length > 5 && str.length < 15 && /^[A-Z0-9]+$/.test(str)) {
        swift_code = str;
      }
    }

    if (item.x >= colOrderingCustomerX - 20 && item.x < colDetailsX - 20) {
      orderingCustomerLines.push(str);
    }

    if (item.x >= colDetailsX - 20) {
      const match = str.match(/TF-[\d\-]+/i);
      if (match) invoice_number = match[0].toUpperCase();
    }
  }

  // If SWIFT wasn't caught spatially, try regex on full text
  if (!swift_code) {
    const fullText = fullTextLines.join(" ");
    const swiftMatches = fullText.match(/[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?/g);
    if (swiftMatches) {
      swift_code = swiftMatches[0];
    }
  }

  let client_name = orderingCustomerLines.join(" ");

  return {
    currency,
    amount,
    value_date,
    invoice_number,
    client_name,
    swift_code,
    full_text: fullTextLines.join(" "),
  };
}
