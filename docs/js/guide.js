/* Field guide: how Korea and Japan actually work for this trip. */
window.TripGuide = (function () {
  const TOPICS = [
    { id: "culture", he: "תרבות" },
    { id: "transit", he: "תחבורה" },
    { id: "food", he: "אוכל" },
    { id: "stay", he: "אירוח" },
  ];

  const COUNTRIES = {
    kr: {
      id: "kr",
      he: "קוריאה",
      local: "한국",
      kicker: "סיאול · 서울",
      lead: "שישה לילות בהונגדה. סיאול מהירה, כנה, ומאוד קלה ברגע שמבינים את הכרטיס, את המפה ואת כללי השולחן.",
    },
    jp: {
      id: "jp",
      he: "יפן",
      local: "日本",
      kicker: "טוקיו עד אוסקה · 日本",
      lead: "שקט ברכבת, תורים ישרים, ואונסן עירום. רוב הדברים עובדים מצוין אם עושים כמו כולם ולא מנסים «לשפר».",
    },
  };

  const DATA = {
    kr: {
      culture: {
        kicker: "01 · תרבות",
        title: "איך מתנהגים בסיאול",
        lead: "קוריאה מנומסת אבל לא נוקשה כמו יפן. מכבדים גיל, תורים ומקום ציבורי. אף אחד לא מצפה שתשתחוו מושלם — כן מצפים שלא תצעקו ברכבת.",
        items: [
          { kind: "do", title: "שתי ידיים", body: "כשמוסרים כסף, כרטיס או כוס למישהו מבוגר יותר, שתי ידיים. אותו דבר כשמקבלים." },
          { kind: "do", title: "שקט בתחבורה", body: "ברכבת התחתית מדברים נמוך. שיחות טלפון ארוכות נחשבות גסות." },
          { kind: "dont", title: "בלי טיפ", body: "לא משאירים טיפ במסעדה, במונית או במלון. זה מבלבל ואף עלול להיחשב מוזר." },
          { kind: "dont", title: "לא לכתוב שם באדום", body: "שם באדום מקושר למוות. עט שחור או כחול למסמכים." },
          { kind: "do", title: "נעליים בפתח", body: "בבתים, בחלק מהמסעדות המסורתיות ובמקדשים חולצים בפתח. אם יש מדף נעליים — זה הסימן." },
          { kind: "do", title: "אשפה בתיק", body: "מעט פחים ברחוב. בקבוק ריק נשמר עד נוחות או חנות נוחות." },
          { kind: "dont", title: "לא לצלם אנשים מקרוב", body: "ברחוב הונגדה ובאיטאוון מותר אווירה. לא מצלמים פנים בלי רשות, במיוחד בברים." },
          { kind: "trip", title: "אחרי Forena", body: "ב־30/8 אחרי הטיפול: בלי שמש ובלי זיעה ממושכת. לכן היום נשאר במערב סיאול, בלי פארק." },
        ],
      },
      transit: {
        kicker: "02 · תחבורה",
        title: "איך זזים בסיאול",
        lead: "הרכבת התחתית היא ברירת המחדל. אוטובוסים משלימים. מונית כשעייפים או עם מזוודות. Google Maps חלש כאן — Kakao או Naver עדיפים.",
        how: [
          "טוענים T-Money בנחיתה, או קונים Climate Card לימים בסיאול. מעבירים את הכרטיס בכניסה וביציאה.",
          "הקווים מסומנים במספר וצבע. בשלט מחפשים את תחנת הקצה כדי לדעת כיוון.",
          "מונית: אפליקציית Kakao T. הכתובת הקוריאנית של המלון שמורה במפות אצלנו.",
        ],
        tickets: [
          { name: "T-Money", verdict: "כן", body: "כרטיס רב־פעמי לרכבת, אוטובוס ונוחות. עובד גם מחוץ לסיאול. כדאי תמיד, גם אם יש Climate Card — לגיבוי ול־AREX." },
          { name: "Climate Card", verdict: "כן לסיאול", body: "כרטיס יומי לרכבת ולאוטובוס בסיאול (3/5/7 ימים). לא תקף ב־AREX Express לשדה, לא במוניות, ולא ברכבות לרחוק." },
          { name: "AREX Express", verdict: "לשדה", body: "הרכבת המהירה לאינצ׳און. קונים כרטיס נפרד. All-Stop זול ואיטי יותר, ושם Climate Card כן יכול לעבוד." },
          { name: "מונית / Kakao T", verdict: "לפעמים", body: "משדה למלון עם מזוודות, או בלילה מאיטאוון. לא לכל נסיעה בתוך העיר." },
        ],
        items: [
          { kind: "trip", title: "הנחיתה שלכם", body: "Climate Card לא תקף ב־AREX Express. מאינצ׳און להונגדה: כרטיס Express, All-Stop, T-Money או מונית." },
          { kind: "do", title: "מפה מקומית", body: "Kakao Map או Naver Map. באפליקציות שלנו בכל מקום בסיאול יש קישור ישיר." },
        ],
      },
      food: {
        kicker: "03 · אוכל",
        title: "שולחן קוריאני",
        lead: "אוכלים ביחד, משתפים, ולא מטיפים. הבנצ׳אן הקטן שמגיע בהתחלה כלול במחיר. אם נגמר — אפשר לבקש עוד.",
        items: [
          { kind: "dont", title: "בלי טיפ", body: "משלמים בקופה או עם מלצר. עיגול סכום לא נהוג." },
          { kind: "do", title: "יוצקים לאחרים", body: "בסוג׳ו ובבירה לא ממלאים את הכוס של עצמכם קודם. יוצקים לחבר, ומקבלים בחזרה. שתי ידיים מול מבוגר." },
          { kind: "do", title: "כפית ומקלות מתכת", body: "האורז לרוב בכפית, הצדדים במקלות. לא דוחפים את המקלות לעמוד בתוך הקערה." },
          { kind: "do", title: "בשר על השולחן", body: "בבארביקיו חותכים במספריים, עוטפים בחסה, ולא מערמים נתח ענק בבת אחת." },
          { kind: "do", title: "חנות נוחות", body: "CU, GS25 ו־7‑Eleven הם ארוחת לילה לגיטימית: משקאות, קים־באפ, ראמן. אחרי בר בהונגדה זה מושלם." },
          { kind: "dont", title: "לא לנפנף ביד", body: "קוראים למלצר ביד מורמת קרוב לגוף, או «yogiyo». לא שורקים." },
          { kind: "trip", title: "גוואנגג׳אנג", body: "הדוכנים המפורסמים מתחילים להיסגר בסביבות 20:30–21:00. להגיע עד 19:30." },
        ],
      },
      stay: {
        kicker: "04 · אירוח",
        title: "מלון, רצפה חמה וג׳ימג׳ילבאנג",
        lead: "מלון מערבי בסיאול עובד כמו שאתם מכירים. מה שמיוחד הוא החימום ברצפה, הנעלי הבית, ומתחם הספא הקוריאני.",
        items: [
          { kind: "do", title: "צ׳ק־אין בערך ב־15:00", body: "Amanti בהונגדה: אפשר לבקש להשאיר מזוודות אם מגיעים מוקדם. נעלי בית בחדר — לא יוצאים איתן ללובי." },
          { kind: "do", title: "אונדול", body: "רצפה מחוממת. לא שמים שקיות ניילון או שוקולד על הרצפה בלילה." },
          { kind: "do", title: "ג׳ימג׳ילבאנג", body: "ספא קוריאני: בגדים בחדר הלבשה, בגדי ספא בפנים (לא עירום כמו אונסן יפני). יש אזורים חמים, קרים ואוכל. אחרי לוטה וורלד זה בדיוק בשביל זה." },
          { kind: "dont", title: "לא מגבת רטובה על המיטה", body: "בספא ובמלון מייבשים לפני החזרה לחדר. רצפות חלקות — לא רצים." },
          { kind: "info", title: "חשמל", body: "קוריאה 220V, תקע אירופי. המטענים מישראל יעבדו בדרך כלל בלי מתאם." },
        ],
      },
      extra: {
        title: "כסף וחירום",
        bits: [
          "כרטיס אשראי עובד כמעט בכל מקום בסיאול. מזומן לקיוסקים ולשוק.",
          "משטרה 112 · מד״א/כיבוי 119 · מוקד תיירים 1330 (גם אנגלית).",
          "בתי מרקחת מסומנים ב־종로 / 약국. אומרים «pharmacy».",
        ],
      },
    },
    jp: {
      culture: {
        kicker: "01 · תרבות",
        title: "הכללים הקטנים שעושים הבדל",
        lead: "יפן לא כועסת מהר, אבל שקטה מאוד לגבי רעש, תורים וניקיון. אם עומדים בתור, מדברים נמוך ומפנים את עצמכם הצידה בטלפון — כבר עושים נכון.",
        items: [
          { kind: "do", title: "שקט ברכבת", body: "בלי שיחות טלפון בקרון. אוזניות חלשות. תיק על החיק בשעות לחץ, לא על המושב." },
          { kind: "do", title: "תור ישר", body: "בתחנה, במעלית, בקיוסק. ביציאה מהרכבת נותנים לאנשים לרדת לפני שנכנסים." },
          { kind: "dont", title: "בלי טיפ", body: "לא במסעדה, לא במונית, לא בריוקאן. שירות כלול. ניסיון להשאיר כסף על השולחן ייצור בלבול." },
          { kind: "do", title: "אשפה איתכם", body: "פחים מעטים ברחוב. מבחינים בין שריפה לפלסטיק אם יש מיחזור. בקבוק ריק נשמר עד נוחות." },
          { kind: "dont", title: "לא מקלות אורז", body: "לא תוקעים מקלות אנכית בקערה, ולא מעבירים אוכל ממקל למקל — זה טקסי אבלות." },
          { kind: "dont", title: "לא לרדוף גייקו", body: "בגיון מצלמים סמטאות, לא אנשים בקימונו מקרוב ובלי רשות. לא חוסמים את הדרך." },
          { kind: "do", title: "מדרגות נעות", body: "בטוקיו עומדים בשמאל. באוסקה ובקיוטו לרוב עומדים בימין. אם לא בטוחים — עומדים בצד ומשאירים נתיב." },
          { kind: "do", title: "נעליים בגןקאן", body: "בכניסה לריוקאן, למקדש מסוים ולמסעדות טאטאמי חולצים. בתוך השירותים לפעמים יש כפכפי שירותים נפרדים." },
        ],
      },
      transit: {
        kicker: "02 · תחבורה",
        title: "IC, שינקנסן ואוטובוס",
        lead: "כרטיס אחד על הטלפון מכסה כמעט הכול בעיר. שינקנסן ארוך מזמינים מראש. אוטובוס בין-עירוני לקוואגוצ׳יקו גם כן. JR Pass לטיול הזה כנראה מיותר.",
        how: [
          "Suica או Pasmo באייפון / אנדרואיד, או כרטיס פלסטיק בהגעה. מעבירים בכניסה וביציאה. אותו כרטיס עובד בטוקיו, קיוטו ואוסקה.",
          "ברכבת העירונית אין מושב שמור. בשינקנסן יש: לרכוש ב־SmartEX, לבחור רכבת Hikari או Nozomi לפי המסלול.",
          "מונית: הדלת האחורית נפתחת לבד. לא סוגרים אותה חזק. יקרה — בעיקר כשיורד גשם או אחרי חצות.",
        ],
        tickets: [
          { name: "Suica / Pasmo", verdict: "כן", body: "כרטיס היום־יום. טוענים ין במכונה או באפליקציה. עובד גם בנוחות ובחלק מהאוטובוסים." },
          { name: "JR Pass", verdict: "לא אצלכם", body: "הטיול שלכם כולל טיסה לטוקיו, אוטובוס לקוואגוצ׳יקו, ורק שני שינקנסן ארוכים (הקונה–קיוטו, אוסקה–טוקיו). הפאס כנראה לא מחזיר את עצמו." },
          { name: "SmartEX", verdict: "לשינקנסן", body: "Hikari מאודאווארה לקיוטו ב־10/9, ו־Nozomi מאוסקה לטוקיו ב־21/9. מושבים שמורים. אם מזוודה מעל 160 ס״מ — לסמן Oversized Baggage." },
          { name: "אוטובוס שינג׳וקו–קוואגוצ׳יקו", verdict: "כן, שמור", body: "מושב מטרמינל Busta Shinjuku. כשעתיים. לא קונים בבוקר בתחנה אם אפשר להזמין." },
          { name: "Hakone Freepass", verdict: "ביום", body: "קונים בהקונה־יומוטו בבוקר 10/9. מכסה אוטובוס, ספינה, רכבל, כבלים ו־Tozan. אין צורך מראש." },
        ],
        items: [
          { kind: "trip", title: "מזוודות", body: "מקוואגוצ׳יקו לקיוטו שולחים Yamato בבוקר 9/9. להקונה נוסעים עם תיק גב. לוקרים בתחנות ליום." },
          { kind: "do", title: "מפות", body: "Google Maps ביפן מצוין. Yahoo! MAP גיבוי טוב. בתחנה מחפשים את האות והצבע של הקו." },
        ],
      },
      food: {
        kicker: "03 · אוכל",
        title: "מסעדה, איזקאיה ונוחות",
        lead: "אין טיפ. יש מגבת לחה, מגש לתשלום, ולפעמים דמי פתיחה באיזקאיה. חנות הנוחות היא לא פשרה — היא מוסד.",
        items: [
          { kind: "dont", title: "בלי טיפ", body: "משלמים בקופה או עם חשבון על מגש. מחזירים עודף כמו שהוא." },
          { kind: "do", title: "סומימסן", body: "קוראים למלצר ב«sumimasen», לא ביד רחבה. במקומות עם מכונת כרטיסים (kenbaiki) משלמים קודם ואז מוסרים את הכרטיס." },
          { kind: "do", title: "לגימת ראמן", body: "לגימה קולנית בראמן ובסובה מקובלת. בסושי עדין יותר." },
          { kind: "info", title: "אוטושי", body: "באיזקאיה לעיתים מגיעה מנת פתיחה בתשלום, גם בלי שהוזמנה. זה לא טעות — זה דמי שולחן." },
          { kind: "do", title: "נוחות", body: "7‑Eleven, FamilyMart, Lawson: ארוחות חמות, ביצים, קפה מכונה. הלוסון בקוואגוצ׳יקו הוא גם נקודת צילום." },
          { kind: "dont", title: "לא על האורז", body: "לא שופכים רוטב סויה על קערת אורז לבן. לסושי — טיבול קל של הדג, לא של האורז." },
          { kind: "trip", title: "סעודות שכן מזמינים", body: "קייסקי ב־Sara בערב 9/9 (כלול בריוקאן). בשר קובה ב־20/9 וארוחת פרידה ב־24/9 — לשריין מראש." },
        ],
      },
      stay: {
        kicker: "04 · אירוח",
        title: "מלון, ריוקאן ואונסן",
        lead: "מלון רגיל בטוקיו ובאוסקה דומה לאירופה. הריוקאן בהקונה והאונסן הם הטקס: נעליים בפתח, חלוק יוקאטה, רחצה לפני הבריכה, ועירום באמבט.",
        items: [
          { kind: "do", title: "צ׳ק־אין ב־15:00", body: "אפשר להשאיר מזוודות בדלפק בבוקר. בריוקאן לעיתים יש שעת ארוחה קבועה — לא מאחרים לקייסקי." },
          { kind: "do", title: "אונסן: קודם רחצה", body: "לפני שנכנסים למים יושבים על השרפרף, נרחצים היטב בסבון, ושוטפים הכול. השיער קשור. המגבת הקטנה לא נכנסת למים — שמים אותה על הראש או בצד." },
          { kind: "dont", title: "בלי בגדים במים", body: "באונסן המסורתי נכנסים ערומים, מופרדים לגברים ולנשים. בגד ים לא. לא מצלמים. לא רצים. לא טובלים את המגבת." },
          { kind: "info", title: "קעקועים", body: "חלק מהמקומות עדיין מגבילים קעקועים. ב־MYSTAYS וב־Sara כדאי לשאול בדלפק. לפעמים מדבקות כיסוי מספיקות." },
          { kind: "do", title: "יוקאטה", body: "בריוקאן לובשים את החלוק כשהשמאל על הימין (ההפך הוא תכריך). אפשר לאכול וללכת במסדרון כך." },
          { kind: "do", title: "וושלט", body: "השלט על האסלה. אם לא בטוחים — כפתור ההדחה הגדול. נייר לא באסלה רק אם יש שלט מפורש אחרת; ברוב המלונות כן." },
          { kind: "trip", title: "אצלכם", body: "אונסן ב־MYSTAYS אחרי Fuji-Q, וב־Sara אחרי גוטמבה. שם לומדים את הטקס פעם אחת — אחר כך זה נעים." },
          { kind: "info", title: "חשמל", body: "יפן 100V, תקע אמריקאי שטוח. צריך מתאם מישראל. מייבש שיער של המלון עדיף על מכשיר חזק מהבית." },
        ],
      },
      extra: {
        title: "כסף וחירום",
        bits: [
          "כרטיס עובד בערים הגדולות. מזומן עדיין שימושי בהקונה, בקוואגוצ׳יקו ובדוכנים.",
          "כספומט נוח: 7‑Eleven ודואר יפן. לא כל בנק מקבל כרטיס זר.",
          "משטרה 110 · מד״א/כיבוי 119. במלון יעזרו באנגלית.",
        ],
      },
    },
  };

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function kindLabel(kind) {
    if (kind === "do") return "כן";
    if (kind === "dont") return "לא";
    if (kind === "trip") return "אצלכם";
    return "לדעת";
  }

  function verdictClass(verdict) {
    const v = String(verdict || "");
    if (v.startsWith("לא")) return " is-no";
    if (v === "לפעמים") return " is-mid";
    return "";
  }

  function itemCard(item) {
    return `
      <article class="guide-card is-${escapeHtml(item.kind)}">
        <p class="guide-card-kicker">${kindLabel(item.kind)}</p>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.body)}</p>
      </article>`;
  }

  function sectionHtml(id, block) {
    const tickets = (block.tickets || [])
      .map(
        (t) => `
        <article class="guide-ticket">
          <header>
            <h4>${escapeHtml(t.name)}</h4>
            <span class="guide-verdict${verdictClass(t.verdict)}">${escapeHtml(t.verdict)}</span>
          </header>
          <p>${escapeHtml(t.body)}</p>
        </article>`
      )
      .join("");
    const how = (block.how || [])
      .map((step, i) => `<li><em>${String(i + 1).padStart(2, "0")}</em><span>${escapeHtml(step)}</span></li>`)
      .join("");
    return `
      <section class="guide-section" id="guide-${id}">
        <header class="guide-section-head">
          <p class="guide-kicker">${escapeHtml(block.kicker)}</p>
          <h3>${escapeHtml(block.title)}</h3>
          <p class="guide-lead">${escapeHtml(block.lead)}</p>
        </header>
        ${how ? `<ol class="guide-how">${how}</ol>` : ""}
        ${tickets ? `<div class="guide-tickets">${tickets}</div>` : ""}
        <div class="guide-grid">${(block.items || []).map(itemCard).join("")}</div>
      </section>`;
  }

  function render(root, opts) {
    if (!root) return;
    const country = opts.country === "kr" ? "kr" : "jp";
    const meta = COUNTRIES[country];
    const data = DATA[country];
    const other = country === "jp" ? COUNTRIES.kr : COUNTRIES.jp;

    root.innerHTML = `
      <div class="guide-page is-${country}">
        <div class="plan-intro">
          <p class="plan-kicker">מדריך · 案内</p>
          <h2 class="plan-title">איך זה עובד שם</h2>
          <p class="plan-lead">תרבות, תחבורה, אוכל ואירוח — לפי המדינה שאתם בה, ובלי עצות כלליות שמבזבזות זמן.</p>
        </div>

        <div class="guide-switch" role="tablist" aria-label="בחירת מדינה">
          <button type="button" class="guide-switch-btn${country === "kr" ? " is-on" : ""}" data-guide-country="kr">
            <span class="guide-switch-local">한국</span>
            <strong>קוריאה</strong>
            <span>סיאול קודם</span>
          </button>
          <button type="button" class="guide-switch-btn${country === "jp" ? " is-on" : ""}" data-guide-country="jp">
            <span class="guide-switch-local">日本</span>
            <strong>יפן</strong>
            <span>טוקיו עד אוסקה</span>
          </button>
        </div>

        <div class="guide-now">
          <p class="guide-now-kicker">${escapeHtml(meta.kicker)}</p>
          <h3>${escapeHtml(meta.he)}</h3>
          <p>${escapeHtml(meta.lead)}</p>
        </div>

        <nav class="guide-topics" aria-label="פרקי המדריך">
          ${TOPICS.map((t) => `<a href="#guide-${t.id}" data-guide-jump="guide-${t.id}">${escapeHtml(t.he)}</a>`).join("")}
        </nav>

        ${sectionHtml("culture", data.culture)}
        ${sectionHtml("transit", data.transit)}
        ${sectionHtml("food", data.food)}
        ${sectionHtml("stay", data.stay)}

        <aside class="guide-extra">
          <h3>${escapeHtml(data.extra.title)}</h3>
          <ul>${data.extra.bits.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
          <p class="guide-extra-foot">אפשר תמיד לחזור ל־${escapeHtml(other.he)} למעלה.</p>
        </aside>
      </div>`;
  }

  function jump(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const topbar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-h")) || 72;
    const extra = 56;
    const y = el.getBoundingClientRect().top + window.scrollY - topbar - extra;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }

  return { render, jump, COUNTRIES };
})();
