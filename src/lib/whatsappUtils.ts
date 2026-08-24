export function generateRenewalMessage(
  customerName: string,
  plate: string,
  policyType: string,
  endDateStr: string,
  companyName?: string
) {
  const dateFormatted = new Date(endDateStr).toLocaleDateString('tr-TR');
  
  return encodeURIComponent(
    `Sayın ${customerName},\n\n` +
    `${plate ? plate + ' plakalı aracınıza ait ' : ''}${companyName ? companyName + ' ' : ''}${policyType} poliçenizin süresi ${dateFormatted} tarihinde sona erecektir.\n\n` +
    `Yenileme teklifinizi hazırladık. Detaylar ve güncel fiyatlar için bizimle iletişime geçebilirsiniz.\n\n` +
    `İyi günler dileriz.\nSigorta Acenteniz`
  );
}

export function cleanPhoneNumber(phone: string) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '90' + cleaned.substring(1);
  } else if (!cleaned.startsWith('90')) {
    cleaned = '90' + cleaned;
  }
  return cleaned;
}