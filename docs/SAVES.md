# Zapis lokalny i ustawienia

Trzy niezależne klucze `choly.save.1`, `choly.save.2`, `choly.save.3` w localStorage. Zapis dotyczy tego samego originu przeglądarki (domena + protokół + port); nie jest synchronizowany przez backend. Czyszczenie pamięci przeglądarki usuwa lokalne zapisy.

## Bieżący format — wersja 3

Otoczka: `{ version: 3, savedAt: <data ISO UTC>, state: <GameState> }`.

GameState zawiera:

- `character`: imię Jerzy Drozd, cztery atrybuty (1–6, suma 12), pełne 12 rang umiejętności (0–5).
- `scene`: `Arrival` (podróż Żukiem) lub `Square` (plac).
- `position`: współrzędne stóp w świecie, niezależne od skalowania ekranu.
- `flags`: mapa nazw flag na wartości boolean.
- `checks`: mapa identyfikatorów check.id z danych dialogu (np. andrzej_empathy, piotr_doctor_jab) na pełny wynik: skill, dice, bonus, modifiers, total, dc, success, exceptional.
- `dialogue`: null lub nodeId, result i revealed (liczba odsłoniętych znaków Unicode).
- `story`: bieżący nodeId, unikalne visited, journal, lastTone i result.
- `journalOpen`: czy był otwarty dziennik.
- `cardOpen`: czy była otwarta karta postaci.
- `movement`: pozostała trasa, talkPending oraz flipX postaci.

Zapis odbywa się w pauzie. Wczytanie odtwarza postać, pozycję, trasę/podejście, flagi, otwarty dialog/kartę i odsłonięty tekst. Zapisane rzuty są odtwarzane bez ponownego losowania. Ustawienia są osobne i pozostają ustawieniami przeglądarki, a nie konkretnego slotu. Daty w interfejsie prezentowane są w strefie Europe/Warsaw.

## Walidacja i kompatybilność

Odczyt sprawdza wersję, datę, budżet i zakresy statystyk, komplet umiejętności, scenę, dostępność pozycji/trasy, typy flag oraz poprawność kości, sum, premii, progów i prezentowanego wyniku. Identyfikatory rzutów muszą odnosić się do istniejących check.id w danych dialogu; wyjątkiem jest zachowany historyczny document:0. Niepoprawny slot pozostaje w pamięci i nie może być wczytany. Nieznana wersja wyświetla informację o braku kompatybilności.

Obsługiwane są starsze zapisy placu: v1 ma pola stanu bezpośrednio obok version/savedAt, a v2 ma otoczkę state. Migracja do v3 odbywa się w pamięci i nie nadpisuje slotu. Dawne intro/document/end są mapowane na piotr_intro/piotr_docs/piotr_calm_result; po zakończonej dawnej rozmowie następuje piotr_request. Stary klucz document:0 zachowuje oryginalne kości, premię, próg DC 13 i rezultat; jest traktowany jako wykonany piotr_doctor_jab, więc nie ma ponownego rzutu ani przeliczania wyniku na nowy próg DC 9.

Build, rangi, pozycja, flagi i data pozostają zachowane. Historia podróży nie jest dopisywana do starych zapisów: startują one na placu. Ze względu na zmianę tekstów dawnej rozmowy licznik odsłaniania tego dialogu zaczyna się od 0. Nowe zapisy mają pełne postępy i dziennik. Walidacja obejmuje zgodność sceny/węzła, typy historii, interpretację powiązaną z wykonanym rzutem i licznik znaków. Nieznane wersje lub nieprawidłowe dane pozostają nienaruszone i nie mogą być wczytane.

Zapisy są tworzone wyłącznie po wyborze slotu. `SaveStore.write` sam wymusza potwierdzenie zajętego slotu; interfejs przedstawia osobny ekran Potwierdź/Anuluj. Tworzenie nowej sesji nie dotyka żadnego slotu. Błędy dostępu/quota są obsługiwane bez usuwania dotychczasowych wpisów.

## Ustawienia

Klucz `choly.settings`: music/effects w zakresie 0–1, dialogueSpeed = 0/15/35/70 znaków na sekundę, fullscreen = boolean. Uszkodzone/niedostępne ustawienia dają bezpieczne wartości domyślne i komunikat; nie blokują rozpoczęcia gry. Domyślnie dialog jest wyświetlany natychmiast, co zachowuje zachowanie wcześniejszego prototypu. Głośność odnosi się do dwóch kanałów miksera; obecna scena nie zawiera nagrań.
