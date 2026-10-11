# Scena 001 — Żuk → pierwsze spotkanie z Piotrem

## Zakres
Ten pakiet zawiera **pełną roboczą strukturę dialogową** przyjazdu Jerzego, zgodną z kolejnością otwierającego fragmentu powieści, oraz specyfikację prezentacji testów. Wciąż wymaga zaimplementowania w Phaserze i przeglądowej korekty stylistycznej; same pliki danych nie uruchamiają sceny.

- `src/content/arrival.dialogue.json` — dialog w formie grafu węzłów z konsekwencjami i flagami.
- `src/content/difficulty.json` — opisowe poziomy trudności i kolory.
- Scena zaczyna się w Żuku, a kończy po rozmowie z Piotrem i podniesieniu kasztana.
- Po wysiadaniu gracz dostaje etap eksploracji placu; aktualny plac i chodzenie pozostają w użyciu.

## Obowiązkowe informacje
Andrzej zawiadomił milicję i prasę; źródłem jest Roman; według relacji kierowcy przy piecu byli inni ludzie; pismo z Instytutu legitymizuje Jerzego; Piotr przyjmuje przyjezdnego, mimo niechęci; kasztanowiec zatrzymuje ich na placu. Nie stosuj zamknięć fabuły przez nieudany rzut.

## Sposób testowania
- Wykonaj rzut nieudany i sprawdź, czy istnieje dalsza droga.
- Wykonaj rzut udany i sprawdź odmienną linijkę interpretacji.
- Wybierz wszystkie opcje bez testów; można ukończyć scenę.
- Sprawdź wybór nowej gry po utworzeniu Jerzego: premia testu liczona z wybranych atrybutów.
- Upewnij się, że nie pokazujesz procentu na ekranie wyborów.
- Zapis/wczytanie w połowie rozmowy nie powinno resetować już wykonanych rzutów.
- Gdy scena 003 nie jest dostępna, zastosuj bezpieczne zakończenie/plac, zamiast przejścia do brakującej sceny.

## Balans
Rozpoczynamy łagodnie: Empatia DC 10, Dedukcja DC 11, Opanowanie DC 9, Perswazja DC 10. To testy wprowadzające, nie finalny balans. Z kreatorem atrybutów nie każdy build ma tę samą premię.

## Prawa
Teksty są nowymi kwestiami projektowymi. Nie kopiować literalnie prozy ani dialogów źródłowych do kodu. Publiczna wierna adaptacja wymaga uprawnień od posiadacza praw.
