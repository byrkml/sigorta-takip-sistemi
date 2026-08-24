export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) {
    alert('Dışa aktarılacak veri bulunamadı.');
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((obj) =>
    headers
      .map((header) => {
        const val = obj[header] === null || obj[header] === undefined ? '' : obj[header];
        const stringified = String(val).replace(/"/g, '""');
        return `"${stringified}"`;
      })
      .join(';')
  );

  // UTF-8 BOM ekleyerek Türkçe karakter bozulmasını engelliyoruz
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}