# Pieśni Chołów — gra przeglądarkowa

Prototyp izometrycznego, fabularnego RPG point-and-click inspirowanego powieścią **„Pieśni Chołów”** Macieja Głowackiego.

## Uruchomienie
Wymagany Node.js 20+.

```bash
npm install
npm run dev
```

Otwórz adres podany przez Vite. Budowanie produkcyjne: `npm run build`.

## Stan
Wersja **0.1 — techniczny vertical slice**, nie kompletne demo. Zawiera prowizoryczny plac Chołów, ruch myszą, interakcję z sołtysem, dialog i jawny rzut 2k6. Grafika to tymczasowe kształty; ścieżka dialogowa jest tekstem projektowym, nie cytatem z powieści.

## Docelowe demo
1. Podróż Żukiem i rozmowa z Andrzejem
2. Plac Chołów i Piotr Bieniasz
3. Dom Bieniasza
4. Dom Romana, Łucja i piwnica

Dokumenty produkcyjne: `docs/GDD.md`, `docs/SCENES.md`, `AGENTS.md`.

## Prawa
To projekt nieoficjalny. Przed publicznym udostępnieniem adaptacji fabuły i postaci należy uzyskać odpowiednie prawa od uprawnionych. Materiał książkowy i PDF nie są częścią repozytorium.

## Walidacja prototypu placu

```bash
npm test
npm run build
npm run test:browser
```

Testy jednostkowe obejmują wszystkie 36 wyników 2k6, progi sukcesu i sukcesu wyjątkowego, modyfikatory, mapowanie umiejętności oraz trasy wokół budynków. Testy przeglądarkowe wykonują kliknięcia w Chromium w rozdzielczościach 1280×720 i 390×844: ruch, omijanie sklepu, podejście do Piotra, jawny rzut, kontynuację po porażce i kartę postaci. Domyślnie używają `/usr/bin/chromium`; dla innej instalacji ustaw `CHROMIUM_PATH`.

Kliknięcie budynku nie wyznacza celu ruchu. Kliknięcie Piotra prowadzi Jerzego w pobliże rozmówcy i otwiera dialog po dojściu. Szansa powodzenia jest widoczna przed wyborem testu, a wynik pokazuje obie kości, premię, sumę oraz próg. Po rozmowie można nadal eksplorować plac. Dialogi są adaptacyjne, a sceny 001, 003 i 004 pozostają poza implementacją.
