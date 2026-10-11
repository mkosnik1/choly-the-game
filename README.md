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
Wersja **0.1 — techniczny vertical slice**, nie kompletne demo. Zawiera prowizoryczny plac Chołów, ruch myszą, interakcję z sołtysem, dialog i jawny rzut 2k6. Grafika to lokalne, proceduralne placeholdery pixel art; ścieżka dialogowa jest tekstem projektowym, nie cytatem z powieści.

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

W bieżącej sesji wynik testu Opanowania jest zapamiętywany: ponowne rozpoczęcie rozmowy i wybranie testu pokazuje poprzedni wynik, bez nowego rzutu przy niezmienionych warunkach. Odświeżenie strony zaczyna nową sesję. Testy przeglądarkowe sprawdzają również sukces, zachowanie wyniku po ponownym podejściu do Piotra i ścieżkę dialogową bez testu.


## Oprawa sceny 002

![Plac Chołów — proceduralny pixel art](docs/images/square-002.png)

Plac używa szczegółowych, tymczasowych tekstur pixel art: sklep „Słodycze Wina”, zabudowania, Żuk, kasztanowiec, bruk oraz Jerzy, Piotr i trzech mieszkańców w tle. Piotr jest oznaczony ikoną rozmowy i obrysem; najechanie rozjaśnia postać oraz obrys. Jerzy ma trzy klatki kroków, obraca się w kierunku ruchu i wraca do pozy spoczynkowej po dojściu. Karta postaci działa także po kliknięciu przycisku w nagłówku. Nowych scen ani wątków fabularnych nie dodano.

- `src/main.ts` — konfiguracja Phaser i lista scen.
- `src/scenes/SquareScene.ts` — ruch, interakcje i interfejs placu, bez definicji grafiki i dialogów.
- `src/data/square.ts` — pozycje i skale obiektów, ich obszary kolizji, NPC i punkt podejścia do Piotra.
- `src/art/pixelArt.ts` — oryginalne, deterministyczne tekstury proceduralne, generowane raz przy uruchomieniu; kod jest lokalny i nie pobiera materiałów z sieci.
- `src/dialogues.ts`, `src/rpg.ts` — dane rozmowy i istniejące zasady RPG.

Tekstury są rysowane w połowie rozdzielczości świata, wyświetlane zwykle dwukrotnie większe (mniejszy dom w tle ma skalę 1) i filtrowane przez nearest-neighbor. Obiekty sortuje się po współrzędnej stóp/podstawy, a interfejs pozostaje nad światem. Kolizje dotyczą obrysów na ziemi, a nie koron drzew czy dachów. Budynki mają konserwatywne prostokątne obszary kolizji.

Podmiana grafiki: w `preload()` sceny wczytaj lokalny plik przez `this.load.image(key, '/assets/...png')`. Generator pomija już istniejące klucze: `square-ground`, `shop`, `house`, `van`, `chestnut`, `jerzy-0..2`, `piotr-0..2`, `ochre-0..2`, `green-0..2`, `burgundy-0..2`. Zachowaj rozmiary tekstur z generatora i podstawę na dolnym środku albo dostosuj skalę/punkt zaczepienia w rendererze. Napis sklepu jest osobną warstwą, więc nowy asset powinien zostawić na niego miejsce. To samodzielnie narysowane placeholdery; brak cudzych assetów i cytatów.

Dodatkowe testy sprawdzają trasy wokół Żuka i pnia kasztanowca, dostępność Piotra, podświetlenie po najechaniu, rzeczywiste zmiany klatek chodu, przerwanie podejścia oraz kartę postaci po zmianie rozmiaru widoku.
