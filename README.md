# 쇼핑 리스트 앱

바닐라 JavaScript로 만든 간단한 쇼핑 리스트 웹 앱입니다.

## 기능

- 아이템 추가 (버튼 클릭 또는 Enter 키)
- 체크박스로 완료 표시 (취소선 적용)
- 아이템 삭제
- 빈 리스트 메시지 자동 표시/숨김

## 사용법

`shopping-list.html` 파일을 브라우저에서 열면 바로 실행됩니다. 별도 서버 불필요.

## 자동 테스트

[Playwright](https://playwright.dev/)를 사용한 자동화 테스트 포함.

```bash
npm install
node tests/shopping-list.test.js
```

테스트 항목 (12개):
- 초기 상태 확인
- 아이템 추가 (버튼 / Enter 키 / 빈값 차단 / 입력창 초기화)
- 체크박스 (체크/해제/전체 체크)
- 삭제 (개별 / 전체 삭제 후 빈 메시지 복원)
- 재추가

## 스택

- HTML / CSS / JavaScript (순수 바닐라, 의존성 없음)
- Playwright (테스트)
