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
      dates: "27 באוגוסט – 2 בספטמבר",
      lead: "שישה לילות בהונגדה. סיאול מהירה וכנה — וקלה מאוד ברגע שמבינים את הכרטיס, את המפה ואת כללי השולחן.",
    },
    jp: {
      id: "jp",
      he: "יפן",
      local: "日本",
      kicker: "טוקיו עד אוסקה · 日本",
      dates: "2–25 בספטמבר",
      lead: "שקט ברכבת, תורים ישרים ואונסן ערום. רוב הדברים עובדים מצוין כשעושים כמו כולם ולא מנסים «לשפר».",
    },
  };

  const DATA = {
    kr: {
      culture: {
        kicker: "01 · תרבות",
        title: "איך מתנהגים בסיאול",
        lead: "קוריאה מנומסת, אבל פחות נוקשה מיפן. מכבדים גיל, תורים ומרחב ציבורי. אף אחד לא מצפה להשתחוויה מושלמת — כן מצפים שלא תצעקו ברכבת.",
        items: [
          { kind: "do", title: "שתי ידיים", body: "כשמוסרים כסף, כרטיס או כוס למישהו מבוגר יותר — עושים זאת בשתי ידיים. אותו דבר כשמקבלים." },
          { kind: "do", title: "שקט בתחבורה", body: "ברכבת התחתית מדברים בקול נמוך. שיחת טלפון ארוכה נחשבת גסה." },
          { kind: "dont", title: "טיפ", body: "לא משאירים טיפ במסעדה, במונית או במלון. זה מבלבל, ולעיתים אף נחשב מוזר." },
          { kind: "dont", title: "שם באדום", body: "שם שנכתב באדום מקושר למוות. למסמכים משתמשים בעט שחור או כחול." },
          { kind: "do", title: "נעליים בפתח", body: "בבתים, בחלק מהמסעדות המסורתיות ובמקדשים חולצים נעליים בפתח. מדף נעליים הוא הסימן." },
          { kind: "do", title: "אשפה בתיק", body: "יש מעט פחים ברחוב. בקבוק ריק שומרים עד שמוצאים פח או חנות נוחות." },
          { kind: "dont", title: "צילום מקרוב", body: "בהונגדה ובאיטאוון מותר לצלם אווירה. לא מצלמים פנים בלי רשות, במיוחד בברים." },
        ],
      },
      transit: {
        kicker: "02 · תחבורה",
        title: "איך מתניידים בסיאול",
        lead: "המטרו הוא ברירת המחדל. אוטובוסים משלימים, ומונית כשעייפים או עם מזוודות. Google Maps חלש כאן — Kakao Map או Naver Map עדיפים.",
        how: [
          "טוענים T-Money בנחיתה, או קונים Climate Card לימים בסיאול. מעבירים את הכרטיס בכניסה וביציאה.",
          "הקווים מסומנים במספר ובצבע. בשלט מחפשים את תחנת הקצה כדי לדעת את הכיוון.",
          "למונית משתמשים באפליקציית Kakao T. הכתובת הקוריאנית של המלון שמורה במפות אצלנו.",
        ],
        tickets: [
          { name: "T-Money", tag: "יומיומי", body: "כרטיס רב־פעמי למטרו, לאוטובוס ולחנות נוחות. טוענים בנחיתה; תקף גם מחוץ לסיאול, ב־AREX All-Stop וכגיבוי ל־Climate Card." },
          { name: "Climate Card", tag: "כרטיס יומי", body: "מטרו ואוטובוס עירוני בסיאול ל־3, 5 או 7 ימים. ל־AREX Express לשדה, למונית ולרכבת בין־עירונית משתמשים ב־T-Money או בכרטיס נפרד." },
          { name: "AREX Express", tag: "לשדה", body: "הרכבת המהירה מאינצ׳און לסיאול. דורשת כרטיס נפרד. All-Stop איטית יותר, ועליה אפשר לנסוע עם T-Money או Climate Card." },
          { name: "מונית / Kakao T", tag: "מונית", body: "מאינצ׳און להונגדה עם מזוודות, או בלילה מאיטאוון. מזמינים ב־Kakao T; הכתובת הקוריאנית של המלון שמורה במפות." },
        ],
        items: [
          { kind: "do", title: "מפה מקומית", body: "Kakao Map או Naver Map. לכל מקום בסיאול יש קישור ישיר באפליקציות שלנו." },
        ],
      },
      food: {
        kicker: "03 · אוכל",
        title: "שולחן קוריאני",
        lead: "אוכלים יחד, משתפים מנות ולא משאירים טיפ. הבנצ׳אן הקטן שמגיע בהתחלה כלול במחיר. אם נגמר — אפשר לבקש עוד.",
        items: [
          { kind: "dont", title: "טיפ", body: "משלמים בקופה או למלצר. עיגול סכום כלפי מעלה לא נהוג." },
          { kind: "do", title: "יוצקים לאחרים", body: "בסוג׳ו ובבירה לא ממלאים קודם את הכוס של עצמכם. יוצקים לחבר ומקבלים בחזרה. מול מבוגר — בשתי ידיים." },
          { kind: "do", title: "כפית ומקלות מתכת", body: "את האורז אוכלים לרוב בכפית, ואת הצדדים במקלות. לא תוקעים את המקלות זקוף בתוך הקערה." },
          { kind: "do", title: "בשר על השולחן", body: "בברביקיו חותכים במספריים, עוטפים בחסה, ולא מערמים נתח ענק בבת אחת." },
          { kind: "do", title: "חנות נוחות", body: "ב־CU, GS25 ו־7‑Eleven אפשר לאכול ארוחת לילה שלמה: משקאות, קים־באפ וראמן." },
          { kind: "dont", title: "קריאה למלצר", body: "קוראים למלצר בהרמת יד עדינה קרוב לגוף, או ב־«yogiyo». לא שורקים." },
          { kind: "do", title: "שווקי אוכל", body: "בשווקים כמו גוואנגג׳אנג הדוכנים מתחילים להיסגר בסביבות 20:30–21:00." },
        ],
      },
      stay: {
        kicker: "04 · אירוח",
        title: "מלון, רצפה חמה וג׳ימג׳ילבאנג",
        lead: "מלון מערבי בסיאול עובד כמו שאתם מכירים. מה שמיוחד כאן: חימום הרצפה, נעלי הבית ומתחם הספא הקוריאני.",
        items: [
          { kind: "do", title: "צ׳ק־אין בסביבות 15:00", body: "ב־Amanti בהונגדה אפשר לבקש להשאיר מזוודות אם מגיעים מוקדם. נעלי הבית נשארות בחדר — לא יוצאים איתן ללובי." },
          { kind: "do", title: "אונדול", body: "הרצפה מחוממת. לא שמים שקיות ניילון או שוקולד על הרצפה בלילה." },
          { kind: "do", title: "ג׳ימג׳ילבאנג", body: "ספא קוריאני: בגדים בחדר הלבשה, ובפנים בגדי ספא (לא עירום כמו באונסן יפני). יש אזורים חמים, קרים ומקום לאכול." },
          { kind: "dont", title: "מגבת רטובה על המיטה", body: "בספא ובמלון מייבשים את המגבת לפני החזרה לחדר. הרצפות חלקות — לא רצים." },
          { kind: "info", title: "חשמל", body: "בקוריאה 220V ותקע אירופי. המטענים מישראל עובדים בדרך כלל בלי מתאם." },
        ],
      },
      extra: {
        title: "כסף וחירום",
        bits: [
          "כרטיס אשראי עובד כמעט בכל מקום בסיאול. מזומן שימושי בקיוסקים ובשוק.",
          "משטרה 112 · מד״א/כיבוי 119 · מוקד תיירים 1330 (גם באנגלית).",
          "בתי מרקחת מסומנים ב־종로 / 약국. אפשר לומר «pharmacy».",
        ],
      },
    },
    jp: {
      culture: {
        kicker: "01 · תרבות",
        title: "הכללים הקטנים שעושים הבדל",
        lead: "ביפן לא כועסים מהר, אבל רגישים מאוד לרעש, לתורים ולניקיון. מי שעומד בתור, מדבר בשקט ומפנה הצידה כשמדברים בטלפון — כבר עושה נכון.",
        items: [
          { kind: "do", title: "שקט ברכבת", body: "בלי שיחות טלפון בקרון. אוזניות בעוצמה נמוכה. בשעות לחץ התיק על החיק, לא על המושב." },
          { kind: "do", title: "תור ישר", body: "בתחנה, במעלית ובקיוסק עומדים בתור. ביציאה מהרכבת נותנים לרדת לפני שנכנסים." },
          { kind: "dont", title: "טיפ", body: "לא משאירים טיפ במסעדה, במונית או בריוקאן. השירות כלול. ניסיון להשאיר כסף על השולחן רק יוצר בלבול." },
          { kind: "do", title: "אשפה איתכם", body: "יש מעט פחים ברחוב. אם יש מיחזור — מפרידים בין אשפה לשריפה לבין פלסטיק. בקבוק ריק שומרים עד חנות נוחות." },
          { kind: "dont", title: "מקלות באורז", body: "לא תוקעים מקלות זקוף בקערה, ולא מעבירים אוכל ממקל למקל — אלה מנהגי אבלות." },
          { kind: "dont", title: "צילום גיישה", body: "בגיון מצלמים סמטאות, לא אנשים בקימונו מקרוב ובלי רשות. לא חוסמים את הדרך." },
          { kind: "do", title: "מדרגות נעות", body: "בטוקיו עומדים בשמאל. באוסקה ובקיוטו לרוב עומדים בימין. אם לא בטוחים — עומדים בצד ומשאירים נתיב פנוי." },
          { kind: "do", title: "נעליים בגןקאן", body: "בכניסה לריוקאן, למקדשים מסוימים ולמסעדות טאטאמי חולצים נעליים. בשירותים לפעמים יש כפכפים נפרדים." },
        ],
      },
      transit: {
        kicker: "02 · תחבורה",
        title: "IC, שינקנסן ואוטובוס",
        lead: "כרטיס IC בטלפון מכסה את הנסיעות בעיר. שינקנסן ארוך ואוטובוס בין־עירוני לקוואגוצ׳יקו מזמינים מראש.",
        how: [
          "מוסיפים Suica או Pasmo לאייפון או לאנדרואיד, או קונים כרטיס פלסטיק בהגעה. מעבירים בכניסה וביציאה. אותו כרטיס עובד בטוקיו, בקיוטו ובאוסקה.",
          "ברכבת העירונית אין מושב שמור. בשינקנסן יש: Hikari 653 ב־10/9 קונים במכונות באודאווארה; Nozomi ב־21/9 מזמינים ב־SmartEX.",
          "במונית הדלת האחורית נפתחת לבד — לא סוגרים אותה חזק. הנסיעה יקרה, בעיקר בגשם או אחרי חצות.",
        ],
        tickets: [
          { name: "Suica / Pasmo", tag: "יומיומי", body: "כרטיס IC באייפון, באנדרואיד או בפלסטיק. טוענים ין במכונה או באפליקציה. תקף במטרו, ברכבת עירונית ובחנות נוחות בטוקיו, בקיוטו ובאוסקה." },
          { name: "SmartEX", tag: "שינקנסן", body: "Hikari 653 מאודאווארה לקיוטו ב־10/9 — כרטיסים במכונות באודאווארה לקראת 18:07. Nozomi מאוסקה לטוקיו ב־21/9 — מושבים שמורים באפליקציה. מזוודה מעל 160 ס״מ מסומנת כ־Oversized Baggage." },
          { name: "אוטובוס שינג׳וקו–קוואגוצ׳יקו", tag: "בין־עירוני", body: "מושב שמור מטרמינל Busta Shinjuku ב־7/9. כשעתיים עד תחנת קוואגוצ׳יקו." },
          { name: "Hakone Freepass", tag: "יום בהקונה", body: "קונים בהקונה־יומוטו בבוקר 10/9. הכרטיס מכסה אוטובוס, ספינה, רכבל, כבלים ו־Tozan." },
        ],
        items: [
          { kind: "do", title: "מפות", body: "Google Maps ביפן מצוין. Yahoo! MAP הוא גיבוי טוב. בתחנה מחפשים את האות ואת הצבע של הקו." },
        ],
      },
      food: {
        kicker: "03 · אוכל",
        title: "מסעדה, איזקאיה ונוחות",
        lead: "אין טיפ. יש מגבת לחה, מגש לתשלום, ולעיתים דמי פתיחה באיזקאיה. חנות הנוחות אינה פשרה — היא מוסד.",
        items: [
          { kind: "dont", title: "טיפ", body: "משלמים בקופה או מגישים את החשבון על מגש. מחזירים עודף כמו שהוא." },
          { kind: "do", title: "סומימסן", body: "קוראים למלצר ב־«sumimasen», לא ביד רחבה. במקומות עם מכונת כרטיסים (kenbaiki) משלמים קודם ואז מוסרים את הכרטיס." },
          { kind: "do", title: "לגימת ראמן", body: "לגימה קולנית בראמן ובסובה מקובלת. בסושי נהוגים בעדינות רבה יותר." },
          { kind: "info", title: "אוטושי", body: "באיזקאיה לעיתים מגיעה מנת פתיחה בתשלום, גם בלי שהוזמנה. זו לא טעות — אלה דמי שולחן." },
          { kind: "do", title: "חנות נוחות", body: "ב־7‑Eleven, FamilyMart ו־Lawson יש ארוחות חמות, ביצים וקפה ממכונה." },
          { kind: "dont", title: "סויה על האורז", body: "לא שופכים רוטב סויה על קערת אורז לבן. בסושי מטבילים קלות את הדג, לא את האורז." },
        ],
      },
      stay: {
        kicker: "04 · אירוח",
        title: "מלון, ריוקאן ואונסן",
        lead: "מלון רגיל בטוקיו ובאוסקה דומה לאירופה. בריוקאן בהקונה ובאונסן יש טקס: נעליים בפתח, חלוק יוקאטה, רחצה לפני הכניסה למים ועירום באמבט.",
        items: [
          { kind: "do", title: "צ׳ק־אין ב־15:00", body: "אפשר להשאיר מזוודות בדלפק בבוקר. בריוקאן לעיתים יש שעת ארוחה קבועה — לא מאחרים לקייסקי." },
          { kind: "do", title: "אונסן: קודם רחצה", body: "לפני הכניסה למים יושבים על השרפרף, נרחצים היטב בסבון ושוטפים הכול. השיער קשור. המגבת הקטנה לא נכנסת למים — שמים אותה על הראש או בצד." },
          { kind: "dont", title: "בגדים במים", body: "באונסן מסורתי נכנסים ערומים, באזורים נפרדים לגברים ולנשים. בלי בגד ים, בלי צילום, בלי ריצה ובלי לטבול את המגבת במים." },
          { kind: "info", title: "קעקועים", body: "חלק מהמקומות עדיין מגבילים קעקועים. ב־MYSTAYS וב־Sara כדאי לשאול בדלפק. לפעמים מדבקות כיסוי מספיקות." },
          { kind: "do", title: "יוקאטה", body: "בריוקאן לובשים את החלוק כשהצד השמאלי מעל הימני (ההפך הוא תכריך). אפשר לאכול וללכת במסדרון כך." },
          { kind: "do", title: "וושלט", body: "על האסלה יש שלט עם כפתורים. אם לא בטוחים — לוחצים על כפתור ההדחה הגדול. ברוב המלונות זורקים נייר לאסלה; רק אם יש שלט מפורש — עושים אחרת." },
          { kind: "info", title: "חשמל", body: "ביפן 100V ותקע אמריקאי שטוח. צריך מתאם מישראל. עדיף להשתמש במייבש השיער של המלון ולא במכשיר חזק מהבית." },
        ],
      },
      extra: {
        title: "כסף וחירום",
        bits: [
          "כרטיס אשראי עובד בערים הגדולות. מזומן עדיין שימושי בהקונה, בקוואגוצ׳יקו ובדוכנים.",
          "כספומטים נוחים: 7‑Eleven ודואר יפן. לא כל בנק מקבל כרטיס זר.",
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

  function noteKicker(kind) {
    return kind === "trip" ? "במסלול" : "כדאי לדעת";
  }

  function rowHtml(item) {
    return `
      <article class="guide-row">
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.body)}</p>
      </article>`;
  }

  function colHtml(kind, title, items) {
    if (!items.length) return "";
    return `
      <section class="guide-col is-${kind}" aria-label="${escapeHtml(title)}">
        <header class="guide-col-head">
          <span class="guide-col-mark" aria-hidden="true"></span>
          <span>${escapeHtml(title)}</span>
        </header>
        <div class="guide-col-list">${items.map(rowHtml).join("")}</div>
      </section>`;
  }

  function notesHtml(items) {
    if (!items.length) return "";
    return `
      <div class="guide-notes">
        ${items
          .map(
            (item) => `
          <article class="guide-note is-${escapeHtml(item.kind)}">
            <p class="guide-note-kicker">${noteKicker(item.kind)}</p>
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.body)}</p>
          </article>`
          )
          .join("")}
      </div>`;
  }

  function splitItems(items) {
    return {
      doItems: items.filter((i) => i.kind === "do"),
      dontItems: items.filter((i) => i.kind === "dont"),
      notes: items.filter((i) => i.kind === "trip" || i.kind === "info"),
    };
  }

  function sectionHtml(id, block) {
    const tickets = (block.tickets || [])
      .map(
        (t) => `
        <article class="guide-ticket">
          <header>
            <span class="guide-tag">${escapeHtml(t.tag)}</span>
            <h4>${escapeHtml(t.name)}</h4>
          </header>
          <p>${escapeHtml(t.body)}</p>
        </article>`
      )
      .join("");
    const how = (block.how || [])
      .map((step, i) => `<li><em>${String(i + 1).padStart(2, "0")}</em><span>${escapeHtml(step)}</span></li>`)
      .join("");
    const { doItems, dontItems, notes } = splitItems(block.items || []);
    const splitMod = doItems.length && dontItems.length ? "" : " is-single";
    const split = doItems.length || dontItems.length
      ? `<div class="guide-split${splitMod}">${colHtml("do", "לעשות", doItems)}${colHtml("dont", "להימנע", dontItems)}</div>`
      : "";
    return `
      <section class="guide-section" id="guide-${id}">
        <header class="guide-section-head">
          <p class="guide-kicker">${escapeHtml(block.kicker)}</p>
          <h3>${escapeHtml(block.title)}</h3>
          <p class="guide-lead">${escapeHtml(block.lead)}</p>
        </header>
        ${how ? `<ol class="guide-how">${how}</ol>` : ""}
        ${tickets ? `<div class="guide-tickets">${tickets}</div>` : ""}
        ${split}
        ${notesHtml(notes)}
      </section>`;
  }

  function render(root, opts) {
    if (!root) return;
    const country = opts.country === "kr" ? "kr" : "jp";
    const meta = COUNTRIES[country];
    const data = DATA[country];

    root.innerHTML = `
      <div class="guide-page is-${country}">
        <div class="plan-intro">
          <p class="plan-kicker">מדריך · 案内</p>
          <h2 class="plan-title">איך זה עובד שם</h2>
          <p class="plan-lead">תרבות, תחבורה, אוכל ואירוח — לפי המדינה שבה אתם נמצאים.</p>
        </div>

        <div class="guide-switch" role="tablist" aria-label="בחירת מדינה">
          <button type="button" class="guide-switch-btn${country === "kr" ? " is-on" : ""}" data-guide-country="kr">
            <span class="guide-switch-local">한국</span>
            <strong>קוריאה</strong>
            <span>${escapeHtml(COUNTRIES.kr.dates)}</span>
          </button>
          <button type="button" class="guide-switch-btn${country === "jp" ? " is-on" : ""}" data-guide-country="jp">
            <span class="guide-switch-local">日本</span>
            <strong>יפן</strong>
            <span>${escapeHtml(COUNTRIES.jp.dates)}</span>
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
