// Utility functions for PageSpeed API, proxies, and Excel export
export const proxyList = [
  url => `https://ishowpagespeed-cors.onrender.com/${url}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.org/?${encodeURIComponent(url)}`,
  url => `https://yacdn.org/proxy/${url}`,
  url => `https://thingproxy.freeboard.io/fetch/${url}`
];

export async function fetchWithProxies(url) {
  let lastError;
  for (const makeProxy of proxyList) {
    try {
      const proxyUrl = makeProxy(url);
      const res = await fetch(proxyUrl);
      if (res.ok) return await res.text();
      lastError = `Proxy ${proxyUrl} failed: ${res.status}`;
    } catch (e) {
      lastError = e.message;
    }
  }
  throw new Error(
    (lastError ? lastError + '\n' : '') +
    'All proxy attempts failed. This is likely due to CORS restrictions or proxy limits. If you are using the GitHub Pages version, public proxies may not work reliably.\n' +
    'As a workaround, you can download the sitemap.xml or webpage manually and paste the URLs here.'
  );
}

export function getCrux(data, strategy) {
  let exp = data[`${strategy}Experience`];
  let source = '';
  if (exp && exp.metrics && Object.keys(exp.metrics).length > 0) {
    source = 'url';
  } else if (data.loadingExperience && data.loadingExperience.metrics && Object.keys(data.loadingExperience.metrics).length > 0) {
    exp = data.loadingExperience;
    if (data.id && data.originLoadingExperience && data.originLoadingExperience.id === data.loadingExperience.id) {
      source = 'origin';
    } else {
      source = 'url';
    }
  } else if (data.originLoadingExperience && data.originLoadingExperience.metrics && Object.keys(data.originLoadingExperience.metrics).length > 0) {
    exp = data.originLoadingExperience;
    source = 'origin';
  } else {
    exp = {};
    source = 'none';
  }
  const roundToHundred = (val) => {
    if (typeof val !== 'number') return val ?? 'N/A';
    return Math.round(val / 100) * 100;
  };
  const msToSec = (val) => (typeof val === 'number' ? (val / 1000).toFixed(2) : val);
  return {
    fcp: msToSec(roundToHundred(exp?.metrics?.FIRST_CONTENTFUL_PAINT_MS?.percentile)),
    lcp: msToSec(roundToHundred(exp?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile)),
    cls: typeof exp?.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile === 'number'
      ? exp.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
      : 'N/A',
    inp: exp?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile ?? 'N/A',
    source,
  };
}

export function getLighthousePerf(data) {
  return typeof data.lighthouseResult?.categories?.performance?.score === 'number'
    ? Math.round(data.lighthouseResult.categories.performance.score * 100)
    : 'N/A';
}

export async function exportToExcel(metrics, setExcelUrl) {
  const XLSX = await import('xlsx');
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const dateTimeStr = `${dateStr} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const data = metrics.map((row) => ({
    url: row.url,
    mobile_lighthouse: row.mobile_lighthouse,
    mobile_fcp: row.mobile_fcp,
    mobile_lcp: row.mobile_lcp,
    mobile_cls: row.mobile_cls,
    mobile_inp: row.mobile_inp,
    mobile_source: row.mobile_source,
    desktop_lighthouse: row.desktop_lighthouse,
    desktop_fcp: row.desktop_fcp,
    desktop_lcp: row.desktop_lcp,
    desktop_cls: row.desktop_cls,
    desktop_inp: row.desktop_inp,
    desktop_source: row.desktop_source,
  }));
  if (data.length > 0) {
    const metaRow = { url: `Report generated: ${dateTimeStr}` };
    const dataWithMeta = [metaRow, ...data];
    const ws = XLSX.utils.json_to_sheet(dataWithMeta, { skipHeader: false });
    ws['!cols'] = [
      { wch: 40 },
      { wch: 14 },
      { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 14 },
      { wch: 14 },
      { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 14 }
    ];
    const wb = XLSX.utils.book_new();
    let sheetName = `PageSpeed_${dateStr}_${timeStr}`;
    if (sheetName.length > 31) sheetName = sheetName.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const filename = `${sheetName}.xlsx`;
    const url = URL.createObjectURL(blob);
    setExcelUrl(url);
    const link = document.querySelector('.download-btn');
    if (link) link.setAttribute('download', filename);
  } else {
    setExcelUrl(null);
  }
}
