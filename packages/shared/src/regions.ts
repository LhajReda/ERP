export interface RegionInfo {
  name_fr: string;
  name_ar: string;
  provinces: string[];
}

export const REGIONS_MAROC: Record<string, RegionInfo> = {
  SOUSS_MASSA: {
    name_fr: 'Souss-Massa',
    name_ar: 'سوس ماسة',
    provinces: [
      'Agadir Ida Ou Tanane',
      'Inezgane Ait Melloul',
      'Chtouka Ait Baha',
      'Taroudant',
      'Tiznit',
      'Tata',
    ],
  },
  MARRAKECH_SAFI: {
    name_fr: 'Marrakech-Safi',
    name_ar: 'مراكش آسفي',
    provinces: [
      'Marrakech',
      'Al Haouz',
      'Chichaoua',
      'El Kelaa des Sraghna',
      'Essaouira',
      'Rehamna',
      'Safi',
      'Youssoufia',
    ],
  },
  FES_MEKNES: {
    name_fr: 'Fes-Meknes',
    name_ar: 'فاس مكناس',
    provinces: [
      'Fes',
      'Meknes',
      'El Hajeb',
      'Ifrane',
      'Moulay Yacoub',
      'Sefrou',
      'Boulemane',
      'Taounate',
      'Taza',
    ],
  },
  RABAT_SALE_KENITRA: {
    name_fr: 'Rabat-Sale-Kenitra',
    name_ar: 'الرباط سلا القنيطرة',
    provinces: [
      'Rabat',
      'Sale',
      'Kenitra',
      'Skhirate-Temara',
      'Khemisset',
      'Sidi Kacem',
      'Sidi Slimane',
    ],
  },
  CASABLANCA_SETTAT: {
    name_fr: 'Casablanca-Settat',
    name_ar: 'الدار البيضاء سطات',
    provinces: [
      'Casablanca',
      'Mohammedia',
      'El Jadida',
      'Settat',
      'Berrechid',
      'Benslimane',
      'Mediouna',
      'Nouaceur',
    ],
  },
  BENI_MELLAL_KHENIFRA: {
    name_fr: 'Beni Mellal-Khenifra',
    name_ar: 'بني ملال خنيفرة',
    provinces: ['Beni Mellal', 'Khenifra', 'Azilal', 'Fquih Ben Salah', 'Khouribga'],
  },
  DRAA_TAFILALET: {
    name_fr: 'Draa-Tafilalet',
    name_ar: 'درعة تافيلالت',
    provinces: ['Errachidia', 'Ouarzazate', 'Tinghir', 'Zagora', 'Midelt'],
  },
  ORIENTAL: {
    name_fr: 'Oriental',
    name_ar: 'الشرق',
    provinces: [
      'Oujda-Angad',
      'Nador',
      'Berkane',
      'Taourirt',
      'Jerada',
      'Figuig',
      'Guercif',
      'Driouch',
    ],
  },
  TANGER_TETOUAN_AL_HOCEIMA: {
    name_fr: 'Tanger-Tetouan-Al Hoceima',
    name_ar: 'طنجة تطوان الحسيمة',
    provinces: [
      'Tanger-Assilah',
      'Tetouan',
      'Al Hoceima',
      'Chefchaouen',
      'Larache',
      'Fahs-Anjra',
      "M'diq-Fnideq",
      'Ouezzane',
    ],
  },
  GUELMIM_OUED_NOUN: {
    name_fr: 'Guelmim-Oued Noun',
    name_ar: 'كلميم واد نون',
    provinces: ['Guelmim', 'Tan-Tan', 'Sidi Ifni', 'Assa-Zag'],
  },
  LAAYOUNE_SAKIA_EL_HAMRA: {
    name_fr: 'Laayoune-Sakia El Hamra',
    name_ar: 'العيون الساقية الحمراء',
    provinces: ['Laayoune', 'Boujdour', 'Tarfaya', 'Es-Semara'],
  },
  DAKHLA_OUED_ED_DAHAB: {
    name_fr: 'Dakhla-Oued Ed-Dahab',
    name_ar: 'الداخلة وادي الذهب',
    provinces: ['Oued Ed-Dahab', 'Aousserd'],
  },
};

/** Retourne les provinces d'une region */
export function getProvinces(region: string): string[] {
  return REGIONS_MAROC[region]?.provinces ?? [];
}

/** Retourne toutes les regions avec leurs noms */
export function getAllRegions(): { key: string; name_fr: string; name_ar: string }[] {
  return Object.entries(REGIONS_MAROC).map(([key, value]) => ({
    key,
    name_fr: value.name_fr,
    name_ar: value.name_ar,
  }));
}
