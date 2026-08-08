window.CHECKLIST = {
  groups: [
    {
      id: "general",
      title: "כללי · לוגיסטיקה",
      items: [
        { id: "k-eta", label: "K-ETA / ויזה לקוריאה (אם נדרש)", window: "לפני היציאה", priority: "high" },
        { id: "j-vjweb", label: "Visit Japan Web (QR למכס/הגירה)", window: "לפני היציאה", priority: "high" },
        { id: "k-esim", label: "eSIM / Wi‑Fi לקוריאה", window: "1–2 שבועות לפני", priority: "high" },
        { id: "g-esim-jp", label: "eSIM / Wi‑Fi ליפן (או חבילה משולבת)", window: "1–2 שבועות לפני", priority: "high" },
        { id: "g-insurance", label: "ביטוח נסיעות", window: "לפני היציאה", priority: "high" },
        { id: "g-flights-check", label: "אימות טיסות: סיאול→טוקיו + טיסת חזרה (23 או 24 בספט׳)", window: "בהקדם", priority: "high" },
        { id: "j-shinkansen", label: "מקומות שינקנסן מרכזיים (SmartEX / JR)", window: "להזמין ~30 יום לפני", priority: "high" },
        {
          id: "g-luggage",
          label: "Takkyubin: מזוודות גדולות טוקיו→קיוטו בבוקר היציאה להקונה (רק תרמילים ל־2 לילות)",
          window: "בוקר 6 בספט׳",
          priority: "high",
        },
        { id: "g-money", label: "כרטיס/מזומן: וון + ין, והגדרת תשלום בנייד", window: "לפני היציאה", priority: "medium" },
      ],
    },
    {
      id: "seoul",
      title: "סיאול",
      items: [
        { id: "h-seoul", label: "מלון — 9 Brick Hotel Hongdae", window: "1–3 שבועות לפני", priority: "low" },
        { id: "k-tmoney", label: "Climate Card / T-Money לתחבורה", window: "בהגעה או לפני", priority: "medium" },
        { id: "k-secret", label: "גן הסודי ב־Changdeokgung", window: "להזמין מוקדם ככל האפשר", priority: "high" },
        { id: "k-lotte", label: "כרטיסים ללוטה וורלד", window: "להזמין 2–4 שבועות לפני", priority: "high" },
        { id: "k-ntower", label: "כרטיסים ל־N Seoul Tower (שקיעה)", window: "להזמין 1–2 שבועות לפני", priority: "medium" },
        {
          id: "s-skin",
          label: "טיפול פנים ב־Seoulistique בסאונגסו (Instagram @seoulistique.skin / WhatsApp)",
          window: "להזמין 1–3 שבועות לפני · 31 באוג׳ אחה״צ",
          priority: "high",
        },
        {
          id: "s-headspa",
          label: "Head Spa בהונגדה 10:00–11:30 (Parkjun / Eco Jardin) לפני סאונגסו",
          window: "להזמין 1–3 שבועות לפני · 31 באוג׳",
          priority: "high",
        },
      ],
    },
    {
      id: "tokyo1",
      title: "טוקיו · חלק 1",
      items: [
        { id: "h-tokyo1", label: "מלון — אזור Shinjuku / מערב טוקיו (1–6 בספט׳)", window: "להזמין בהקדם", priority: "high" },
        { id: "j-shibuya-sky", label: "כרטיס שקיעה ל־Shibuya Sky", window: "להזמין ~4 שבועות לפני", priority: "high" },
        {
          id: "j-ghibli",
          label: "מוזיאון ג׳יבלי — כרטיסים (נפתחים ב־10 לחודש ב־10:00 JST לחודש העוקב)",
          window: "10 באוג׳ 2026 · 10:00 JST (ליום 5 בספט׳)",
          priority: "high",
        },
        { id: "t1-suica", label: "Suica / Pasmo בהגעה", window: "ביום הנחיתה", priority: "medium" },
      ],
    },
    {
      id: "hakone",
      title: "הקונה",
      items: [
        { id: "h-hakone", label: "ריוקאן / מלון עם אונסן (6–7 בספט׳)", window: "להזמין בהקדם", priority: "high" },
        {
          id: "hk-romancecar",
          label: "Romancecar + מושבי Observation Car קדמיים",
          window: "להזמין ~חודש לפני",
          priority: "high",
        },
        { id: "hk-onsen-etiquette", label: "בדיקת כללי אונסן / ארוחת kaiseki במלון", window: "לפני הצ׳ק־אין", priority: "low" },
      ],
    },
    {
      id: "kawaguchiko",
      title: "קוואגוצ׳יקו / פוג׳י",
      items: [
        { id: "h-kawaguchiko", label: "מלון באזור האגם (7–9 בספט׳)", window: "להזמין בהקדם", priority: "high" },
        { id: "j-fujiq", label: "כרטיסים ל־Fuji-Q Highland", window: "להזמין 2–4 שבועות לפני", priority: "high" },
        {
          id: "kw-chureito",
          label: "צ׳ורייטו בשקיעה ביום ההגעה (לא בזריחה לפני Fuji-Q)",
          window: "7 בספט׳ אחר הצהריים",
          priority: "medium",
        },
        { id: "j-mishima", label: "מעבר ל־Kyoto דרך Mishima (אוטובוס + שינקנסן)", window: "שינקנסן ~30 יום לפני", priority: "high" },
      ],
    },
    {
      id: "kyoto",
      title: "קיוטו",
      items: [
        { id: "h-kyoto", label: "מלון במרכז / Kawaramachi (9–14 בספט׳)", window: "להזמין בהקדם", priority: "high" },
        {
          id: "ky-biovortex",
          label: "כרטיסי teamLab Biovortex Kyoto לפי שעה (ליד תחנת קיוטו)",
          window: "להזמין 2–6 שבועות לפני · 9 בספט׳ אחה״צ",
          priority: "high",
        },
        {
          id: "ky-kawadoko",
          label: "צהריים kawadoko בקיבונה — Hirobun או Fujiya (חובה מראש)",
          window: "שבועות לפני · 12 בספט׳",
          priority: "high",
        },
        { id: "ky-fushimi", label: "יציאה מוקדמת ל־Fushimi Inari (בלי נישיקי באותו יום)", window: "10 בספט׳", priority: "medium" },
        { id: "ky-bags", label: "איסוף מזוודות Takkyubin + העברה הלאה לאוסקה", window: "בהגעה לקיוטו / לפני אוסקה", priority: "medium" },
      ],
    },
    {
      id: "osaka",
      title: "אוסקה (+ נארה / הירושימה)",
      items: [
        { id: "h-osaka", label: "מלון ליד Namba / Dotonbori (14–19 בספט׳)", window: "להזמין בהקדם", priority: "high" },
        {
          id: "j-usj",
          label: "USJ Express Pass — בדיוק חודשיים מראש בחצות שעון יפן",
          window: "15 ביולי 2026 · 00:00 JST (ליום 15 בספט׳)",
          priority: "high",
        },
        { id: "j-hiroshima-dt", label: "שינקנסן הלוך־חזור להירושימה / מיאג׳ימה", window: "להזמין ~30 יום לפני", priority: "medium" },
        { id: "os-nara", label: "כרטיסי רכבת ליום בנארה (Kintetsu/JR)", window: "ביום עצמו או מראש", priority: "low" },
        { id: "os-umeda", label: "כרטיס תצפית Umeda Sky Building (שקיעה)", window: "ימים לפני", priority: "low" },
      ],
    },
    {
      id: "tokyo2",
      title: "טוקיו · חלק 2 ויציאה",
      items: [
        {
          id: "h-tokyo2",
          label: "מלון בגינזה / שיאודומה (19–23/24 בספט׳) — נוח לנריטה ולהאנדה",
          window: "להזמין בהקדם",
          priority: "high",
        },
        { id: "t2-return-train", label: "שינקנסן אוסקה → טוקיו", window: "להזמין ~30 יום לפני", priority: "high" },
        { id: "t2-flex", label: "יום רגוע בטוקיו — קימה מאוחרת, קפה וקניות קלות", window: "21 בספט׳", priority: "low" },
        { id: "t2-airport", label: "N'EX / רכבת לנריטה או האנדה לפי הטיסה", window: "כשיודעים שדה תעופה", priority: "high" },
        { id: "t2-farewell", label: "הזמנת ארוחת פרידה", window: "1–2 שבועות לפני", priority: "medium" },
      ],
    },
  ],
};
