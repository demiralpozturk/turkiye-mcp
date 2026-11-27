# turkiye-mcp

[![CI](https://github.com/demiralpozturk/turkiye-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/demiralpozturk/turkiye-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node.js 20+](https://img.shields.io/badge/node-%3E%3D20-339933)
![MCP](https://img.shields.io/badge/MCP-stdio-6e56cf)

**Turkish public data for AI assistants.** An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that lets Claude Desktop, Claude Code, Cursor and other MCP clients look up TCMB exchange rates, the Resmî Gazete (Official Gazette), supermarket prices, public holidays and provinces/districts. It also validates TCKN, VKN and IBAN checksums offline.

> [!IMPORTANT]
> **Unofficial; not affiliated with TCMB, Resmî Gazete, the Ministry of Trade or any public institution.** Always check important information against the official source linked in every answer.

Creator: **Demiralp Öztürk** · [GitHub](https://github.com/demiralpozturk) · [LinkedIn](https://www.linkedin.com/in/demiralp-%C3%B6zt%C3%BCrk/)

[English](#english) · [Türkçe](#türkçe)

---

## English

### What it is

Ask your assistant things like *"What was the USD/TRY rate last Sunday?"*, *"Anything about customs in today's Resmî Gazete?"* or *"Where is olive oil cheapest?"*. The assistant calls these tools and answers from real, dated data, with the source attached.

- **9 tools**, all read-only. Descriptions and input schemas are written in Turkish and English.
- **No API keys and no accounts.** Live data comes from public, static files.
- **Polite:** every request has a timeout and a clear User-Agent, and responses are kept in an in-memory cache.
- **Private:** the validators run entirely on your machine and never look anyone up.

### Tools

| Tool | What it does | Data | Network |
| --- | --- | --- | --- |
| `doviz_kurlari` | TCMB indicative exchange rates (forex/banknote buying and selling, cross rates). Shows the latest bulletin or the one for a given date. Weekends and holidays fall back to the last published bulletin. | [TCMB](https://www.tcmb.gov.tr/kurlar/today.xml) | yes |
| `resmi_gazete_gunluk` | Contents of a day's Resmî Gazete (default: latest), with official links and an optional category filter (customs, foreign trade, tax, energy…) | [resmi-gazete-takip](https://demiralpozturk.github.io/resmi-gazete-takip/) open data | yes |
| `resmi_gazete_ara` | Search Resmî Gazete titles of the last 90 days. Matching ignores accents and case. Filter by category and date range. | same | yes |
| `market_fiyat_ara` | Compare branch-level prices of staple products across Migros, A101, ŞOK, BİM, CarrefourSA and Hakmar. Regular and discounted prices are shown separately. | [market-scraper](https://demiralpozturk.github.io/market-scraper/) open data | yes |
| `resmi_tatiller` | Public holidays of a year, including half-day eves. Can also tell whether a date is a holiday and when the next holiday is. | Law No. 2429 + Diyanet calendar (2024–2030) | no |
| `il_ilce` | 81 provinces with plate codes, regions and metropolitan status, plus all 973 districts. Search by name, alias (Urfa, Afyon…), plate code or district. | static dataset ([provenance](NOTICE)) | no |
| `tckn_dogrula` | TCKN (national ID) checksum validation | algorithm only | no |
| `vkn_dogrula` | VKN (tax ID) check-digit validation | algorithm only | no |
| `iban_dogrula` | IBAN mod-97 check. For TR IBANs it also checks the 26-character structure, the reserve digit and the bank code. | algorithm + [TCMB FAST participant list](https://www.tcmb.gov.tr/wps/wcm/connect/fast/katilimcilar) | no |

### Quick start

Requires **Node.js 20 or newer**.

**Option A: `npx`**

```bash
npx -y turkiye-mcp
```

> [!NOTE]
> The package is not on npm yet, so `npx -y turkiye-mcp` will work only after it is published. Until then, use option B. The config snippets below show both forms.

**Option B: from source**

```bash
git clone https://github.com/demiralpozturk/turkiye-mcp.git
cd turkiye-mcp
npm install        # also builds dist/
node dist/index.js --help
```

The server speaks MCP over **stdio**, so it is meant to be started by an MCP client rather than run by hand.

### Configure your client

#### Claude Desktop

Edit `claude_desktop_config.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "turkiye": {
      "command": "npx",
      "args": ["-y", "turkiye-mcp"]
    }
  }
}
```

From a local build, use an absolute path to `dist/index.js` (on Windows, escape backslashes: `C:\\path\\to\\turkiye-mcp\\dist\\index.js`):

```json
{
  "mcpServers": {
    "turkiye": {
      "command": "node",
      "args": ["/absolute/path/to/turkiye-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop afterwards.

#### Claude Code

```bash
claude mcp add turkiye -- npx -y turkiye-mcp
# or, from a local build:
claude mcp add turkiye -- node /absolute/path/to/turkiye-mcp/dist/index.js
```

#### Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (per project):

```json
{
  "mcpServers": {
    "turkiye": {
      "command": "npx",
      "args": ["-y", "turkiye-mcp"]
    }
  }
}
```

#### Other clients

Any MCP client that can launch a stdio server works. Use the command `npx -y turkiye-mcp` or `node /absolute/path/to/dist/index.js`.

### Example prompts

- "TCMB'ye göre bugün dolar ve euro kaç TL?" / "What were the TCMB USD and EUR rates on 22 November 2026?"
- "Bugünkü Resmî Gazete'de gümrük veya dış ticaretle ilgili bir şey var mı?"
- "Son 90 günde ithalatta haksız rekabet tebliğlerini listele."
- "Zeytinyağı en ucuz hangi markette? İndirimleri ayrı göster."
- "2027'de hafta içine denk gelen resmi tatiller hangileri? Kurban Bayramı arifesi yarım gün mü?"
- "Kemalpaşa hangi ilde?" / "List the districts of Ankara."
- "Is this IBAN valid: TR33 0006 1005 1978 6457 8413 26?"

### Example outputs

These are real responses from a local run on 27 Nov 2026, shortened with `…`.

<details>
<summary><code>doviz_kurlari</code> <code>{"tarih": "2026-11-22", "kodlar": ["USD"]}</code>: a Sunday, so it falls back to Friday's bulletin</summary>

```json
{
  "bulletinDate": "2026-11-20",
  "bulletinNo": "2026/219",
  "requestedDate": "2026-11-22",
  "fellBack": true,
  "currency": "TRY",
  "rates": [
    {
      "code": "USD",
      "unit": 1,
      "nameTr": "ABD DOLARI",
      "nameEn": "US DOLLAR",
      "forexBuying": 50.4028,
      "forexSelling": 50.4936,
      "banknoteBuying": 50.3676,
      "banknoteSelling": 50.5694,
      "crossRateUSD": null,
      "crossRateOther": null
    }
  ],
  "source": "https://www.tcmb.gov.tr/kurlar/202611/20112026.xml",
  "notes": [
    "2026-11-22 için bülten yok (hafta sonu, resmî tatil veya henüz yayımlanmadı); en son yayımlanan 2026-11-20 bülteni gösteriliyor. / No bulletin for 2026-11-22 (weekend, holiday or not published yet); showing the last published bulletin (2026-11-20).",
    "…"
  ]
}
```
</details>

<details>
<summary><code>resmi_gazete_ara</code> <code>{"kategori": "dis-ticaret", "limit": 3}</code></summary>

```json
{
  "category": { "code": "dis-ticaret", "name": "İthalat / İhracat" },
  "coverage": { "from": "2026-10-30", "to": "2026-11-27" },
  "totalMatches": 4,
  "returned": 3,
  "results": [
    {
      "date": "2026-11-27",
      "type": "Karar",
      "title": "Kaynak Kullanımını Destekleme Fonu Kesintisi Hakkındaki Ekli Kararın Yürürlüğe Konulması Hakkında Karar (Karar Sayısı: 12027)",
      "institution": "Cumhurbaşkanlığı",
      "categories": ["dis-ticaret", "finans"],
      "url": "https://www.resmigazete.gov.tr/eskiler/2026/11/20261127-14.pdf"
    },
    {
      "date": "2026-11-26",
      "type": "Tebliğ",
      "title": "İthalatta Haksız Rekabetin Önlenmesine İlişkin Tebliğ (No: 2026/33)",
      "institution": "Ticaret Bakanlığı",
      "section": "YÜRÜTME VE İDARE BÖLÜMÜ",
      "categories": ["dis-ticaret"],
      "issue": "33442",
      "url": "https://www.resmigazete.gov.tr/eskiler/2026/11/20261126-4.htm"
    },
    "…"
  ],
  "source": "https://demiralpozturk.github.io/resmi-gazete-takip/data/son90.json"
}
```
</details>

<details>
<summary><code>market_fiyat_ara</code> <code>{"urun": "colgate", "limit": 1}</code>: regular and discounted prices kept apart</summary>

```json
{
  "totalMatches": 1,
  "products": [
    {
      "name": "Colgate Optik Beyaz Diş Macunu 75 Ml",
      "category": "Kişisel Bakım",
      "cheapestByRegularPrice": { "market": "Migros", "regularPrice": 356.95 },
      "bestDealInclDiscounts": { "market": "CarrefourSA", "price": 200, "discounted": true },
      "prices": [
        { "market": "Migros", "regularPrice": 356.95, "price": 356.95, "discount": false, "store": "Kadıköy Caferağa M Migros", "sourceTime": "27.11.2026 12:10" },
        { "market": "CarrefourSA", "regularPrice": 459.95, "price": 200, "discount": true, "discountPercent": 56.52, "store": "Istanbul Acıbadem Hıper", "sourceTime": "27.11.2026 12:10" }
      ]
    }
  ],
  "lastUpdated": "2026-11-27T17:19:20+03:00",
  "notice": "… Prices are branch-level (store) prices from the Ministry of Trade’s marketfiyati.org.tr and may differ online or at other branches. \"regularPrice\" is the undiscounted price, \"price\" includes any discount; \"cheapest\" compares regular prices."
}
```
</details>

<details>
<summary><code>resmi_tatiller</code> <code>{"tarih": "2026-05-26"}</code></summary>

```json
{
  "year": 2026,
  "checkedDate": {
    "date": "2026-05-26",
    "day": "Salı",
    "weekend": false,
    "holiday": {
      "name": "Kurban Bayramı Arifesi (13:00’ten itibaren)",
      "nameEn": "Eid al-Adha Eve (from 13:00)",
      "type": "dini",
      "halfDay": true
    },
    "status": "yarim_gun_tatil"
  },
  "summary": { "fullDays": 14, "halfDays": 3, "fullDaysOnWeekdays": 10 },
  "holidays": ["…17 entries…"]
}
```
</details>

<details>
<summary><code>il_ilce</code> <code>{"sorgu": "Kemalpaşa"}</code> and <code>tckn_dogrula</code> <code>{"tckn": "10000000146"}</code></summary>

```json
{
  "query": "Kemalpaşa",
  "match": "ilce_tam_eslesme",
  "count": 2,
  "districts": [
    { "ilce": "Kemalpaşa", "il": "Artvin", "plaka": "08" },
    { "ilce": "Kemalpaşa", "il": "İzmir", "plaka": "35" }
  ]
}
```

```json
{
  "type": "TCKN",
  "valid": true,
  "masked": "100******46",
  "errors": [],
  "note": "… Checksum only; no lookup was made. A valid checksum does not mean the number exists or belongs to anyone."
}
```
</details>

### Data sources

| Data | Source | Notes |
| --- | --- | --- |
| Exchange rates | [TCMB today.xml](https://www.tcmb.gov.tr/kurlar/today.xml) and the dated archive `https://www.tcmb.gov.tr/kurlar/YYYYMM/DDMMYYYY.xml` | Indicative rates announced around 15:30 Istanbul time on the bulletin date. Bank rates differ. |
| Resmî Gazete | [resmi-gazete-takip](https://github.com/demiralpozturk/resmi-gazete-takip) open data (`data/latest.json`, `data/index.json`, `data/son90.json`, `data/YYYY/MM/DD.json`) | Compiled daily from the official index. Every item links to the official PDF/HTML on resmigazete.gov.tr. This server never scrapes resmigazete.gov.tr. |
| Market prices | [market-scraper](https://github.com/demiralpozturk/market-scraper) open data (`products_data.json`) | Store (branch) prices from the Ministry of Trade's [marketfiyati.org.tr](https://marketfiyati.org.tr), refreshed every 6 hours. This server never calls marketfiyati.org.tr. |
| Public holidays | Law No. 2429 (fixed holidays) and the [Diyanet "Dini Günler"](https://vakithesaplama.diyanet.gov.tr/dini_gunler.php) calendar | Religious holidays are bundled for 2024–2030. Government bridge days (idari izin) are not public holidays and are not listed. |
| Provinces / districts | Official administrative divisions (81 provinces, 973 districts) | Provenance and the upstream MIT notice are in [NOTICE](NOTICE). |
| IBAN bank names | [TCMB FAST participant list](https://www.tcmb.gov.tr/wps/wcm/connect/fast/katilimcilar) | Used only to label a validated IBAN. |

### How it behaves

- **Caching:** results are kept in memory. `today.xml` is cached for 10 minutes and archived bulletins for 24 hours. Resmî Gazete data is cached for 30 minutes to 6 hours and market data for 30 minutes. Missing files (404) are remembered briefly, so nobody hammers a URL that does not exist.
- **Politeness:** every request has a 10-second timeout and the User-Agent `turkiye-mcp/<version> (+repo URL)`. Identical concurrent requests are merged into one.
- **Errors:** network problems come back as readable tool errors (`isError: true`), so the assistant can explain them instead of crashing.
- **Privacy:** `tckn_dogrula`, `vkn_dogrula` and `iban_dogrula` only run checksum algorithms and mask the input in their output. They never contact NVİ/KPS, GİB, banks or any lookup service. A valid checksum does not prove that a number exists or belongs to anyone. The project bundles no personal data.

### Project structure

```text
turkiye-mcp/
├── src/
│   ├── index.ts            # CLI entry point (stdio transport, --help/--version)
│   ├── server.ts           # creates the McpServer and registers all tools
│   ├── context.ts          # shared dependencies (HTTP client, clock)
│   ├── version.ts
│   ├── lib/
│   │   ├── http.ts         # polite fetch: timeout, User-Agent, cache, 404 memo, de-dup
│   │   ├── cache.ts        # in-memory TTL + LRU cache
│   │   ├── dates.ts        # Istanbul "today", date parsing (YYYY-MM-DD / DD.MM.YYYY)
│   │   ├── text.ts         # Turkish-aware, accent-insensitive search
│   │   └── result.ts       # tool result helpers
│   ├── tools/
│   │   ├── doviz.ts        # doviz_kurlari
│   │   ├── resmi-gazete.ts # resmi_gazete_gunluk, resmi_gazete_ara
│   │   ├── market.ts       # market_fiyat_ara
│   │   ├── tatiller.ts     # resmi_tatiller
│   │   ├── il-ilce.ts      # il_ilce
│   │   └── dogrulama.ts    # tckn_dogrula, vkn_dogrula, iban_dogrula
│   └── data/               # static datasets (provinces, Bayram dates, bank codes)
├── test/                   # vitest unit tests, fixtures, live smoke test
├── scripts/smoke.mjs       # end-to-end check: spawns dist/index.js over stdio
├── .github/workflows/ci.yml
├── NOTICE                  # data provenance and third-party notices
└── LICENSE
```

### Development

```bash
npm install          # installs dependencies and builds dist/
npm test             # all tests (the live test skips itself when offline)
npm run test:offline # everything except the live smoke test
npm run typecheck
npm run build
npm run smoke        # starts dist/index.js over stdio and calls every tool
```

Set `SKIP_LIVE=1` to skip the live test explicitly. CI runs the type check and tests on Node 22 and 24, then an end-to-end job that starts the built server over stdio and calls every tool against live data.

### Contributing

Issues and pull requests are welcome, especially new tools that use **openly licensed, official or public data** without scraping sites that forbid it.

1. Fork the repo and create a branch (`feat/...`, `fix/...`).
2. Add or update tests. Unit tests must run offline, using fixtures under `test/fixtures`.
3. Run `npm run typecheck && npm test`.
4. Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `ci:`) and open a pull request.

Guidelines for new tools:

- Read-only only.
- Write descriptions in Turkish and English, and include a `source` and the data date in the output.
- Never add tools that look up people (identity, phone numbers, addresses) or other personal data.
- If you bundle a dataset, record its source and license in `NOTICE`.

### Disclaimer

This is an independent, unofficial open-source project. It is **not affiliated with, endorsed by or connected to** TCMB (Central Bank of the Republic of Türkiye), the Resmî Gazete, the Ministry of Trade, the Ministry of Interior, Diyanet or any other public institution. It uses no official logos or trademarks. Data may be delayed, incomplete or wrong. It is provided "as is" and is not financial, legal or tax advice. Always check the official source.

### License

[MIT](LICENSE) © 2026 Demiralp Öztürk. See [NOTICE](NOTICE) for data provenance and third-party notices.

---

## Türkçe

### Nedir?

**turkiye-mcp**, Claude Desktop, Claude Code, Cursor gibi yapay zekâ asistanlarının Türkiye'ye ait kamuya açık verilere erişmesini sağlayan bir [MCP](https://modelcontextprotocol.io) sunucusudur. Asistanınıza *"Geçen pazar dolar kaç TL'ydi?"*, *"Bugünkü Resmî Gazete'de gümrükle ilgili ne var?"* ya da *"Zeytinyağı en ucuz nerede?"* diye sorabilirsiniz. Asistan bu araçları çağırır ve tarihli, kaynaklı gerçek veriyle cevap verir.

> [!IMPORTANT]
> **Gayriresmî bir projedir; TCMB, Resmî Gazete, Ticaret Bakanlığı veya herhangi bir kamu kurumuyla bağlantısı yoktur.** Önemli bilgileri her cevapta verilen resmî kaynaktan doğrulayın.

### Araçlar

| Araç | Ne yapar? |
| --- | --- |
| `doviz_kurlari` | TCMB gösterge kurlarını getirir: döviz ve efektif alış/satış, çapraz kurlar. Tarih verilmezse en güncel bülteni, verilirse o günün bültenini döndürür. Hafta sonu veya tatil gibi bülten olmayan günlerde son yayımlanan bültene düşer. |
| `resmi_gazete_gunluk` | Bir günün (varsayılan: en son) Resmî Gazete içeriğini resmî bağlantılarıyla listeler. Gümrük, dış ticaret, vergi gibi kategorilere göre süzülebilir. |
| `resmi_gazete_ara` | Son 90 günün Resmî Gazete başlıklarında arama yapar. Türkçe karakter ve büyük/küçük harf fark etmez. Kategori ve tarih aralığıyla daraltılabilir. |
| `market_fiyat_ara` | Migros, A101, ŞOK, BİM, CarrefourSA ve Hakmar'daki temel ürünlerin şube fiyatlarını karşılaştırır. Normal ve indirimli fiyatı ayrı gösterir. |
| `resmi_tatiller` | Bir yılın resmî tatillerini (arifeler yarım gün) listeler. Bir günün tatil olup olmadığını ve sıradaki tatili de söyler. |
| `il_ilce` | 81 ili plaka, bölge ve büyükşehir bilgisiyle, 973 ilçeyle birlikte verir. İl adıyla, "Urfa", "Afyon" gibi yaygın adlarla, plakayla veya ilçe adıyla aranabilir. |
| `tckn_dogrula` | T.C. Kimlik No algoritma kontrolü |
| `vkn_dogrula` | Vergi Kimlik No kontrol hanesi doğrulaması |
| `iban_dogrula` | IBAN mod-97 kontrolü. TR IBAN'larda 26 karakter biçimini, rezerv haneyi ve banka kodunu da kontrol eder. |

### Kurulum

Node.js 20 veya üzeri gerekir.

```bash
# npm'de yayımlandıktan sonra:
npx -y turkiye-mcp

# Şimdilik kaynaktan:
git clone https://github.com/demiralpozturk/turkiye-mcp.git
cd turkiye-mcp
npm install
node dist/index.js --help
```

**Claude Desktop:** `claude_desktop_config.json` dosyasına ekleyin. Dosya Windows'ta `%APPDATA%\Claude\`, macOS'ta `~/Library/Application Support/Claude/` altındadır.

```json
{
  "mcpServers": {
    "turkiye": { "command": "npx", "args": ["-y", "turkiye-mcp"] }
  }
}
```

Yerel derlemede `"command": "node"` ve `"args": ["C:\\tam\\yol\\turkiye-mcp\\dist\\index.js"]` kullanın.

**Claude Code:**

```bash
claude mcp add turkiye -- npx -y turkiye-mcp
```

**Cursor:** aynı JSON'u `~/.cursor/mcp.json` veya proje içindeki `.cursor/mcp.json` dosyasına ekleyin.

### Örnek istekler

- "TCMB'ye göre bugün dolar ve euro kaç TL?"
- "22 Kasım 2026 pazar günü için dolar kuru neydi?" (Bülten olmadığı için cuma gününün bültenini verir ve bunu açıkça belirtir.)
- "Bugünkü Resmî Gazete'de vergiyle ilgili ne var?"
- "Son 90 günde 'yetkilendirilmiş yükümlü' geçen düzenlemeler hangileri?"
- "Çay en ucuz hangi markette? İndirimleri ayrı göster."
- "2027 Kurban Bayramı hangi günlere denk geliyor, arife yarım gün mü?"
- "Derecik hangi ilin ilçesi?" / "Ege Bölgesi'ndeki illeri plaka kodlarıyla listele."
- "Bu IBAN geçerli mi: TR33 0006 1005 1978 6457 8413 26"

### Veri kaynakları

- **Döviz kurları:** [TCMB](https://www.tcmb.gov.tr/kurlar/today.xml). Gösterge niteliğindeki kurlar bülten günü yaklaşık 15:30'da ilan edilir.
- **Resmî Gazete:** [resmi-gazete-takip](https://github.com/demiralpozturk/resmi-gazete-takip) açık verisi. resmigazete.gov.tr doğrudan taranmaz; her kayıt resmî yayına bağlantı verir.
- **Market fiyatları:** [market-scraper](https://github.com/demiralpozturk/market-scraper) açık verisi. Bu veri Ticaret Bakanlığı [marketfiyati.org.tr](https://marketfiyati.org.tr)'nin mağaza (şube) fiyatlarından derlenir; online fiyatlardan ve diğer şubelerden farklı olabilir. marketfiyati.org.tr'ye doğrudan istek atılmaz.
- **Resmî tatiller:** sabit tatiller 2429 sayılı Kanun'a göre hesaplanır. Dini bayramlar 2024–2030 yılları için [Diyanet takviminden](https://vakithesaplama.diyanet.gov.tr/dini_gunler.php) alınmıştır. İdari izin (köprü) günleri listede yoktur.
- **İl/ilçe:** resmî mülki idare bölümleri (81 il, 973 ilçe). Kaynak ve lisans notları [NOTICE](NOTICE) dosyasındadır.

### Gizlilik

TCKN, VKN ve IBAN araçları **yalnızca algoritmik kontrol** yapar ve sonuçta numarayı maskeler. NVİ/KPS, GİB, banka ya da herhangi bir sorgulama servisine **bağlanmaz**. Algoritmanın tutması, numaranın gerçek bir kişiye, kuruma veya hesaba ait olduğunu göstermez. Projede kişisel veri bulunmaz.

### Katkı

Issue ve pull request'ler memnuniyetle karşılanır. Yeni araçlar salt okunur olmalı, açık lisanslı veya kamuya açık veri kullanmalı ve kişi sorgulamamalıdır. Birim testleri internetsiz çalışmalıdır (`test/fixtures`). Commit mesajlarında Conventional Commits (`feat:`, `fix:`, `docs:`…) kullanın. Göndermeden önce `npm run typecheck && npm test` çalıştırın.

### Sorumluluk reddi

Bu proje bağımsız ve gayriresmîdir. TCMB, Resmî Gazete, Ticaret Bakanlığı, İçişleri Bakanlığı, Diyanet veya herhangi bir kamu kurumu tarafından desteklenmez ve bu kurumlarla ilişkili değildir. Resmî logo veya marka kullanılmaz. Veriler gecikmeli, eksik veya hatalı olabilir. Proje "olduğu gibi" sunulur ve yatırım, hukuk ya da vergi tavsiyesi değildir.

### Lisans

[MIT](LICENSE) © 2026 Demiralp Öztürk

Hazırlayan: **Demiralp Öztürk** · [GitHub](https://github.com/demiralpozturk) · [LinkedIn](https://www.linkedin.com/in/demiralp-%C3%B6zt%C3%BCrk/)
