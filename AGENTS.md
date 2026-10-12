# Instrukcje dla Codex / współautorów

Projekt: polskie izometryczne RPG point-and-click o Jerzym Drozdzie, wiernie adaptujące „Pieśni Chołów”. Technologia: Phaser 3 + TypeScript + Vite. Priorytet: grywalne demo scen 001–004.

- Zachowuj główne wydarzenia powieści i kolejność odkryć. Nie wymyślaj ważnych faktów fabularnych.
- Dialogi dodane do gry oznaczaj jako adaptacyjne, nigdy jako cytat z powieści.
- Wszystkie rzuty są jawne: 2k6 + atrybut + ranga + modyfikatory >= DC. Przed rzutem pokazuj opisową trudność i kolor z src/content/difficulty.json, bez procentów.
- Porażka nie może zablokować postępu głównego wątku (fail forward).
- Atrybuty ustala kreator: łącznie 12 punktów, każdy 1–6; profil Psycholog to 4/3/3/2. Build jest niezmienny podczas aktywnej gry. 12 umiejętności opisanych w docs/GDD.md.
- Oddziel dane fabularne od logiki. Testy losowości mają być czystymi funkcjami testowalnymi.
- Nie wprowadzaj backendu, rozbudowanej walki, craftingu ani generatywnych dialogów w demo.
- Nie kopiuj cudzych assetów ani fragmentów chronionego tekstu. Używaj placeholderów z prawem do użycia.
- Przed zakończeniem zmiany uruchom `npm run build`, jeśli środowisko pozwala, i opisz rezultat.
