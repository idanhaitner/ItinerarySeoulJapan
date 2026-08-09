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
        { id: "g-flights-check", label: "טיסות ✓ הוזמנו: ET0419+ET0672 · YP7321 · לטפל: טוקיו→בנגקוק + בנגקוק→טירנה", window: "בהקדם", priority: "high" },
        {
          id: "g-flight-out",
          label: "ET0419 TLV 15:35→ADD 19:50 + ET0672 ADD 22:35→ICN 16:00 (27 באוג׳) — צ׳ק־אין אונליין Ethiopian",
          window: "26 באוג׳",
          priority: "high",
        },
        {
          id: "g-flight-yp",
          label: "YP7321 Air Premia · ICN 08:50 → NRT 11:20 — להגיע ל־ICN ~06:30–07:00",
          window: "2 בספט׳",
          priority: "high",
        },
        {
          id: "g-flight-bkk",
          label: "טיסת טוקיו → בנגקוק (NRT/HND→BKK) — לאשר מספר טיסה · 1–2 לילות בתאילנד",
          window: "~24 בספט׳",
          priority: "high",
        },
        {
          id: "g-flight-tia",
          label: "טיסת בנגקוק → טירנה (BKK→TIA, אלבניה) — צריך להזמין",
          window: "~26 בספט׳",
          priority: "high",
        },
        { id: "j-shinkansen", label: "מקומות שינקנסן מרכזיים (SmartEX / JR)", window: "להזמין ~30 יום לפני", priority: "high" },
        {
          id: "g-luggage",
          label: "Takkyubin: מזוודות גדולות טוקיו→קיוטו בבוקר היציאה להקונה (רק תרמילים ל־2 לילות)",
          window: "בוקר 7 בספט׳",
          priority: "high",
        },
        { id: "g-money", label: "כרטיס/מזומן: וון + ין, והגדרת תשלום בנייד", window: "לפני היציאה", priority: "medium" },
      ],
    },
    {
      id: "seoul",
      title: "סיאול",
      items: [
        { id: "h-seoul", label: "מלון — Amanti Hotel Seoul Hongdae (27 באוג׳–2 בספט׳)", window: "הוזמן", priority: "low" },
        { id: "k-tmoney", label: "Climate Card / T-Money לתחבורה", window: "בהגעה או לפני", priority: "medium" },
        {
          id: "k-secret",
          label: "גן הסודי ב־Changdeokgung — סיור מודרך (ticket.uforus.co.kr · נפתח 10:00 KST עד 6 ימים קדימה)",
          window: "שבת 29 באוג׳",
          priority: "high",
        },
        { id: "k-lotte", label: "כרטיסים ללוטה וורלד (יום שני 31 באוג׳) ✓ הוזמן", window: "הוזמן", priority: "low" },
        { id: "k-ntower", label: "כרטיסים ל־N Seoul Tower (שקיעה · שלישי 1 בספט׳)", window: "להזמין 1–2 שבועות לפני", priority: "medium" },
        {
          id: "s-unni",
          label: "תור Unni Guide Center בגנגנאם (+ טיפול)",
          window: "שבת 29 באוג׳ · 15:00–16:00",
          priority: "high",
        },
        {
          id: "s-skin",
          label: "טיפול פנים ליד הונגדה (הקליניקה שענבל המליצה) — Seoulistique כגיבוי",
          window: "יום א׳ 30 באוג׳",
          priority: "high",
        },
        {
          id: "s-jimjilbang",
          label: "ג׳ימג׳ילבאנג ליד Jamsil אחרי לוטה",
          window: "31 באוג׳ בערב",
          priority: "medium",
        },
      ],
    },
    {
      id: "tokyo1",
      title: "טוקיו · חלק 1",
      items: [
        { id: "h-tokyo1", label: "מלון — אזור Shinjuku / מערב טוקיו (2–7 בספט׳)", window: "להזמין בהקדם", priority: "high" },
        { id: "j-shibuya-sky", label: "כרטיס שקיעה ל־Shibuya Sky", window: "להזמין ~4 שבועות לפני", priority: "high" },
        {
          id: "j-ghibli",
          label: "מוזיאון ג׳יבלי — כרטיסים (נפתחים ב־10 לחודש ב־10:00 JST לחודש העוקב)",
          window: "10 באוג׳ 2026 · 10:00 JST (ליום 6 בספט׳)",
          priority: "high",
        },
        { id: "t1-suica", label: "Suica / Pasmo בהגעה", window: "ביום הנחיתה", priority: "medium" },
      ],
    },
    {
      id: "hakone",
      title: "הקונה",
      items: [
        { id: "h-hakone", label: "ריוקאן / מלון עם אונסן (7–8 בספט׳)", window: "להזמין בהקדם", priority: "high" },
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
        { id: "h-kawaguchiko", label: "מלון באזור האגם (8–10 בספט׳)", window: "להזמין בהקדם", priority: "high" },
        { id: "j-fujiq", label: "כרטיסים ל־Fuji-Q Highland", window: "להזמין 2–4 שבועות לפני", priority: "high" },
        {
          id: "kw-chureito",
          label: "צ׳ורייטו בשקיעה ביום ההגעה (לא בזריחה לפני Fuji-Q)",
          window: "8 בספט׳ אחר הצהריים",
          priority: "medium",
        },
        { id: "j-mishima", label: "מעבר ל־Kyoto דרך Mishima (אוטובוס + שינקנסן)", window: "שינקנסן ~30 יום לפני", priority: "high" },
      ],
    },
    {
      id: "kyoto",
      title: "קיוטו",
      items: [
        { id: "h-kyoto", label: "מלון במרכז / Kawaramachi (10–15 בספט׳)", window: "להזמין בהקדם", priority: "high" },
        {
          id: "ky-biovortex",
          label: "כרטיסי teamLab Biovortex Kyoto לפי שעה (ליד תחנת קיוטו)",
          window: "להזמין 2–6 שבועות לפני · 10 בספט׳ אחה״צ",
          priority: "high",
        },
        {
          id: "ky-kawadoko",
          label: "צהריים kawadoko בקיבונה — Hirobun או Fujiya (חובה מראש)",
          window: "שבועות לפני · 13 בספט׳",
          priority: "high",
        },
        { id: "ky-fushimi", label: "יציאה מוקדמת ל־Fushimi Inari (בלי נישיקי באותו יום)", window: "11 בספט׳", priority: "medium" },
        { id: "ky-bags", label: "איסוף מזוודות Takkyubin + העברה הלאה לאוסקה", window: "בהגעה לקיוטו / לפני אוסקה", priority: "medium" },
      ],
    },
    {
      id: "osaka",
      title: "אוסקה (+ נארה / הירושימה)",
      items: [
        { id: "h-osaka", label: "מלון ליד Namba / Dotonbori (15–20 בספט׳)", window: "להזמין בהקדם", priority: "high" },
        {
          id: "j-usj",
          label: "USJ Express Pass — בדיוק חודשיים מראש בחצות שעון יפן",
          window: "16 ביולי 2026 · 00:00 JST (ליום 16 בספט׳)",
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
          label: "מלון בגינזה / שיאודומה (20–24/25 בספט׳) — נוח לנריטה ולהאנדה",
          window: "להזמין בהקדם",
          priority: "high",
        },
        { id: "t2-return-train", label: "שינקנסן אוסקה → טוקיו", window: "להזמין ~30 יום לפני", priority: "high" },
        { id: "t2-flex", label: "יום רגוע בטוקיו — קימה מאוחרת, קפה וקניות קלות", window: "22 בספט׳", priority: "low" },
        { id: "t2-airport", label: "N'EX / רכבת לנריטה או האנדה לפי הטיסה", window: "כשיודעים שדה תעופה", priority: "high" },
        { id: "t2-farewell", label: "הזמנת ארוחת פרידה", window: "1–2 שבועות לפני", priority: "medium" },
      ],
    },
  ],
};
