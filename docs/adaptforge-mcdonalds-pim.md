# McDonald's Kiosk PIM for AdaptForge

## 분석 대상

현재 프로젝트의 기본 주문 흐름은 다음 상태 전이를 갖는다.

- `order-type` -> `menu` -> `checkout` -> `complete`
- 적응 레인은 `large-ui` 와 `voice`
- 일반 모드에서는 카테고리 탭 + 메뉴 카드 그리드 + 장바구니 시트 조합을 사용한다.

## 추상 UI 모델 (PIM)

도메인 독립 구조로 환원한 핵심 화면은 아래와 같다.

| Screen | User Goal | Core Primitives |
| --- | --- | --- |
| `order-type` | 주문 맥락 선택 | choice-group, CTA |
| `category-hub` | 메뉴 범위 축소 | progress-indicator, choice-group |
| `item-shortlist` | 대표 메뉴 선택 | card-grid, summary-panel |
| `cart-review` | 담은 메뉴 확인 | summary-panel, CTA |
| `checkout` | 최종 확인 후 완료 | confirmation, CTA |

핵심 태스크는 `주문 방식 선택`, `카테고리 범위 좁히기`, `대표 메뉴 선택`, `장바구니 확인`, `결제 완료` 다섯 단계다.

## 시니어 사용자 프로필 주입

이번 적용에서 주입한 프로필은 다음과 같다.

- 70대 초반
- 저시력 경향
- 손떨림 또는 정밀 터치 어려움
- 낮은 작업기억 부담 선호

선호와 제약:

- 큰 글자와 높은 대비
- 넓은 터치 타깃
- 현재 단계와 다음 행동의 지속 노출
- 한 화면당 3개 이하의 핵심 선택지
- 장바구니와 결제 버튼의 고정 위치

## AdaptForge 규칙

프로젝트에는 아래 규칙을 명시적으로 코드화했다.

1. `AF-01` Large targets
   큰 글씨와 큰 카드/버튼으로 주요 상호작용을 재배치한다.
2. `AF-02` Choice reduction
   카테고리와 대표 메뉴를 상위 3개로 제한한다.
3. `AF-03` Persistent orientation
   진행 단계, 주문 방식, 장바구니 요약을 고정 패널로 유지한다.
4. `AF-04` Reassuring copy
   짧고 단정한 안내 문장과 추천 이유를 함께 노출한다.

## 결과 UI

새로운 AdaptForge UI는 다음 구조로 생성된다.

- 좌측: PIM 추상 화면 목록 + 적용 규칙
- 중앙: 단계 진행도 + 축소된 카테고리 + 대표 메뉴 3개
- 우측: 고정 장바구니 요약 + 안심 문구 + 결제 CTA

즉, 기존의 단순 `large-ui` 재배치가 아니라 `PIM -> senior profile -> rule application -> rendered UI` 파이프라인으로 재구성했다.
