# BBF Projects — wersja online

Aplikacja: https://bigbearfilm.github.io/bbf-projects/

## Konfiguracja i aktualizacja bazy

Dla nowej instalacji uruchom `schema.sql`, następnie jednorazowo `collaboration.sql` w Supabase SQL Editor. Dla dotychczasowej instalacji uruchom tylko `collaboration.sql`. Skrypt w jednej transakcji przenosi istniejące projekty, pozycje, osoby i cennik do osobnych tabel. Oryginalne dokumenty `bbf_workspaces` pozostają kopią tylko do odczytu. Stare wersje aplikacji tracą możliwość zapisu i wymagają odświeżenia. Nie uruchamiaj migracji ponownie po rozpoczęciu pracy na nowej bazie.

`config.js` zawiera wyłącznie publiczny adres i klucz publishable. Nie publikuj kluczy service_role, haseł ani kopii projektów. Pliki aplikacji publikowane są przez GitHub Pages z głównego katalogu gałęzi main. W Supabase Auth skonfiguruj Site URL i Redirect URLs na adres aplikacji z końcowym `/`. Publiczna rejestracja pozostaje wyłączona.

## Zespoły i zapis równoległy

Baza zawiera przestrzenie zespołów, członkostwa, projekty, wiersze kosztorysów, podpozycje rozliczeń, osoby, klientów, cenniki, stawki, słownik i ustawienia. Relacje mają klucze obce. RLS ogranicza odczyt do członków danego zespołu. Zapis odbywa się tylko przez kontrolowaną funkcję transakcyjną.

W Ustawieniach → Konto i współpraca właściciel nadaje istniejącemu kontu aplikacji rolę edytora lub czytelnika. Konto osoby musi najpierw zostać utworzone w Supabase Auth. Samo utworzenie konta nie daje dostępu do istniejących projektów.

Klient wysyła zmienione rekordy z wartościami sprzed edycji. Serwer porównuje poszczególne pola, łączy zmiany różnych pól i odrzuca konflikt tej samej wartości. Zapis obejmuje całą transakcję albo nie zmienia niczego. Zmiany trafiają do dziennika audytu. Realtime oraz odpytywanie synchronizują urządzenia. Nie ma zapisu całego dokumentu, który mógłby przykryć cudzą pracę.

Przy konflikcie lokalna wersja pozostaje zachowana. Komunikat pozwala pobrać ją jako kopię i wczytać aktualny stan. Nie ma automatycznego wyboru zwycięskiej wartości. Historia cofania dostaje nowy punkt początkowy po odebraniu cudzych zmian, aby cofnięcie nie usuwało pracy innych osób. Przy utracie sieci nie zamykaj karty przed zakończeniem zapisu; dostępna jest kopia lokalna i eksport JSON.

## Tabele i cenniki

- Pierwsze kliknięcie zaznacza komórkę; drugie kliknięcie lub Enter uruchamia edycję. Enter zatwierdza i przechodzi niżej. Strzałki przechodzą do zaznaczonej, nieaktywnej komórki.
- Shift + kliknięcie / strzałki zaznacza zakres. Na telefonie służy do tego przycisk „Zaznacz zakres”, a następnie wskazanie końca zakresu.
- Kopiowanie i wklejanie obsługuje liczby, tekst i typy rozliczeń. Uchwyt w narożniku zaznaczenia kopiuje wartość pionowo. Zablokowane lub niezgodne komórki są pomijane z komunikatem.
- Cmd/Ctrl+F wyszukuje w tabeli i przewija do wyniku. Na telefonie dostępny jest przycisk wyszukiwania oraz pełny ekran tabeli.
- Rental BBF: stawka netto × ilość stanowi zasób BBF, koszt zewnętrzny wynosi zero.
- Podpozycje dodaje się z menu w rozliczeniu. Przy pierwszym podziale istniejące rozliczenie trafia do pierwszej podpozycji. Koszty i zasoby dzieci sumują się w rodzicu. Podpozycję usuwa się przez jej menu; w rozliczeniu nie ma koszy.
- Cennik wybierany jest po dacie podpozycji, a następnie dacie zdjęć projektu. Obowiązuje najnowszy cennik z datą „Ważny od” nie późniejszą od tej daty. Nowy cennik kopiuje identyfikatory pozycji, dzięki czemu stare projekty zachowują połączenia. Zmiana stawki w starym cenniku świadomie koryguje odpowiadające mu historyczne rozliczenia.
- Import JSON dostępny jest tylko do pustego zespołu. Kopie prywatnych danych nie należą do repozytorium.

## Weryfikacja

Testy lokalne: migracja i RLS w PostgreSQL/PGlite, izolacja użytkowników, role owner/editor/viewer, atomowość transakcji, konflikt tej samej komórki, równoległy zapis dwóch klientów, przeładowanie zapisanych danych, klawiatura, wybór typów, Rental BBF, podpozycje, daty cenników, kopiowanie i wypełnianie, duplikacja, wyszukiwanie oraz widok mobilny. Kontrolny kosztorys SUEMPOL zachowuje wszystkie wcześniej zaakceptowane sumy.
