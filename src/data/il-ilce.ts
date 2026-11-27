/**
 * 81 provinces (il) of Türkiye with licence-plate / province codes and their 973 districts (ilçe).
 *
 * Provenance (see also NOTICE):
 * - District lists were seeded from merkdev/Turkiye-iller-ilceler-PHP-Array
 *   (https://github.com/merkdev/Turkiye-iller-ilceler-PHP-Array, MIT License, (c) 2017 Kamer DINC)
 *   and updated for later official changes: Eyüp -> Eyüpsultan (2017); new districts Sultanhanı (Aksaray)
 *   and Kemalpaşa (Artvin) (2017) and Derecik (Hakkari) (2018); spellings normalised to the official forms
 *   (Hadim, 19 Mayıs, Marmaraereğlisi). Central districts of the 51 non-metropolitan provinces are named
 *   "Merkez", as in the Ministry of Interior inventory.
 * - Totals (81 provinces / 973 districts) match the Ministry of Interior's "Mülki İdare Bölümleri Envanteri".
 *   Every province's district set was cross-checked against independent public lists.
 * - Plate codes (01-81) are the official province traffic codes; geographic regions follow the
 *   conventional seven-region classification.
 *
 * Names of administrative units are public facts. No population or personal data is included.
 * Generated file — keep alphabetical order (Turkish collation) when editing.
 */

export type Bolge = 'Akdeniz' | 'Ege' | 'Marmara' | 'İç Anadolu' | 'Karadeniz' | 'Doğu Anadolu' | 'Güneydoğu Anadolu';

export interface Il {
  plaka: number;
  il: string;
  bolge: Bolge;
  buyuksehir: boolean;
  ilceler: string[];
}

export const ILLER: readonly Il[] = [
  { plaka: 1, il: "Adana", bolge: "Akdeniz", buyuksehir: true, ilceler: ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"] },
  { plaka: 2, il: "Adıyaman", bolge: "Güneydoğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kâhta", "Samsat", "Sincik", "Tut"] },
  { plaka: 3, il: "Afyonkarahisar", bolge: "Ege", buyuksehir: false, ilceler: ["Merkez", "Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Sandıklı", "Sinanpaşa", "Sultandağı", "Şuhut"] },
  { plaka: 4, il: "Ağrı", bolge: "Doğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Patnos", "Taşlıçay", "Tutak"] },
  { plaka: 5, il: "Amasya", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Göynücek", "Gümüşhacıköy", "Hamamözü", "Merzifon", "Suluova", "Taşova"] },
  { plaka: 6, il: "Ankara", bolge: "İç Anadolu", buyuksehir: true, ilceler: ["Akyurt", "Altındağ", "Ayaş", "Balâ", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"] },
  { plaka: 7, il: "Antalya", bolge: "Akdeniz", buyuksehir: true, ilceler: ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"] },
  { plaka: 8, il: "Artvin", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Ardanuç", "Arhavi", "Borçka", "Hopa", "Kemalpaşa", "Murgul", "Şavşat", "Yusufeli"] },
  { plaka: 9, il: "Aydın", bolge: "Ege", buyuksehir: true, ilceler: ["Bozdoğan", "Buharkent", "Çine", "Didim", "Efeler", "Germencik", "İncirliova", "Karacasu", "Karpuzlu", "Koçarlı", "Köşk", "Kuşadası", "Kuyucak", "Nazilli", "Söke", "Sultanhisar", "Yenipazar"] },
  { plaka: 10, il: "Balıkesir", bolge: "Marmara", buyuksehir: true, ilceler: ["Altıeylül", "Ayvalık", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gömeç", "Gönen", "Havran", "İvrindi", "Karesi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Susurluk"] },
  { plaka: 11, il: "Bilecik", bolge: "Marmara", buyuksehir: false, ilceler: ["Merkez", "Bozüyük", "Gölpazarı", "İnhisar", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar"] },
  { plaka: 12, il: "Bingöl", bolge: "Doğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Adaklı", "Genç", "Karlıova", "Kiğı", "Solhan", "Yayladere", "Yedisu"] },
  { plaka: 13, il: "Bitlis", bolge: "Doğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Adilcevaz", "Ahlat", "Güroymak", "Hizan", "Mutki", "Tatvan"] },
  { plaka: 14, il: "Bolu", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Dörtdivan", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Mudurnu", "Seben", "Yeniçağa"] },
  { plaka: 15, il: "Burdur", bolge: "Akdeniz", buyuksehir: false, ilceler: ["Merkez", "Ağlasun", "Altınyayla", "Bucak", "Çavdır", "Çeltikçi", "Gölhisar", "Karamanlı", "Kemer", "Tefenni", "Yeşilova"] },
  { plaka: 16, il: "Bursa", bolge: "Marmara", buyuksehir: true, ilceler: ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"] },
  { plaka: 17, il: "Çanakkale", bolge: "Marmara", buyuksehir: false, ilceler: ["Merkez", "Ayvacık", "Bayramiç", "Biga", "Bozcaada", "Çan", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Yenice"] },
  { plaka: 18, il: "Çankırı", bolge: "İç Anadolu", buyuksehir: false, ilceler: ["Merkez", "Atkaracalar", "Bayramören", "Çerkeş", "Eldivan", "Ilgaz", "Kızılırmak", "Korgun", "Kurşunlu", "Orta", "Şabanözü", "Yapraklı"] },
  { plaka: 19, il: "Çorum", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Alaca", "Bayat", "Boğazkale", "Dodurga", "İskilip", "Kargı", "Laçin", "Mecitözü", "Oğuzlar", "Ortaköy", "Osmancık", "Sungurlu", "Uğurludağ"] },
  { plaka: 20, il: "Denizli", bolge: "Ege", buyuksehir: true, ilceler: ["Acıpayam", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Güney", "Honaz", "Kale", "Merkezefendi", "Pamukkale", "Sarayköy", "Serinhisar", "Tavas"] },
  { plaka: 21, il: "Diyarbakır", bolge: "Güneydoğu Anadolu", buyuksehir: true, ilceler: ["Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani", "Hani", "Hazro", "Kayapınar", "Kocaköy", "Kulp", "Lice", "Silvan", "Sur", "Yenişehir"] },
  { plaka: 22, il: "Edirne", bolge: "Marmara", buyuksehir: false, ilceler: ["Merkez", "Enez", "Havsa", "İpsala", "Keşan", "Lalapaşa", "Meriç", "Süloğlu", "Uzunköprü"] },
  { plaka: 23, il: "Elazığ", bolge: "Doğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Ağın", "Alacakaya", "Arıcak", "Baskil", "Karakoçan", "Keban", "Kovancılar", "Maden", "Palu", "Sivrice"] },
  { plaka: 24, il: "Erzincan", bolge: "Doğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Çayırlı", "İliç", "Kemah", "Kemaliye", "Otlukbeli", "Refahiye", "Tercan", "Üzümlü"] },
  { plaka: 25, il: "Erzurum", bolge: "Doğu Anadolu", buyuksehir: true, ilceler: ["Aşkale", "Aziziye", "Çat", "Hınıs", "Horasan", "İspir", "Karaçoban", "Karayazı", "Köprüköy", "Narman", "Oltu", "Olur", "Palandöken", "Pasinler", "Pazaryolu", "Şenkaya", "Tekman", "Tortum", "Uzundere", "Yakutiye"] },
  { plaka: 26, il: "Eskişehir", bolge: "İç Anadolu", buyuksehir: true, ilceler: ["Alpu", "Beylikova", "Çifteler", "Günyüzü", "Han", "İnönü", "Mahmudiye", "Mihalgazi", "Mihalıççık", "Odunpazarı", "Sarıcakaya", "Seyitgazi", "Sivrihisar", "Tepebaşı"] },
  { plaka: 27, il: "Gaziantep", bolge: "Güneydoğu Anadolu", buyuksehir: true, ilceler: ["Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkâmil", "Yavuzeli"] },
  { plaka: 28, il: "Giresun", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Alucra", "Bulancak", "Çamoluk", "Çanakçı", "Dereli", "Doğankent", "Espiye", "Eynesil", "Görele", "Güce", "Keşap", "Piraziz", "Şebinkarahisar", "Tirebolu", "Yağlıdere"] },
  { plaka: 29, il: "Gümüşhane", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Kelkit", "Köse", "Kürtün", "Şiran", "Torul"] },
  { plaka: 30, il: "Hakkari", bolge: "Doğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Çukurca", "Derecik", "Şemdinli", "Yüksekova"] },
  { plaka: 31, il: "Hatay", bolge: "Akdeniz", buyuksehir: true, ilceler: ["Altınözü", "Antakya", "Arsuz", "Belen", "Defne", "Dörtyol", "Erzin", "Hassa", "İskenderun", "Kırıkhan", "Kumlu", "Payas", "Reyhanlı", "Samandağ", "Yayladağı"] },
  { plaka: 32, il: "Isparta", bolge: "Akdeniz", buyuksehir: false, ilceler: ["Merkez", "Aksu", "Atabey", "Eğirdir", "Gelendost", "Gönen", "Keçiborlu", "Senirkent", "Sütçüler", "Şarkikaraağaç", "Uluborlu", "Yalvaç", "Yenişarbademli"] },
  { plaka: 33, il: "Mersin", bolge: "Akdeniz", buyuksehir: true, ilceler: ["Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar", "Mezitli", "Mut", "Silifke", "Tarsus", "Toroslar", "Yenişehir"] },
  { plaka: 34, il: "İstanbul", bolge: "Marmara", buyuksehir: true, ilceler: ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"] },
  { plaka: 35, il: "İzmir", bolge: "Ege", buyuksehir: true, ilceler: ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"] },
  { plaka: 36, il: "Kars", bolge: "Doğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Akyaka", "Arpaçay", "Digor", "Kağızman", "Sarıkamış", "Selim", "Susuz"] },
  { plaka: 37, il: "Kastamonu", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Abana", "Ağlı", "Araç", "Azdavay", "Bozkurt", "Cide", "Çatalzeytin", "Daday", "Devrekani", "Doğanyurt", "Hanönü", "İhsangazi", "İnebolu", "Küre", "Pınarbaşı", "Seydiler", "Şenpazar", "Taşköprü", "Tosya"] },
  { plaka: 38, il: "Kayseri", bolge: "İç Anadolu", buyuksehir: true, ilceler: ["Akkışla", "Bünyan", "Develi", "Felahiye", "Hacılar", "İncesu", "Kocasinan", "Melikgazi", "Özvatan", "Pınarbaşı", "Sarıoğlan", "Sarız", "Talas", "Tomarza", "Yahyalı", "Yeşilhisar"] },
  { plaka: 39, il: "Kırklareli", bolge: "Marmara", buyuksehir: false, ilceler: ["Merkez", "Babaeski", "Demirköy", "Kofçaz", "Lüleburgaz", "Pehlivanköy", "Pınarhisar", "Vize"] },
  { plaka: 40, il: "Kırşehir", bolge: "İç Anadolu", buyuksehir: false, ilceler: ["Merkez", "Akçakent", "Akpınar", "Boztepe", "Çiçekdağı", "Kaman", "Mucur"] },
  { plaka: 41, il: "Kocaeli", bolge: "Marmara", buyuksehir: true, ilceler: ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"] },
  { plaka: 42, il: "Konya", bolge: "İç Anadolu", buyuksehir: true, ilceler: ["Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Cihanbeyli", "Çeltik", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli", "Güneysınır", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak"] },
  { plaka: 43, il: "Kütahya", bolge: "Ege", buyuksehir: false, ilceler: ["Merkez", "Altıntaş", "Aslanapa", "Çavdarhisar", "Domaniç", "Dumlupınar", "Emet", "Gediz", "Hisarcık", "Pazarlar", "Simav", "Şaphane", "Tavşanlı"] },
  { plaka: 44, il: "Malatya", bolge: "Doğu Anadolu", buyuksehir: true, ilceler: ["Akçadağ", "Arapgir", "Arguvan", "Battalgazi", "Darende", "Doğanşehir", "Doğanyol", "Hekimhan", "Kale", "Kuluncak", "Pütürge", "Yazıhan", "Yeşilyurt"] },
  { plaka: 45, il: "Manisa", bolge: "Ege", buyuksehir: true, ilceler: ["Ahmetli", "Akhisar", "Alaşehir", "Demirci", "Gölmarmara", "Gördes", "Kırkağaç", "Köprübaşı", "Kula", "Salihli", "Sarıgöl", "Saruhanlı", "Selendi", "Soma", "Şehzadeler", "Turgutlu", "Yunusemre"] },
  { plaka: 46, il: "Kahramanmaraş", bolge: "Akdeniz", buyuksehir: true, ilceler: ["Afşin", "Andırın", "Çağlayancerit", "Dulkadiroğlu", "Ekinözü", "Elbistan", "Göksun", "Nurhak", "Onikişubat", "Pazarcık", "Türkoğlu"] },
  { plaka: 47, il: "Mardin", bolge: "Güneydoğu Anadolu", buyuksehir: true, ilceler: ["Artuklu", "Dargeçit", "Derik", "Kızıltepe", "Mazıdağı", "Midyat", "Nusaybin", "Ömerli", "Savur", "Yeşilli"] },
  { plaka: 48, il: "Muğla", bolge: "Ege", buyuksehir: true, ilceler: ["Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz", "Marmaris", "Menteşe", "Milas", "Ortaca", "Seydikemer", "Ula", "Yatağan"] },
  { plaka: 49, il: "Muş", bolge: "Doğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Bulanık", "Hasköy", "Korkut", "Malazgirt", "Varto"] },
  { plaka: 50, il: "Nevşehir", bolge: "İç Anadolu", buyuksehir: false, ilceler: ["Merkez", "Acıgöl", "Avanos", "Derinkuyu", "Gülşehir", "Hacıbektaş", "Kozaklı", "Ürgüp"] },
  { plaka: 51, il: "Niğde", bolge: "İç Anadolu", buyuksehir: false, ilceler: ["Merkez", "Altunhisar", "Bor", "Çamardı", "Çiftlik", "Ulukışla"] },
  { plaka: 52, il: "Ordu", bolge: "Karadeniz", buyuksehir: true, ilceler: ["Akkuş", "Altınordu", "Aybastı", "Çamaş", "Çatalpınar", "Çaybaşı", "Fatsa", "Gölköy", "Gülyalı", "Gürgentepe", "İkizce", "Kabadüz", "Kabataş", "Korgan", "Kumru", "Mesudiye", "Perşembe", "Ulubey", "Ünye"] },
  { plaka: 53, il: "Rize", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Ardeşen", "Çamlıhemşin", "Çayeli", "Derepazarı", "Fındıklı", "Güneysu", "Hemşin", "İkizdere", "İyidere", "Kalkandere", "Pazar"] },
  { plaka: 54, il: "Sakarya", bolge: "Marmara", buyuksehir: true, ilceler: ["Adapazarı", "Akyazı", "Arifiye", "Erenler", "Ferizli", "Geyve", "Hendek", "Karapürçek", "Karasu", "Kaynarca", "Kocaali", "Pamukova", "Sapanca", "Serdivan", "Söğütlü", "Taraklı"] },
  { plaka: 55, il: "Samsun", bolge: "Karadeniz", buyuksehir: true, ilceler: ["19 Mayıs", "Alaçam", "Asarcık", "Atakum", "Ayvacık", "Bafra", "Canik", "Çarşamba", "Havza", "İlkadım", "Kavak", "Ladik", "Salıpazarı", "Tekkeköy", "Terme", "Vezirköprü", "Yakakent"] },
  { plaka: 56, il: "Siirt", bolge: "Güneydoğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Baykan", "Eruh", "Kurtalan", "Pervari", "Şirvan", "Tillo"] },
  { plaka: 57, il: "Sinop", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Ayancık", "Boyabat", "Dikmen", "Durağan", "Erfelek", "Gerze", "Saraydüzü", "Türkeli"] },
  { plaka: 58, il: "Sivas", bolge: "İç Anadolu", buyuksehir: false, ilceler: ["Merkez", "Akıncılar", "Altınyayla", "Divriği", "Doğanşar", "Gemerek", "Gölova", "Gürün", "Hafik", "İmranlı", "Kangal", "Koyulhisar", "Suşehri", "Şarkışla", "Ulaş", "Yıldızeli", "Zara"] },
  { plaka: 59, il: "Tekirdağ", bolge: "Marmara", buyuksehir: true, ilceler: ["Çerkezköy", "Çorlu", "Ergene", "Hayrabolu", "Kapaklı", "Malkara", "Marmaraereğlisi", "Muratlı", "Saray", "Süleymanpaşa", "Şarköy"] },
  { plaka: 60, il: "Tokat", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Almus", "Artova", "Başçiftlik", "Erbaa", "Niksar", "Pazar", "Reşadiye", "Sulusaray", "Turhal", "Yeşilyurt", "Zile"] },
  { plaka: 61, il: "Trabzon", bolge: "Karadeniz", buyuksehir: true, ilceler: ["Akçaabat", "Araklı", "Arsin", "Beşikdüzü", "Çarşıbaşı", "Çaykara", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı", "Maçka", "Of", "Ortahisar", "Sürmene", "Şalpazarı", "Tonya", "Vakfıkebir", "Yomra"] },
  { plaka: 62, il: "Tunceli", bolge: "Doğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Çemişgezek", "Hozat", "Mazgirt", "Nazımiye", "Ovacık", "Pertek", "Pülümür"] },
  { plaka: 63, il: "Şanlıurfa", bolge: "Güneydoğu Anadolu", buyuksehir: true, ilceler: ["Akçakale", "Birecik", "Bozova", "Ceylanpınar", "Eyyübiye", "Halfeti", "Haliliye", "Harran", "Hilvan", "Karaköprü", "Siverek", "Suruç", "Viranşehir"] },
  { plaka: 64, il: "Uşak", bolge: "Ege", buyuksehir: false, ilceler: ["Merkez", "Banaz", "Eşme", "Karahallı", "Sivaslı", "Ulubey"] },
  { plaka: 65, il: "Van", bolge: "Doğu Anadolu", buyuksehir: true, ilceler: ["Bahçesaray", "Başkale", "Çaldıran", "Çatak", "Edremit", "Erciş", "Gevaş", "Gürpınar", "İpekyolu", "Muradiye", "Özalp", "Saray", "Tuşba"] },
  { plaka: 66, il: "Yozgat", bolge: "İç Anadolu", buyuksehir: false, ilceler: ["Merkez", "Akdağmadeni", "Aydıncık", "Boğazlıyan", "Çandır", "Çayıralan", "Çekerek", "Kadışehri", "Saraykent", "Sarıkaya", "Sorgun", "Şefaatli", "Yenifakılı", "Yerköy"] },
  { plaka: 67, il: "Zonguldak", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Alaplı", "Çaycuma", "Devrek", "Gökçebey", "Karadeniz Ereğli", "Kilimli", "Kozlu"] },
  { plaka: 68, il: "Aksaray", bolge: "İç Anadolu", buyuksehir: false, ilceler: ["Merkez", "Ağaçören", "Eskil", "Gülağaç", "Güzelyurt", "Ortaköy", "Sarıyahşi", "Sultanhanı"] },
  { plaka: 69, il: "Bayburt", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Aydıntepe", "Demirözü"] },
  { plaka: 70, il: "Karaman", bolge: "İç Anadolu", buyuksehir: false, ilceler: ["Merkez", "Ayrancı", "Başyayla", "Ermenek", "Kazımkarabekir", "Sarıveliler"] },
  { plaka: 71, il: "Kırıkkale", bolge: "İç Anadolu", buyuksehir: false, ilceler: ["Merkez", "Bahşılı", "Balışeyh", "Çelebi", "Delice", "Karakeçili", "Keskin", "Sulakyurt", "Yahşihan"] },
  { plaka: 72, il: "Batman", bolge: "Güneydoğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Beşiri", "Gercüş", "Hasankeyf", "Kozluk", "Sason"] },
  { plaka: 73, il: "Şırnak", bolge: "Güneydoğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Beytüşşebap", "Cizre", "Güçlükonak", "İdil", "Silopi", "Uludere"] },
  { plaka: 74, il: "Bartın", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Amasra", "Kurucaşile", "Ulus"] },
  { plaka: 75, il: "Ardahan", bolge: "Doğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Çıldır", "Damal", "Göle", "Hanak", "Posof"] },
  { plaka: 76, il: "Iğdır", bolge: "Doğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Aralık", "Karakoyunlu", "Tuzluca"] },
  { plaka: 77, il: "Yalova", bolge: "Marmara", buyuksehir: false, ilceler: ["Merkez", "Altınova", "Armutlu", "Çınarcık", "Çiftlikköy", "Termal"] },
  { plaka: 78, il: "Karabük", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Eflani", "Eskipazar", "Ovacık", "Safranbolu", "Yenice"] },
  { plaka: 79, il: "Kilis", bolge: "Güneydoğu Anadolu", buyuksehir: false, ilceler: ["Merkez", "Elbeyli", "Musabeyli", "Polateli"] },
  { plaka: 80, il: "Osmaniye", bolge: "Akdeniz", buyuksehir: false, ilceler: ["Merkez", "Bahçe", "Düziçi", "Hasanbeyli", "Kadirli", "Sumbas", "Toprakkale"] },
  { plaka: 81, il: "Düzce", bolge: "Karadeniz", buyuksehir: false, ilceler: ["Merkez", "Akçakoca", "Cumayeri", "Çilimli", "Gölyaka", "Gümüşova", "Kaynaşlı", "Yığılca"] },
];
