/**
 * First days of Ramazan Bayramı (Eid al-Fitr, 3 days) and Kurban Bayramı (Eid al-Adha, 4 days) in Türkiye.
 * The arife (eve) is the day before; it is a half-day public holiday from 13:00.
 *
 * Source: Diyanet İşleri Başkanlığı "Dini Günler" calendars
 * (https://vakithesaplama.diyanet.gov.tr/dini_gunler.php), retrieved 2026-11-27.
 * The weekday printed in each Diyanet table is kept here and verified in tests.
 *
 * Diyanet publishes these dates in advance from astronomical calculation; the government may still
 * add administrative leave ("idari izin") bridge days, which are not public holidays and not listed.
 */
export interface DiniBayramYili {
  ramazan: { ilkGun: string; gunAdi: string };
  kurban: { ilkGun: string; gunAdi: string };
}

export const DINI_BAYRAMLAR: Readonly<Record<number, DiniBayramYili>> = {
  2024: { ramazan: { ilkGun: '2024-04-10', gunAdi: 'Çarşamba' }, kurban: { ilkGun: '2024-06-16', gunAdi: 'Pazar' } },
  2025: { ramazan: { ilkGun: '2025-03-30', gunAdi: 'Pazar' }, kurban: { ilkGun: '2025-06-06', gunAdi: 'Cuma' } },
  2026: { ramazan: { ilkGun: '2026-03-20', gunAdi: 'Cuma' }, kurban: { ilkGun: '2026-05-27', gunAdi: 'Çarşamba' } },
  2027: { ramazan: { ilkGun: '2027-03-09', gunAdi: 'Salı' }, kurban: { ilkGun: '2027-05-16', gunAdi: 'Pazar' } },
  2028: { ramazan: { ilkGun: '2028-02-26', gunAdi: 'Cumartesi' }, kurban: { ilkGun: '2028-05-05', gunAdi: 'Cuma' } },
  2029: { ramazan: { ilkGun: '2029-02-14', gunAdi: 'Çarşamba' }, kurban: { ilkGun: '2029-04-24', gunAdi: 'Salı' } },
  2030: { ramazan: { ilkGun: '2030-02-04', gunAdi: 'Pazartesi' }, kurban: { ilkGun: '2030-04-13', gunAdi: 'Cumartesi' } },
};

export const DINI_BAYRAM_YIL_ARALIGI = { min: 2024, max: 2030 } as const;
