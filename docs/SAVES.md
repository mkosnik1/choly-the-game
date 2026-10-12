# Zapis lokalny i ustawienia

Trzy niezależne klucze `choly.save.1`, `choly.save.2`, `choly.save.3` w localStorage. Zapis dotyczy tego samego originu przeglądarki (domena + protokół + port); nie jest synchronizowany przez backend. Czyszczenie pamięci przeglądarki usuwa lokalne zapisy.

## Bieżący format — wersja 2

Otoczka: `{ version: 2, savedAt: <data ISO UTC>, state: <GameState> }`.

GameState zawiera:

- `character`: imię Jerzy Drozd, cztery atrybuty (1–6, suma 12), pełne 12 rang umiejętności (0–5).
- `scene`: obecnie wyłącznie `Square` (scena 002).
- `position`: współrzędne stóp w świecie, niezależne od skalowania ekranu.
- `flags`: mapa nazw flag na wartości boolean.
- `checks`: mapa identyfikatorów `węzeł:wybór` na pełny wynik: skill, dice, bonus, modifiers, total, dc, success, exceptional.
- `dialogue`: null lub nodeId, result i revealed (liczba odsłoniętych znaków Unicode).
- `cardOpen`: czy była otwarta karta postaci.
- `movement`: pozostała trasa, talkPending oraz flipX postaci.

Zapis odbywa się w pauzie. Wczytanie odtwarza postać, pozycję, trasę/podejście, flagi, otwarty dialog/kartę i odsłonięty tekst. Zapisane rzuty są odtwarzane bez ponownego losowania. Ustawienia są osobne i pozostają ustawieniami przeglądarki, a nie konkretnego slotu. Daty w interfejsie prezentowane są w strefie Europe/Warsaw.

## Walidacja i kompatybilność

Odczyt sprawdza wersję, datę, budżet i zakresy statystyk, komplet umiejętności, scenę, dostępność pozycji/trasy, typy flag oraz poprawność kości, sum, premii, progów i prezentowanego wyniku. Identyfikatory rzutów muszą odnosić się do istniejących testów w danych dialogu. Niepoprawny slot pozostaje w pamięci i nie może być wczytany. Nieznana wersja wyświetla informację o braku kompatybilności.

Obsługiwany format v1 ma te same pola stanu bezpośrednio obok `version: 1` i `savedAt` (bez pola `state`). Migracja do v2 odbywa się w pamięci; nie zmienia danych na dysku. Nieobecne dialogue/cardOpen/movement otrzymują wartości null/false/pustą trasę; nieobecny licznik revealed w dialogu otrzymuje 0. Atrybuty i rangi nie są automatycznie korygowane. Nie są zgadywane formaty innych aplikacji ani nieznane wersje.

Zapisy są tworzone wyłącznie po wyborze slotu. `SaveStore.write` sam wymusza potwierdzenie zajętego slotu; interfejs przedstawia osobny ekran Potwierdź/Anuluj. Tworzenie nowej sesji nie dotyka żadnego slotu. Błędy dostępu/quota są obsługiwane bez usuwania dotychczasowych wpisów.

## Ustawienia

Klucz `choly.settings`: music/effects w zakresie 0–1, dialogueSpeed = 0/15/35/70 znaków na sekundę, fullscreen = boolean. Uszkodzone/niedostępne ustawienia dają bezpieczne wartości domyślne i komunikat; nie blokują rozpoczęcia gry. Domyślnie dialog jest wyświetlany natychmiast, co zachowuje zachowanie wcześniejszego prototypu. Głośność odnosi się do dwóch kanałów miksera; obecna scena nie zawiera nagrań.
