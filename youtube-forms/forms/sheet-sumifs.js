// SHEET-SUMIFS — "SUMIFS and COUNTIFS: totals by condition".
// English channel "Copy My Screen: Apps & AI" (channel key apps): spreadsheet formulas that work the same in
// Excel and Google Sheets.
//
// Recorded ONLY on the practice page ../mock/sheet.html?data=orders: a neutral grid with a formula bar, column
// letters and row numbers. No Excel or Google Sheets logo, colours or UI are copied. "live" points at the same
// practice page. Each formula is typed into its own cell (G2, G3 …) so the formula text stays in the cell and the
// calculated value shows in a result badge beside it.
//
// Sample table (rows 2–9): Order ID · Product · Region · Qty · Price
//   1001 Pen East 12 | 1002 Notebook West 5 | 1003 Pen West 20 | 1004 Stapler East 3
//   1005 Notebook East 10 | 1006 Pen East 8 | 1007 Stapler West 6 | 1008 Notebook East 15
// Results the practice page shows, in recording order (each must also be what Excel / Google Sheets returns):
//   G2 =SUMIF(B2:B9,"Pen",D2:D9)                         → 40   (12 + 20 + 8)
//   G3 =SUMIFS(D2:D9,B2:B9,"Pen")                        → 40
//   G4 =SUMIFS(D2:D9,B2:B9,"Pen",C2:C9,"East")           → 20   (12 + 8)
//   F2=Notebook  G5 =SUMIFS(D2:D9,B2:B9,F2,C2:C9,"East") → 25   (10 + 15)
//   F2=Pen       G5                                      → 20
//   G6 =SUMIFS(D2:D9,B2:B9,F2,D2:D9,">=10")              → 32   (12 + 20)
//   F3=10        G7 =SUMIFS(D2:D9,B2:B9,F2,D2:D9,">="&F3) → 32
//   G8 =COUNTIFS(B2:B9,F2,C2:C9,"East")                  → 2
//   D7='8 (text) G2, G3 → 32 · G4, G5 → 12 · G8 stays 2      (the text 8 is skipped by the sum, with no error)
//   D7=8         everything back: 40 · 40 · 20 · 20 · 32 · 32 · 2
//
// Facts checked 2026-11 (re-check before each yearly refresh). support.microsoft.com and support.google.com could
// not be opened directly from the build machine, so these come from search-result extracts of the official pages:
//  - Microsoft SUMIFS page: "The order of arguments differ between SUMIFS and SUMIF. In particular, the sum_range
//    argument is the first argument in SUMIFS, but it is the third argument in SUMIF." And: the criteria_range
//    argument must contain the same number of rows and columns as the sum_range argument.
//    https://support.microsoft.com/en-us/office/sumifs-function-c9e748f5-7ea7-455d-9406-611cebce642b
//    https://support.microsoft.com/en-us/office/sumif-function-169b8c99-c05c-4483-a712-1697a653039b
//  - Google Sheets: SUMIFS(sum_range, criteria_range1, criterion1, …); COUNTIFS(criteria_range1, criterion1, …);
//    SUMIF(range, criterion, [sum_range]).
//    https://support.google.com/docs/answer/3238496   https://support.google.com/docs/answer/3256550
//  - Filters: SUBTOTAL leaves out rows hidden by a filter, whatever function number is used (Microsoft: "filtered-out
//    cells are always excluded"; Google: "Cells that are hidden due to autofilter criteria are never included in
//    SUBTOTAL, irrespective of the function_code used"). 9 = SUM; 109 also leaves out rows hidden by hand.
//    https://support.microsoft.com/en-us/office/subtotal-function-7b027003-f060-4ade-9040-e478765b9939
//    https://support.google.com/docs/answer/3093649
//  - NOT confirmed from an official page: (a) that SUMIFS / COUNTIFS keep counting rows hidden by a filter — the
//    Microsoft and Google SUMIFS pages do not say it either way; third-party Excel guides state it ("SUMIFS always
//    includes all rows") and it follows from SUBTOTAL being the documented visible-rows tool; (b) the exact error
//    for ranges of different sizes — #VALUE! in Excel is widely documented, the Google Sheets wording was not
//    found, so the script says "an error" for Sheets; (c) that a number stored as text in the sum range is skipped
//    with no error, and that a leading apostrophe stores a number as text — standard behaviour in both apps, not
//    quoted from an official page; (d) that an operator typed without quotes gives an error in both apps.
//
// Unofficial guide. Not affiliated with Microsoft or Google.

const path = require('path');

// Sample values — all fictional.
const S = {
  product1: 'Notebook', product2: 'Pen', minQty: '10', textQty: "'8", qty: '8',
  f1: '=SUMIF(B2:B9,"Pen",D2:D9)',
  f2: '=SUMIFS(D2:D9,B2:B9,"Pen")',
  f3: '=SUMIFS(D2:D9,B2:B9,"Pen",C2:C9,"East")',
  f4: '=SUMIFS(D2:D9,B2:B9,F2,C2:C9,"East")',
  f5: '=SUMIFS(D2:D9,B2:B9,F2,D2:D9,">=10")',
  f6: '=SUMIFS(D2:D9,B2:B9,F2,D2:D9,">="&F3)',
  f7: '=COUNTIFS(B2:B9,F2,C2:C9,"East")',
};

const route = { from: 'ROWS', fromCity: 'YOUR DATA', to: 'TOTAL', toCity: 'BY CONDITION' };
const BRAND = '▶ Copy My Screen: Apps & AI';

const MOCK_URL = 'file://' + path.join(__dirname, '..', 'mock', 'sheet.html') + '?data=orders';
const SELECTORS = {
  table: '#A1 || #E9',
  condCell: '#F2', minCell: '#F3', qtyCell: '#D7',
  f1Cell: '#cG2', f2Cell: '#cG3', f3Cell: '#cG4', f4Cell: '#cG5', f5Cell: '#cG6', f6Cell: '#cG7', f7Cell: '#cG8',   // the whole cell: formula + result badge
  f1: '#G2', f2: '#G3', f3: '#G4', f4: '#G5', f5: '#G6', f6: '#G7', f7: '#G8',
  sizeRow: '#sizeRow', filterRow: '#filterRow',
};

module.exports = {
  id: 'sheet-sumifs',
  pack: 'settle',   // closest existing pack; an "apps / spreadsheets" pack does not exist yet
  channel: 'apps',
  country: { en: 'Excel & Google Sheets' }, flag: '📊',
  fee: 'Free', when: 'Any time',
  captcha: false,
  title: { en: 'SUMIFS and COUNTIFS: Totals by Condition' },
  shortTitle: { en: 'SUMIFS' },   // Shorts headline / title
  videoTitle: { en: 'SUMIFS and COUNTIFS {year} | Totals by Condition in Excel & Google Sheets | Copy My Screen' },

  url: {
    mock: MOCK_URL,
    live: MOCK_URL,   // recorded on the practice sheet only — there is no live site for this tutorial
  },

  selectors: {
    mock: SELECTORS,
    live: { ...SELECTORS },   // same practice page, so the live map is a copy of the mock map
  },

  strings: {
    en: { easyPill: '👀 Just copy the screen', mistakeTitle: '⚠ Common mistake', pause: '⏸ Type this, then press play', pauseSub: '' },
  },

  steps: [
    // ---------- INTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      en: { id: 'intro', speech: 'How many pens did we sell? How many in the East region? How many orders of ten or more? You do not need a filter, and you do not need a pivot table. You need one formula. It is called sum ifs. We build it on a practice sheet, one condition at a time, and it works the same in Excel and in Google Sheets. I will pause at the spots where people get stuck. At the end, we count rows the same way, with count ifs.',
            route, title: 'SUMIFS and COUNTIFS,\n**totals by condition**', subtitle: 'Practice sheet · the same formulas in Excel and Google Sheets',
            meta: [{ k: 'TIME', v: '6 min' }, { k: 'COST', v: 'Free' }, { k: 'LEVEL', v: 'Beginner' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '📊',
            rightTitle: 'SUMIF · SUMIFS · COUNTIFS', rightText: 'Need: any Excel or Google Sheets\nNo add-ins', brand: BRAND },
    }},

    // ---------- ONE CONDITION ----------
    { type: 'manual', field: 'table', tipHold: 2800, text: {
      en: { label: 'The table', speech: { tip: 'Here is our table. Eight orders, in rows two to nine. Product is in column B. Region is in column C. And quantity is in column D. Quantity is the number we want to add up.' },
            tip: 'Product in **B**, Region in **C**, Qty in **D**. Data is in **rows 2 to 9**.' },
    }},
    { type: 'type', field: 'f1', hl: 'f1Cell', value: S.f1, text: {
      en: { label: 'SUMIF: one condition', speech: { tip: 'Start with the simple one. Sum if, with one condition. In G two, type equals, sum if, open bracket. B two to B nine, comma. Then Pen, in quotes, comma. Then D two to D nine. Close bracket. Read it like this. Look in the product column. Find Pen. Add up the quantities. Twelve, plus twenty, plus eight. Forty.' },
            tip: '=SUMIF( where to look , what to find , what to add ) → **40**' },
    }},
    { type: 'type', field: 'f2', hl: 'f2Cell', value: S.f2, mistakeHold: 4600, text: {
      en: { label: 'The same with SUMIFS', speech: { tip: 'Now the same total with sum ifs, with an S on the end. In G three, type equals, sum ifs, open bracket. This time the numbers come first. D two to D nine, comma. Then B two to B nine, comma. Then Pen, in quotes. Close bracket. Forty again.', mistake: 'Here is the mistake almost everyone makes once. The order is different. In sum if, the range to add up comes last. In sum ifs, it comes first. If you mix them up, you get an error, or a wrong total. My tip. Just use sum ifs every time, even for one condition. Then you only remember one order. Numbers first.' },
            tip: '=SUMIFS( **what to add** , where to look , what to find ) → **40**', mistake: 'The order differs. SUMIF: sum range **last**. SUMIFS: sum range **first**.', bad: '=SUMIFS(B2:B9,"Pen",D2:D9)', good: '=SUMIFS(D2:D9,B2:B9,"Pen")' },
    }},

    // ---------- TWO CONDITIONS ----------
    { type: 'card', hold: 2600, card: {
      en: { id: 'two', speech: 'Now the reason sum ifs exists. More than one condition.', route, title: 'Two conditions, **then a cell**', subtitle: 'Add a pair each time: where to look, what to find', flag: '➕', rightTitle: '2 / 3', rightText: 'Pen AND East\nCondition from a cell', brand: BRAND },
    }},
    { type: 'type', field: 'f3', hl: 'f3Cell', value: S.f3, mistakeHold: 4400, text: {
      en: { label: 'SUMIFS: two conditions', speech: { tip: 'Pens, but only in the East. In G four, type the same sum ifs, and before you close the bracket, add a second pair. Comma, C two to C nine, comma, East in quotes. Each condition is a pair. Where to look, then what to find. A row counts only when both are true. Twelve plus eight. Twenty.', mistake: 'Every range in the formula must be the same size. Here they all go from row two to row nine. If one of them stops at row eight, Excel shows hash VALUE, and Google Sheets gives an error as well. This often happens after you add new rows at the bottom, and only fix one of the ranges.' },
            tip: 'Add a pair: ,C2:C9,"East" → Pen **and** East → **20**', mistake: 'All ranges must be the **same size**. Same first row, same last row.', bad: 'D2:D9 with C2:C8', good: 'D2:D9 with C2:C9' },
    }},
    { type: 'type', field: 'condCell', value: S.product1, text: {
      en: { label: 'A condition in a cell', speech: { tip: 'Typing the product inside the formula works. But then you must edit the formula every time. Put the condition in a cell. In F two, type Notebook.' },
            tip: 'Put the condition in its own cell: **F2** = Notebook' },
    }},
    { type: 'type', field: 'f4', hl: 'f4Cell', value: S.f4, text: {
      en: { label: 'Use the cell as the condition', speech: { tip: 'In G five, type the two condition formula again. But where we had Pen in quotes, type F two. No quotes this time, because it is a cell, not a word. Notebooks in the East. Ten plus fifteen. Twenty five.' },
            tip: 'Cell reference, **no quotes**: B2:B9,F2 → **25**' },
    }},
    { type: 'type', field: 'condCell', value: S.product2, text: {
      en: { label: 'Change the cell, not the formula', speech: { tip: 'Now watch G five. Go back to F two, and type Pen. The total changes to twenty, and we did not touch the formula. This is how you build a small report. One cell to choose, one formula to answer.' },
            tip: 'Change **F2** to Pen → the total follows: **20**' },
    }},

    // ---------- BIGGER THAN, COUNTING ----------
    { type: 'card', hold: 2600, card: {
      en: { id: 'compare', speech: 'Conditions do not have to be exact words. They can be bigger than, or smaller than.', route, title: 'Bigger than, **and counting**', subtitle: 'Operators go in quotes · COUNTIFS counts rows', flag: '🔢', rightTitle: '3 / 3', rightText: '">=10" · ">="&F3\nCOUNTIFS', brand: BRAND },
    }},
    { type: 'type', field: 'f5', hl: 'f5Cell', value: S.f5, mistakeHold: 4600, text: {
      en: { label: 'At least 10: ">=10"', speech: { tip: 'Pens, but only orders of ten or more. In G six, type sum ifs. D two to D nine. Then B two to B nine, and F two. Then the quantity column again, D two to D nine. And then, in quotes, greater than, equals, ten. Close bracket. Yes, the same column can be the one you add up, and the one you test. Twelve plus twenty. Thirty two.', mistake: 'The comparison sign must be inside the quotes, together with the number. Quote, greater than, equals, ten, quote. Without the quotes, you just get an error. A plain number alone needs no quotes. But as soon as there is a sign in front, put quotes around the whole thing.' },
            tip: 'Operator **and** number inside quotes: ">=10" → **32**', mistake: 'A comparison sign always goes **inside quotes**.', bad: 'D2:D9,>=10', good: 'D2:D9,">=10"' },
    }},
    { type: 'type', field: 'minCell', value: S.minQty, text: {
      en: { label: 'The limit in a cell', speech: { tip: 'What if the ten should come from a cell, too? In F three, type ten.' },
            tip: 'Put the limit in **F3**: 10' },
    }},
    { type: 'type', field: 'f6', hl: 'f6Cell', value: S.f6, text: {
      en: { label: 'Operator joined to a cell', speech: { tip: 'In G seven, type the same formula. But for the last piece, type quote, greater than, equals, quote. Then the and sign. Then F three. The sign stays in quotes. The and sign glues it to the cell. Thirty two again. Change F three, and the total follows.' },
            tip: 'Sign in quotes, then **&**, then the cell: ">="&F3 → **32**' },
    }},
    { type: 'type', field: 'f7', hl: 'f7Cell', value: S.f7, text: {
      en: { label: 'COUNTIFS: how many rows', speech: { tip: 'Sometimes you do not want a total. You want to know how many. That is count ifs. In G eight, type equals, count ifs, open bracket. B two to B nine, comma, F two, comma. C two to C nine, comma, East in quotes. Close bracket. It is the same pairs as sum ifs, but there is no range to add up at the front. Two pen orders in the East.' },
            tip: 'Same pairs, **no sum range**: how many rows match → **2**' },
    }},
    { type: 'type', field: 'qtyCell', value: S.textQty, mistakeHold: 5000, text: {
      en: { label: 'A number stored as text', speech: { tip: 'Now let me break something on purpose. In D seven, type an apostrophe, and then eight. The apostrophe tells the sheet, this is text, not a number. Look at the results.', mistake: 'The pen total dropped from forty to thirty two. No error. No warning. The count still says two, because the row is still there. But sum ifs only adds real numbers, and it skips text without telling you. This happens a lot with data you copy from another system. Conditions have the same problem. East with a space after it is not East. So if a total looks too low, look for numbers on the left side of their cell, and for extra spaces.' },
            tip: 'An apostrophe makes it **text**. Watch the totals.', mistake: 'SUMIFS **skips text** silently. The total is too low, with **no error**.', bad: "text '8  ·  \"East \" with a space", good: 'number 8  ·  "East"' },
    }},
    { type: 'type', field: 'qtyCell', value: S.qty, text: {
      en: { label: 'Back to a real number', speech: { tip: 'Type a plain eight in D seven, and the totals come back. Forty. In a big file, do not retype. The VALUE function turns text into a number, and the TRIM function removes extra spaces.' },
            tip: 'A real number again → **40**. Big files: VALUE and TRIM.' },
    }},
    { type: 'manual', field: 'filterRow', tipHold: 3000, mistakeHold: 4800, text: {
      en: { label: 'Filters do not change SUMIFS', speech: { tip: 'One last thing, about filters. Many people filter the table, and expect these totals to follow the filter.', mistake: 'They do not. Sum ifs and count ifs look at every row in the range, including the rows a filter is hiding. So you filter to the West, and the formula still shows the same number. That is not a bug. The conditions belong inside the formula. If you want a total of only the rows you can see, that is a different function. It is called SUBTOTAL. Type SUBTOTAL, open bracket, nine, comma, and the range.' },
            tip: 'Filtering the table does **not** change a SUMIFS total', mistake: 'SUMIFS still counts **rows a filter hides**. For visible rows only, use **SUBTOTAL**.', bad: 'filter, then trust SUMIFS', good: '=SUBTOTAL(9,D2:D9)' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      en: { id: 'outro', speech: 'That is sum ifs and count ifs. To recap. In sum ifs, the numbers to add come first. Then add pairs. Where to look, and what to find. Keep every range the same size. Put comparison signs in quotes, and glue them to a cell with the and sign. Count ifs is the same, without the first range. And if a total looks wrong, check for text numbers, extra spaces, and filters. If this helped, subscribe for the next formula.',
            route, title: 'Done. **Numbers first, then pairs**', subtitle: 'Practice sheet · the same formulas in Excel and Google Sheets',
            meta: [{ k: 'ORDER', v: 'Sum range first' }, { k: 'OPERATORS', v: 'In quotes' }, { k: 'RANGES', v: 'Same size' }], stamp: 'ALL\nSET', flag: '📊',
            rightTitle: 'Up next', rightText: '', next: ['🔎 XLOOKUP in 5 minutes', '📋 Pivot tables for beginners', '🔔 Subscribe for the next formula'], brand: BRAND },
    }},
  ],
};
