# SG Arrival Card — live page map (verify-live, 2026-11-20)

Entry: `https://eservices.ica.gov.sg/arrivalcard/sgac` → second **"Fill in Manually"** (the one next to
"Autofill with Passport/Visa") → `/arrivalcard/sgac/fvipa/submit` (visitor form).
- First "Fill in Manually" → `/resident/submit` (Long-Term Pass Holder, asks NRIC/FIN) — wrong flow.
- "Visitor" / "Resident" tabs on the home page are the **Update** flow (`/fvipa/update`, asks DE number).
- Direct navigation to `/visitor/submit` redirects to the home page.

## Page 1 (visitor), in on-screen order

| # | Field | Selector | Notes |
|---|---|---|---|
| 1 | Date of Arrival | `mat-radio-group-0` radios (labels like `20 NOVEMBER 2026`) | only today / tomorrow / day after are offered |
| 2 | Full Name (In Passport) | `#traveller-0-input-fullName` | placeholder **"Given name followed by Surname"** |
| 3 | Passport Number | `#traveller-0-input-passportNumber` | |
| 4 | Passport expiry | day/month/year inside `#traveller-0-input-dateOfPassportExpiry` | the day/month/year inputs reuse ids `traveller-0-input-day/month/year` — scope by container |
| 5 | Sex | radios `FEMALE` / `MALE` / `OTHERS` | radio, not a dropdown |
| 6 | Date of Birth | day/month/year inside `#traveller-0-input-dateOfBirth` | "Day unknown" / "Month unknown" checkboxes |
| 7 | Nationality/Citizenship | `#traveller-0-input-nationality` | autocomplete ("Select or type to search") |
| 8 | Country/Place of Birth | `#traveller-0-input-placeOfBirth` | autocomplete — **not in our practice form yet** |
| 9 | Place of Residence in Home Country | `#traveller-0-input-placeOfResidence` | autocomplete |
| 10 | Email Address | `#traveller-0-input-emailAddress` | |
| 11 | Country Code + Mobile Number | `#traveller-0-input-countryCode`, `#traveller-0-input-mobileNumber` | |
| 12 | Last City/Port of Embarkation before Singapore | `#traveller-0-input-lastCity` | autocomplete |
| 13 | Purpose of Travel | `#traveller-0-input-purposeOfTravel` | autocomplete |
| 14 | Date of Departure | day/month/year inside `#traveller-0-input-dateOfDeparture` | |
| 15 | Next City/Port of Disembarkation after Singapore | `#traveller-0-input-nextCity` | "Same as Last City" checkbox — **not in our practice form yet** |
| 16 | Two YES/NO questions | `mat-radio-group-2`, `mat-radio-group-3` | labels not captured yet (likely health declaration) |
| — | Buttons | "Add Traveller", "Cancel", "Next" | multi-page wizard; flight / accommodation not on page 1 |

## Still to map
Page 2 (after **Next**) and the review page. Reaching them needs page 1 filled with the fictional sample
data and **Next** pressed — never **Submit**.
