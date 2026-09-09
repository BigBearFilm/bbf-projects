# BBF Projects — wersja online

Wersja przygotowana do Supabase Auth + PostgreSQL oraz GitHub Pages. Projekt Supabase: qcvjucsdewrahelxcylo. Konfiguracja publiczna znajduje się w config.js.

## Konfiguracja

1. Utwórz projekt Supabase w regionie Europe. Włącz RLS. Uruchom `supabase/migrations/202609090001_workspace.sql` w SQL Editor nowego projektu.
2. W config.js wpisz Project URL i publiczny publishable/anon key. Nigdy nie wpisuj klucza secret/service_role ani hasła bazy.
3. W Authentication wyłącz publiczną rejestrację. Dodaj konto właściciela; pozostali użytkownicy mają oddzielne przestrzenie danych, bez współdzielenia danych właściciela.
4. W Authentication → URL Configuration ustaw Site URL i Redirect URLs na adres GitHub Pages z końcowym `/`. Link logowania używa tej ścieżki.
5. Wyślij kod do nowego repozytorium. W Settings → Pages wybierz Deploy from a branch → main → / (root).
6. Przetestuj logowanie, zapis, odświeżenie i drugie urządzenie. Sprawdź odmowę dostępu do danych przez niezalogowanego użytkownika oraz inne konto.

## Przeniesienie danych

W prototypie lokalnym użyj Eksport → Backup JSON. W aplikacji online po zalogowaniu wejdź w Ustawienia → Przenieś dane z prototypu, wybierz plik i potwierdź import. Import dostępny jest na pustym koncie, żeby nie nadpisać działających projektów. Kopie danych nie są częścią repozytorium ani strony publicznej.

## Zapis i dostęp

Tabela bbf_workspaces przechowuje dokument JSON bieżącego modelu danych oddzielnie dla każdego auth.uid(). RLS ogranicza odczyt, tworzenie i aktualizację do właściciela. API nie udostępnia usuwania dokumentu. Funkcja bbf_save_workspace wykonuje zapis z kontrolą wersji i blokadą rekordu: starsza wersja nie nadpisze nowszej. Zapis nieudany pozostawia lokalną kopię odzyskiwania w tej karcie; konflikt wymaga pobrania własnej kopii lub wczytania chmury. Historia cofania działa w aktualnej sesji.

Aplikacja jest przygotowana do pracy jednego właściciela na kilku urządzeniach. Wspólna przestrzeń zespołu z rolami dostępu wymaga osobnej funkcji członkostwa.

## Weryfikacja przed wdrożeniem

- Testy interfejsu z kontrolowanym adapterem Supabase: blokada przed logowaniem, puste konto, zapis wersjonowany, awaria sieci i odzyskiwanie, konflikt zmian.
- Test migracji w PostgreSQL (PGlite): odmowa dostępu anon, izolacja dwóch kont, odrzucenie starej wersji, walidacja dokumentu, brak prawa DELETE.
- Testy prawdziwego projektu Supabase i publicznego adresu muszą być wykonane po konfiguracji kont; nie są jeszcze zaliczone.

Dokumentacja: https://supabase.com/docs/guides/database/postgres/row-level-security, https://supabase.com/docs/guides/auth/redirect-urls, https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages.
