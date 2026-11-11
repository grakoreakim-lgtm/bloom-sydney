# Bloom & Vine for Business — B2B 로비·리셉션 플라워 구독 사업 계획

> 작성일: 2026-11-11 · 대상: 시드니 병원·클리닉·호텔·숙박업소·오피스 로비/리셉션
> 웹: `/business/` (랜딩) · `/business/proposal.html?id=…` (제안서 승인) · 관리자 `#/b2bLeads`, `#/b2bProposals`, `#/b2bAccounts`
> 금액은 모두 **초안(GST 포함 AUD)** 입니다. 첫 5개 계약 후 실제 원가로 재조정하세요. 요금표 원본: [`business/tiers.js`](../business/tiers.js)

---

## 1. 한 줄 요약

**"매주(또는 격주) 우리가 직접 찾아가 로비와 리셉션 꽃을 갈아 끼우고 관리해 주는 구독 서비스. 첫 회는 50%, 약정 없음."**

진행 흐름:

```
타겟 리스트 → 콜드메일(+샘플 꽃 방문) → 제안서 링크 발송
  → 업체가 [Approve] 버튼 클릭 (결제 방식 선택)
  → 우리가 방문해 첫 셋업 (50% 결제)
  → 첫 방문 다음 날 "계속 / 일시정지 / 해지" 메일 자동 발송
  → 아무것도 안 누르면 정기 방문 자동 지속 (2회차부터 정상가)
```

---

## 2. 상품 구조 (티어)

| 티어 | 주 타겟 | 구성 | 주간(회당) | 격주(회당) | 월 환산(주간) |
|---|---|---|---|---|---|
| **Essential** | 치과·피부과·소형 클리닉, 소형 오피스 | 리셉션 데스크 1점 (~40cm) | $89 | $99 | ≈ $386 |
| **Signature** ⭐ | 부티크 호텔, 메디컬센터, 법률·부동산 사무소 | 로비 statement 1 (~70cm) + 데스크 1 + 사진 리포트 | $189 | $209 | ≈ $819 |
| **Grand** | 호텔 로비, 병원, 기업 본사 | 대형 1m+ 1점 + 위성 3점(데스크/엘리베이터/화장실) | $349~ | $389~ | ≈ $1,512 |
| **Custom** | 다지점·체인·이벤트 | 현장 견적 | 견적 | 견적 | — |

모든 티어 공통 포함: 화병 대여(무료, 해지 시 회수), 방문 시 물갈이·시든 꽃 제거, 시즌 테마 교체, 배송/셋업비 무료, 휴무 주 일시정지.

**애드온**
- 저향·저꽃가루(low-pollen, scent-free) 라인 — 병원·요양원·클리닉에 무료 기본 제공 (핵심 차별점)
- VIP룸 와인 & 꽃 기프트 (호텔) — $65/객실, 기존 와인 페어링 재활용
- 시즌 설치(크리스마스·설날·Mother's Day·EOFY 파티) — 견적

**첫 서비스 50% 규칙**
- 첫 방문 1회만 50%. 결제는 첫 셋업이 **끝난 뒤** (고객 리스크 0 → 승인 장벽 최소화)
- 최소 약정 없음. 첫 방문 다음 날 자동 메일에 "Keep going / Pause / Cancel" 버튼
- 업체당 1회 한정 (ABN 기준으로 중복 체크)

---

## 3. 수익 모델 (단위 경제, 추정치)

| 항목 | Essential $89 | Signature $189 | Grand $349 |
|---|---|---|---|
| 꽃·소재 원가 (30~35%) | $28 | $60 | $115 |
| 화병·소모품 감가 | $3 | $6 | $12 |
| 방문 인건비 (현장 20/35/60분 + 제작) | $18 | $35 | $65 |
| 이동비 (루트 묶음 시 1곳당) | $6 | $6 | $8 |
| 결제 수수료 (~1.7%) | $1.5 | $3 | $6 |
| **회당 공헌이익** | **≈ $32 (36%)** | **≈ $79 (42%)** | **≈ $143 (41%)** |

- 첫 회 50% 회차는 손익분기 근처/소폭 적자 → **획득 비용(CAC)**으로 봅니다. Signature 기준 2회차부터 회수.
- **목표**: 3개월 내 10곳(혼합 시 월 반복매출 ≈ $7k), 6개월 25곳(≈ $18k MRR).
- 루트 효율이 핵심: 같은 요일·같은 지역에 4~6곳을 묶으면 이동비가 1/3로 줄어듭니다. 관리자 `B2B Accounts` 화면에서 요일·지역별로 묶어 봅니다.
- 와인 기프트·시즌 설치가 객단가를 올리는 업셀.

---

## 4. 일반 범용 서비스와 비교

비교 대상: ① 대형 꽃배달 플랫폼(온라인 주문 → 지역 플로리스트에 하청), ② 대형 corporate florist(연간 계약 위주), ③ 인조꽃/식물 렌탈 업체.

| 항목 | 범용 서비스 | Bloom & Vine |
|---|---|---|
| 신선도 | 하청·재고 기반, 품질 편차 | 매일 새벽 Flemington 직매입, 당일 셋업 |
| 서비스 범위 | 배송(drop-off) 위주 | **방문 설치 + 물갈이 + 수거** 포함 |
| 계약 | 3~12개월 약정, 해지 위약금 흔함 | **무약정, 첫 회 50%, 1클릭 해지** |
| 의료기관 대응 | 일반 꽃 | 저향·저꽃가루 라인 기본 |
| 결제 | 월말 인보이스 위주 | 카드 자동결제 / 14일 인보이스 / 현장 단말기 중 선택 |
| 소통 | 콜센터 | 담당 플로리스트 직접 연락 + 방문 사진 리포트 |
| 가격 | 플랫폼 수수료 포함 → 동급 대비 높음 | 중간 유통 없음 → 동급 대비 10~20% 경쟁력 |
| 인조꽃 렌탈 대비 | 관리 쉬움, 싸지만 "가짜" 인상 | 생화의 고급감·향(선택), 계절감 |

### 우리의 약점과 개선 방안 (설계에 반영함)

| 약점 | 위험 | 개선 방안 |
|---|---|---|
| 소규모·1인 의존 | 병가·휴가 시 방문 누락 | 백업 프리랜서 플로리스트 1명 계약, 방문 요일 2개 이내로 고정, 휴무는 2주 전 공지 |
| 커버 지역 한계 | 먼 곳 수주 시 이동비 폭증 | **서비스 지역 명시** (Hills·Parramatta·Ryde·North Shore → 이후 CBD), 범위 밖은 Grand/Custom만 |
| 레퍼런스 부족 | 기업 의사결정자 불신 | **Founding Partner 5곳**: 2회차까지 20% 추가 할인 대신 후기·사진 사용 동의 |
| 인지도 | 검색 노출 낮음 | `/business/` SEO, Google 비즈니스 프로필 "office flowers / corporate florist" 카테고리, B2B 블로그 글 |
| 기업 결제 절차 | 카드 결제 불가한 곳 많음 | 인보이스 옵션 + ABN·PO 번호 입력란 제공 |
| 품질 일관성 | 매주 디자인 달라 불만 가능 | 첫 방문 시 "브랜드 컬러/선호" 카드 기록, 사진 리포트로 기록 관리 |

---

## 5. 타겟 선정

**지역 우선순위**: ① Carlingford 반경 10km (Epping, Eastwood, Castle Hill, Baulkham Hills, Pennant Hills) → ② Parramatta·Norwest 비즈니스파크·Macquarie Park → ③ North Shore(Chatswood, St Leonards) → ④ CBD(Grand 위주)

**업종 우선순위** (결정 빠르고 꽃 효과가 큰 순)

1. **치과·피부과·성형외과·한의원 등 프라이빗 클리닉** — 원장이 직접 결정, 인테리어 투자 의지 높음 → Essential/Signature
2. **부티크 호텔·서비스드 아파트·B&B** — 로비 첫인상 = 리뷰 점수 → Signature/Grand + 와인 기프트
3. **법률·회계·부동산·자산관리 사무소** — 고객 응접실 이미지 → Essential/Signature
4. **요양원·재활센터** — 가족 방문객 인상, 저꽃가루 라인 필수 → Signature
5. **사립 병원·메디컬센터** — 의사결정 느림(조달팀) → Grand, 인보이스 필수
6. **웨딩·이벤트 공간, 고급 레스토랑, 자동차 쇼룸** — 확장 타겟

**의사결정자**: Practice Manager, Office Manager, Front of House Manager, Hotel GM, Facilities Manager

**리스트 만드는 법**: Google Maps 검색(“dental clinic Castle Hill” 등) → 관리자 `B2B Leads`에 CSV 업로드(회사, 업종, 주소, 이메일, 담당자) → 상태 `TARGET`.

---

## 6. 마케팅·영업 계획

### 6-1. 채널

| 채널 | 방식 | 비용 | 기대효과 |
|---|---|---|---|
| **콜드메일 + 샘플 드롭** ⭐ | 메일 발송 후 2~3일 내 작은 데스크 꽃($15 원가)을 들고 직접 방문, 명함+QR(제안서) | 꽃값 | 가장 높은 전환. 꽃이 남아 있는 1주일 내내 광고 |
| 방문 영업 | 매주 정기 방문 루트 근처 업체 3곳씩 | 시간 | 루트 밀도 상승 |
| LinkedIn | Practice/Office Manager에게 연결 + 짧은 메시지, 설치 사진 게시 | 무료 | 오피스·의료 타겟 |
| Google 비즈니스 프로필 | "Corporate flower service" 서비스 추가, 설치 사진 매주 업로드 | 무료 | 지역 검색 노출 |
| SEO 블로그 | "Why your clinic reception needs fresh flowers", "Low-pollen flowers for hospitals" 등 | 무료 | 장기 유입 |
| 추천 리워드 | 고객이 다른 업체 소개 → 계약 시 양쪽 1회 무료 | 회당 원가 | 동종업계 입소문 |
| Instagram | 매주 "This week's lobby" 릴스, 업체 태그 | 무료 | 업체가 재공유 → 신뢰 |
| 지역 상공회의소·BNI | 네트워킹 모임 참석 | 회비 | 오피스·전문직 |

### 6-2. 영업 퍼널 & KPI (월간 목표)

```
타겟 120곳 → 메일 발송 120 → 회신/관심 15 (12%) → 제안서 10 → 승인(50% 체험) 5 → 2회차 이상 지속 4 (80%)
```

| 지표 | 목표 | 확인 위치 |
|---|---|---|
| 메일 회신율 | 10% 이상 | B2B Leads 상태 |
| 제안 → 승인율 | 50% 이상 | B2B Proposals |
| 체험 → 지속 전환율 | 75% 이상 | B2B Accounts (TRIAL → ACTIVE) |
| 월 반복매출(MRR) | 3개월 $7k / 6개월 $18k | B2B Accounts 상단 KPI |
| 해지율 | 월 5% 미만 | B2B Accounts |

### 6-3. 90일 실행 일정

| 주차 | 할 일 |
|---|---|
| 1주 | Stripe 정기결제 설정, 단말기 테스트, 화병 20개 구매, 포트폴리오 사진 촬영(매장/지인 사무실) |
| 2주 | 타겟 리스트 120곳 작성, Founding Partner 오퍼로 1차 메일 40곳 + 샘플 드롭 10곳 |
| 3~4주 | 회신 업체 방문 상담 → 제안서 발송 → 첫 셋업 3~5곳 |
| 5~8주 | 2차·3차 메일, LinkedIn 시작, 후기·사진으로 `/business/` 사례 업데이트 |
| 9~12주 | 루트 밀도 기반 지역 확대, 추천 리워드 시작, 가격·원가 재검토 |

---

## 7. 운영 플레이북

**첫 셋업 방문 체크리스트**
- [ ] 공간 사진(전/후), 조명·온도·직사광선 확인
- [ ] 브랜드 컬러·피해야 할 꽃(알레르기, 백합 꽃가루, 강한 향) 기록 → 계정 메모
- [ ] 화병 위치·수량, 출입 방법(주차, 리셉션 담당자, 출입 시간)
- [ ] 정기 방문 요일·시간 확정 (오픈 전 7~9시 권장)
- [ ] 결제: 카드 등록 완료 확인 또는 현장 단말기 결제 → 관리자에서 "Paid on terminal" 기록

**정기 방문**: 기존 꽃 수거 → 화병 세척·물 교체 → 새 어레인지 → 사진 2장 업로드 → `Mark visit done` (카드 고객은 자동 청구)

---

## 8. 결제 운영 (온라인 + 카드 단말기)

| 결제 방식 | 언제 | 처리 방법 |
|---|---|---|
| **카드 자동결제 (권장)** | 제안서 승인 시 카드 등록 (Stripe, 승인 시점엔 결제 없음) | 방문 완료 시 관리자에서 `Mark done & charge` → 자동 청구 (첫 회 50%) |
| **월 인보이스** | 기업·병원 조달팀 | 방문 완료 시 `Send invoice` → Stripe 인보이스 이메일(카드/계좌이체, 14일) |
| **현장 카드 단말기** (Zeller/SumUp 등) | 첫 셋업 때 바로 결제하고 싶은 업체 | 단말기로 결제 → 관리자에서 `Paid on terminal` 1클릭 기록 |

- 단말기는 별도 API 연동 없이 바로 쓸 수 있도록 "기록" 방식으로 구현했습니다. 사용 중인 단말기가 **SumUp**이면 SumUp 결제링크, **Zeller**면 Zeller Invoices 링크를 관리자 화면 `Payment link`에 붙여넣어 메일로 보낼 수 있습니다.
- Stripe 설정: 기존 [PAYMENT_SETUP.md](PAYMENT_SETUP.md) STEP 1 그대로 + Webhook 이벤트에 `setup_intent.succeeded`, `invoice.paid`, `invoice.payment_failed` 추가 + Settings → Payment methods 에서 **BECS Direct Debit** 활성화(인보이스 계좌이체용).

---

## 9. 이메일 템플릿

> 호주 Spam Act 2003 준수: 실제 사업자명·연락처 표기, 수신거부 문구 포함, 업무용 공개 이메일(info@, reception@)로만 발송. 대량 자동 발송은 하지 말고 하루 20~30통 개별 발송.

### 9-1. 클리닉·의료

**Subject:** Fresh, low-pollen flowers for {{Clinic}}'s reception — first week 50% off

> Hi {{Name}},
>
> I'm Ji-sun, a florist based in Carlingford. Every week I personally refresh reception flowers for local clinics — low-pollen, scent-free stems that are safe for patients, set up before you open.
>
> No contract. Your first visit is 50% off, and you only pay after you've seen it on your desk. If you don't love it, that's it — no follow-up.
>
> I'll be near {{Suburb}} on {{Day}} — could I drop off a small complimentary arrangement so you can see the quality?
>
> Ji-sun · Bloom & Vine · {{phone}} · {{website}}/business
> *Not the right person? Reply "no thanks" and I won't contact you again.*

### 9-2. 호텔·숙박

**Subject:** A lobby that guests photograph — weekly flowers for {{Hotel}}

> Hi {{Name}},
>
> First impressions show up in reviews. We design and maintain lobby flowers for boutique hotels — sourced each morning at Flemington and set up before check-in time. We swap, water and remove everything; your team does nothing.
>
> Try one week at 50% with no contract. We can also pair VIP-room flowers with Hunter Valley wine.
>
> Here's what {{tier}} would look like for your lobby: {{proposal link}}
>
> Ji-sun · Bloom & Vine · {{phone}}
> *Reply "unsubscribe" and you won't hear from me again.*

### 9-3. 오피스·전문직

**Subject:** Reception flowers, handled — {{Company}}

> Hi {{Name}},
>
> Fresh flowers at reception are one of the cheapest ways to look premium to clients — but nobody has time to buy and maintain them. We do it weekly or fortnightly from $89 a visit, fully managed.
>
> First visit 50% off, cancel any time with one click. Can I send you a quick proposal with a photo mock-up for your space?
>
> Ji-sun · Bloom & Vine · {{phone}}
> *Reply "no thanks" to opt out.*

### 9-4. 후속 메일

- **+4일**: "Just following up — I'll be in {{Suburb}} on {{Day}} with a sample arrangement for your desk. Shall I drop it in?"
- **+10일 (마지막)**: "I'll close the loop here. If fresh reception flowers ever become a priority, here's a one-click proposal: {{link}}. Thanks, Ji-sun"

### 9-5. 제안서 발송 메일 (관리자 `B2B Proposals → Copy email` 이 자동 생성)

제안서 링크 + 티어/주기/가격/첫 회 50% 금액 + [Approve] 버튼 안내가 포함됩니다.

---

## 10. 다음 단계 (사장님 할 일)

1. `firebase deploy --only firestore:rules,functions` (새 규칙·함수 배포)
2. Stripe Webhook 이벤트 3개 추가, BECS 활성화
3. 관리자 `Settings`에 사업자 이메일 확인 (승인 알림 수신용)
4. 사용 중인 단말기 회사(Zeller/SumUp) 알려주시면 결제링크 자동 생성 연동 추가 가능
5. 타겟 리스트 CSV 작성 → `B2B Leads → Import CSV`
