// SHEET-XLOOKUP — "XLOOKUP in 5 minutes (and VLOOKUP if you don't have it)".
// First batch for the English channel "Copy My Screen: Apps & AI" (channel key apps): spreadsheet formulas that
// work the same in Excel and Google Sheets.
//
// Recorded ONLY on the practice page ../mock/sheet.html?data=staff: a neutral grid with a formula bar, column
// letters and row numbers. No Excel or Google Sheets logo, colours or UI are copied. "live" points at the same
// practice page. Each formula is typed into its own cell (G2, G3 …) so the formula text stays in the cell and the
// calculated value shows in a result badge beside it.
//
// Sample table (rows 2–7): Staff ID 101–106 · Name · Team · Rate. A7 (106) starts as a NUMBER STORED AS TEXT on
// purpose, for the #N/A step; step 11 retypes it as a number.
// Results the practice page shows, in recording order (each must also be what Excel / Google Sheets returns):
//   F2=104  G2 =XLOOKUP(F2,A2:A7,B2:B7)                           → Dana
//           G3 =XLOOKUP(F2,A2:A7,D2:D7)                           → 32
//   F2=999  G2, G3                                                → #N/A
//           G4 =XLOOKUP(F2,A2:A7,B2:B7,"Not found")               → Not found
//   F2=106  G2, G3 → #N/A, G4 → Not found   (A7 holds the text "106", F2 holds the number 106)
//   A7=106  G2 → Fay, G3 → 31, G4 → Fay
//           G5 =VLOOKUP(F2,A2:D7,2,FALSE)                         → Fay
//           G6 =XLOOKUP(F2,$A$2:$A$7,$B$2:$B$7,"Not found")       → Fay
//
// Facts checked 2026-11 (re-check before each yearly refresh). support.microsoft.com and support.google.com could
// not be opened directly from the build machine, so these come from search-result extracts of the official pages:
//  - Excel syntax: =XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode]).
//    match_mode 0 = exact match and is the default; with no match and no if_not_found, #N/A is returned.
//    https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929
//  - Availability: Microsoft's XLOOKUP article says "XLOOKUP is not available in Excel 2016 and Excel 2019"
//    (a workbook made in a newer Excel may still contain it). It is in Microsoft 365 and Excel 2021 and later.
//    The article's "Applies To" line reportedly also lists 2016/2019, which contradicts its own note; the script
//    follows the explicit note.
//  - Google Sheets: XLOOKUP(search_key, lookup_range, result_range, missing_value, match_mode, search_mode).
//    https://support.google.com/docs/answer/12405947
//  - VLOOKUP: if the 4th argument is left out, the default is TRUE = approximate match (Microsoft). Google:
//    "If is_sorted is not specified, it is TRUE by default" and it recommends FALSE.
//    https://support.microsoft.com/en-us/office/vlookup-function-0bbc8083-26fe-4963-8ab8-93a18ad188a1
//    https://support.google.com/docs/answer/3093318
//  - #N/A when the lookup value is a number but the table holds text (Microsoft "How to correct a #N/A error").
//    https://support.microsoft.com/en-us/office/how-to-correct-a-n-a-error-e037d763-ffc3-4fae-a909-89c482d389b2
//  - NOT confirmed from an official page: (a) that extra spaces cause #N/A and TRIM fixes it — well known, but
//    the extracts found were third-party; (b) the exact error for lookup and return ranges of different sizes —
//    third-party Excel guides say #VALUE!, and a Google Sheets user report quotes "Array arguments to XLOOKUP are
//    of different size". The script says "hash VALUE in Excel, and Google Sheets shows an error too";
//    (c) #NAME? as the error older Excel shows for XLOOKUP — standard behaviour for an unknown function name,
//    not quoted from the XLOOKUP page; (d) the F4 shortcut for dollar signs (the script says "on Windows").
//
// Unofficial guide. Not affiliated with Microsoft or Google.

const path = require('path');

// Sample values — all fictional.
const S = {
  id: '104', missingId: '999', textId: '106',
  f1: '=XLOOKUP(F2,A2:A7,B2:B7)',
  f2: '=XLOOKUP(F2,A2:A7,D2:D7)',
  f3: '=XLOOKUP(F2,A2:A7,B2:B7,"Not found")',
  f4: '=VLOOKUP(F2,A2:D7,2,FALSE)',
  f5: '=XLOOKUP(F2,$A$2:$A$7,$B$2:$B$7,"Not found")',
};

const route = { from: 'ID', fromCity: 'WHAT YOU KNOW', to: 'NAME', toCity: 'WHAT YOU NEED' };
const BRAND = '▶ Copy My Screen: Apps & AI';

const MOCK_URL = 'file://' + path.join(__dirname, '..', 'mock', 'sheet.html') + '?data=staff';
const SELECTORS = {
  table: '#A1 || #D7', idCol: '#A2 || #A7', nameCol: '#B2 || #B7', headRow: '#A1 || #D1',
  lookupCell: '#F2', textCell: '#A7',
  f1Cell: '#cG2', f2Cell: '#cG3', f3Cell: '#cG4', f4Cell: '#cG5', f5Cell: '#cG6',   // the whole cell: formula + result badge
  f1: '#G2', f2: '#G3', f3: '#G4', f4: '#G5', f5: '#G6',
  versionRow: '#versionRow', cleanRow: '#cleanRow',
};

module.exports = {
  id: 'sheet-xlookup',
  pack: 'settle',   // closest existing pack; an "apps / spreadsheets" pack does not exist yet
  channel: 'apps',
  country: { en: 'Excel & Google Sheets' }, flag: '📊',
  fee: 'Free', when: 'Any time',
  captcha: false,
  title: { en: 'XLOOKUP in 5 Minutes (and VLOOKUP If You Don\'t Have It)' },
  shortTitle: { en: 'XLOOKUP' },   // Shorts headline / title
  videoTitle: { en: 'XLOOKUP in 5 Minutes {year} | Excel & Google Sheets, Plus VLOOKUP If You Don\'t Have It | Copy My Screen' },

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
      en: { id: 'intro', speech: 'You have a list. You know one thing, like a staff I D. And you need the name that goes with it. That is a lookup, and X lookup does it in one short formula. We build it piece by piece on a practice sheet, and it works the same in Excel and in Google Sheets. I will pause at the spots where people get stuck. And if your Excel is too old for X lookup, stay to the end. I will show the same thing with V lookup.',
            route, title: 'XLOOKUP,\n**built one piece at a time**', subtitle: 'Practice sheet · the same formula in Excel and Google Sheets',
            meta: [{ k: 'TIME', v: '5 min' }, { k: 'COST', v: 'Free' }, { k: 'LEVEL', v: 'Beginner' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '📊',
            rightTitle: 'XLOOKUP · VLOOKUP', rightText: 'Need: Microsoft 365, Excel 2021+\nor Google Sheets', brand: BRAND },
    }},

    // ---------- THE THREE PIECES ----------
    { type: 'manual', field: 'table', tipHold: 2800, text: {
      en: { label: 'The table', speech: { tip: 'Here is our table. Staff I D in column A. Name in column B. Then team, and hourly rate. The headings are in row one, and the data is in rows two to seven. We want to type an I D, and get the name back.' },
            tip: 'IDs in **column A**, names in **column B**. Data is in **rows 2 to 7**.' },
    }},
    { type: 'type', field: 'lookupCell', value: S.id, text: {
      en: { label: 'What to look up', speech: { tip: 'Piece one. What are we looking up? Click cell F two, and type one zero four. Putting the value in its own cell is a good habit. Later you change this one cell, and the answer changes with it.' },
            tip: 'Piece 1: **what** to look up. Type the ID in **F2**.' },
    }},
    { type: 'manual', field: 'idCol', tipHold: 2600, text: {
      en: { label: 'Where to look', speech: { tip: 'Piece two. Where do we look for it? In the I D column. That is A two to A seven. Only the I Ds. Not the heading, and not the whole table.' },
            tip: 'Piece 2: **where** to look. The ID column, **A2:A7**.' },
    }},
    { type: 'manual', field: 'nameCol', tipHold: 2600, text: {
      en: { label: 'What to return', speech: { tip: 'Piece three. What do we want back? The name. That is B two to B seven. Same rows as the I D column. Two to seven.' },
            tip: 'Piece 3: **what to return**. The name column, **B2:B7**.' },
    }},
    { type: 'type', field: 'f1', hl: 'f1Cell', value: S.f1, mistakeHold: 4400, text: {
      en: { label: 'The basic XLOOKUP', speech: { tip: 'Now put the three pieces together. In cell G two, type equals, X lookup, open bracket. F two, comma. A two to A seven, comma. B two to B seven. Close bracket. And there it is. One zero four is Dana.', mistake: 'First common mistake. The two ranges must be the same size. Here both go from row two to row seven. If one stops at row six, the formula breaks. Excel shows hash VALUE, and Google Sheets shows an error too. So check that both ranges start and end on the same rows.' },
            tip: '=XLOOKUP( **what** , **where** , **return** ) → **Dana**', mistake: 'Both ranges must be the **same size**. Same first row, same last row.', bad: 'A2:A7 with B2:B6', good: 'A2:A7 with B2:B7' },
    }},
    { type: 'type', field: 'f2', hl: 'f2Cell', value: S.f2, text: {
      en: { label: 'Return another column', speech: { tip: 'Want the hourly rate, not the name? Change only the last piece. In G three, type the same formula, but return D two to D seven. Thirty two. You never count columns. You just point at the column you want.' },
            tip: 'Change only the **return range**: D2:D7 → **32**' },
    }},

    // ---------- NOT FOUND ----------
    { type: 'card', hold: 2600, card: {
      en: { id: 'notfound', speech: 'So far so good. Now, what happens when the I D is not in the list?', route, title: 'When it is **not found**', subtitle: 'The #N/A error, and the fourth piece that replaces it', flag: '🔎', rightTitle: '2 / 3', rightText: '#N/A · "Not found"\nNumbers stored as text', brand: BRAND },
    }},
    { type: 'type', field: 'lookupCell', value: S.missingId, text: {
      en: { label: 'An ID that is not there', speech: { tip: 'Go back to F two, and type nine nine nine. Nobody has that I D. Look at the results. Both formulas now show hash N slash A. That means not available. X lookup searched the whole column, and found no exact match.' },
            tip: 'No such ID → **#N/A**, "not available"' },
    }},
    { type: 'type', field: 'f3', hl: 'f3Cell', value: S.f3, text: {
      en: { label: 'The "if not found" piece', speech: { tip: 'X lookup has a fourth piece, for exactly this. In G four, type the formula again, and add one more comma. Then, in quotes, Not found. Close the bracket. Now you get a friendly message, not an error. You can write any text you like there. Just keep the quotes.' },
            tip: '4th piece: ,"Not found") → your own message, not #N/A' },
    }},
    { type: 'type', field: 'lookupCell', value: S.textId, text: {
      en: { label: 'It is there… but not found?', speech: { tip: 'Now type one zero six in F two. One zero six is in the table. You can see it, in row seven. But the first formula shows hash N slash A, and the other one says not found. So what is going on?' },
            tip: '106 **is** in the table, but the result is still **Not found**' },
    }},
    { type: 'manual', field: 'textCell', tipHold: 2600, mistakeHold: 4800, text: {
      en: { label: 'A number stored as text', speech: { tip: 'Look closely at row seven. That one zero six sits on the left side of its cell. All the other I Ds sit on the right.', mistake: 'This one catches everybody. It is stored as text, not as a number. And to a lookup, the number one zero six and the text one zero six are two different things. An extra space does the same. A name with a space after it is not a match. So when you see hash N slash A, and you can see the value with your own eyes, check for text numbers and extra spaces first.' },
            tip: 'This 106 sits on the **left** of its cell. The other IDs sit on the right.', mistake: 'A **number stored as text**, or an **extra space**, is not a match.', bad: 'text "106"  ·  "Fay " with a space', good: 'number 106  ·  "Fay"' },
    }},
    { type: 'type', field: 'textCell', value: S.textId, text: {
      en: { label: 'Fix the text number', speech: { tip: 'On this practice sheet I will fix it by typing the number again in A seven. And now the lookup finds Fay. In a real file with many rows, do not retype them. The VALUE function turns text into a number. And the TRIM function removes extra spaces.' },
            tip: 'Make it a real number → **Fay**. In big files: VALUE for text numbers, TRIM for spaces.' },
    }},

    // ---------- VLOOKUP + COPYING DOWN ----------
    { type: 'card', hold: 2600, card: {
      en: { id: 'vlookup', speech: 'Next, the older way. If your Excel does not have X lookup, this is the one you use.', route, title: 'No XLOOKUP? **Use VLOOKUP**', subtitle: 'The same lookup, the older way, with exact match', flag: '🧮', rightTitle: '3 / 3', rightText: 'VLOOKUP with FALSE\nLock ranges with $', brand: BRAND },
    }},
    { type: 'type', field: 'f4', hl: 'f4Cell', value: S.f4, mistakeHold: 4600, text: {
      en: { label: 'The same with VLOOKUP', speech: { tip: 'In G five, type equals, V lookup, open bracket. F two, comma. Then the whole table, A two to D seven, comma. Then the number two, comma. Then FALSE. Close bracket. Fay again. V lookup always searches the first column of the table. The two means, give me the second column. And FALSE means exact match.', mistake: 'Do not skip that last word. If you leave out FALSE, V lookup uses approximate match. That only works on a sorted list. On a normal list, it can give you the wrong row, with no error at all. So for an exact lookup, always end with FALSE.' },
            tip: '=VLOOKUP( what , whole table , column number ,FALSE) → **Fay**', mistake: 'Leave out **FALSE** and VLOOKUP uses **approximate match**. It can return the wrong row.', bad: '=VLOOKUP(F2,A2:D7,2)', good: '=VLOOKUP(F2,A2:D7,2,FALSE)' },
    }},
    { type: 'manual', field: 'headRow', tipHold: 2800, mistakeHold: 4400, text: {
      en: { label: 'Counting columns', speech: { tip: 'About that number two. You get it by counting columns from the left of the table. I D is one. Name is two. Team is three. Rate is four.', mistake: 'And this is why column counting breaks. Say someone adds a new column between I D and name. The name is now column three. But your formula still says two, so it quietly returns the wrong thing. Also, V lookup can only look to the right of the first column. X lookup has neither problem, because you point at the return column directly.' },
            tip: 'Count from the left of the table: ID **1**, Name **2**, Team **3**, Rate **4**', mistake: 'Insert a column and the **number is wrong**. VLOOKUP also cannot look **to the left**.', bad: 'a fixed column number', good: 'XLOOKUP: point at the column' },
    }},
    { type: 'type', field: 'f5', hl: 'f5Cell', value: S.f5, mistakeHold: 4600, text: {
      en: { label: 'Lock the ranges with $', speech: { tip: 'One last thing before you copy a lookup down a column. In G six, type the X lookup again, but put a dollar sign before each letter and each number of the two ranges. Dollar A, dollar two, to dollar A, dollar seven. And the same for column B. The dollar signs lock the range. F two has no dollar signs, so it still moves down, row by row. You can type the dollar signs, or on Windows, press F four.', mistake: 'Without the dollar signs, the ranges slide down when you copy. In the next row, A two to A seven turns into A three to A eight. The first person drops out of the list, and lower down you get hash N slash A for people who are clearly there. Lock the table. Leave the lookup cell free.' },
            tip: '$A$2:$A$7 stays put when you copy down. F2 still moves.', mistake: 'No **$** → the range slides down as you copy, and rows drop out.', bad: 'A2:A7 → A3:A8 → A4:A9', good: '$A$2:$A$7 in every row' },
    }},
    { type: 'manual', field: 'versionRow', tipHold: 3000, mistakeHold: 4600, text: {
      en: { label: 'Which versions have XLOOKUP', speech: { tip: 'So which one should you use? If you have it, use X lookup. It is in Microsoft three six five, in Excel twenty twenty one and newer, and in Google Sheets.', mistake: 'Excel twenty sixteen and Excel twenty nineteen do not have X lookup. If you type it there, or open a file that uses it, you will see hash NAME. That is not your typing. Your version just does not know the function. So if you share a file with someone on an older Excel, use V lookup with FALSE.' },
            tip: 'XLOOKUP: **Microsoft 365**, **Excel 2021 and newer**, **Google Sheets**', mistake: 'Excel **2016** and **2019** do not have XLOOKUP. You see **#NAME?** there.', bad: 'XLOOKUP in a file for Excel 2016', good: 'VLOOKUP with FALSE' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      en: { id: 'outro', speech: 'That is X lookup. To recap. Three pieces. What to look up, where to look, and what to return. Add a fourth piece for your own not found message. Keep both ranges the same size. Watch for text numbers and extra spaces. Lock the ranges with dollar signs before you copy down. And on older Excel, use V lookup, and always end it with FALSE. If this helped, subscribe. Next we add up totals by condition, with sum ifs.',
            route, title: 'Done. **Three pieces, one formula**', subtitle: 'Practice sheet · the same formula in Excel and Google Sheets',
            meta: [{ k: 'PIECES', v: 'What · Where · Return' }, { k: 'OLD EXCEL', v: 'VLOOKUP + FALSE' }, { k: 'COPY DOWN', v: 'Lock with $' }], stamp: 'ALL\nSET', flag: '📊',
            rightTitle: 'Up next', rightText: '', next: ['➕ SUMIFS and COUNTIFS: totals by condition', '🧹 Clean messy data with TRIM and VALUE', '🔔 Subscribe for the next formula'], brand: BRAND },
    }},
  ],
};
