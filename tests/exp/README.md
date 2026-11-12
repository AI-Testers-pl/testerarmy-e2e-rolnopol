# Eksperymenty: czy agent naprawdę testuje?

Eksperymenty z webinaru „Testy E2E – dokąd zmierzamy?”. Sprawdzamy w nich, co agent zauważy, a czego nie. **Część testów ma nie przechodzić.** Taki wynik pokazuje błąd w Rolnopolu albo ograniczenie agenta.

Uruchamiasz je osobnym configiem, bo zwykłe `npx e2e run` ich nie odpala:

```bash
npx e2e run --config e2e.exp.config.ts               # wszystkie (ok. 10 minut, ok. 50 wywołań modelu)
npx e2e run --config e2e.exp.config.ts --tag e7      # jeden eksperyment
python3 scripts/report-steps.py                      # co zrobił agent w każdym kroku
```

Po eksperymentach przywróć dane, flagi i chaos Rolnopolu: `git -C ../rolnopol checkout -- data/`.

## Eksperymenty, które wymagają przełączenia Rolnopolu

E1, E2, E3 i E5 sprawdzają, co się dzieje, gdy aplikacja się zmieni. Rolnopol musi wtedy **już działać** (runner użyje tej instancji), a stan przełączasz przez API skryptem `scripts/rolnopol.sh`:

```bash
# terminal 1: Rolnopol
cd ../rolnopol && NODE_ENV=test npm start

# terminal 2: przełącznik i eksperyment
scripts/rolnopol.sh flag staffFieldsExportEnabled true
npx e2e run --config e2e.exp.config.ts --tag e2
scripts/rolnopol.sh reset                             # flagi i chaos do stanu domyślnego
```

Zmiana flagi w pliku `data/feature-flags.json` przed startem nie wystarczy. Przełączaj flagi przez API.

## Co sprawdza każdy eksperyment

| Eksperyment | Pytanie | Jak uruchomić | Wynik u nas (12.11.2026, e2e 0.23.0, gpt-4.1) |
|---|---|---|---|
| **E1** `e1-password-policy` | Flaga zmienia politykę haseł. Kto zauważy nowe wymagania, a kto się „dostosuje”? | stan domyślny, potem `flag registrationStrongPasswordEnabled true` | Przy słabej polityce: Playwright i agent z twardą asercją przechodzą. `agent.assert('konto założone')` kończy się `INCONCLUSIVE` (strona logowania nie mówi, że konto powstało). Agent bez hasła w poleceniu nie kończy rejestracji. |
| **E2** `e2-export-flag` | Funkcja znika. Czy agent przyzna, że jej nie ma? | `flag staffFieldsExportEnabled true`, potem `false` | Z włączoną flagą 3/3 przechodzą. **Uwaga:** w Rolnopolu z listopada 2026 eksport jest domyślnie **wyłączony**. Bez flagi agent szuka eksportu po całej aplikacji, aż przepełni kontekst (`CONTEXT_OVERFLOW`, gpt-4.1 w Copilocie ma limit 64 tys. tokenów). |
| **E3** `e3-chaos-animals` | Backend zwraca 500. Czy agent zgłosi awarię, czy ją „przeklika”? | `fault /v1/animals 1` albo `0.5` | Nawet bez awarii agent często orzeka „nie dodano”, bo nie radzi sobie ze stronicowaną listą. Werdykt `agent.act` to opinia agenta, a nie fakt. |
| **E5** `e5-relabel` | Zmiana etykiety przycisku. Czy działa self-healing? | ręcznie zmień „Add Animal” w `../rolnopol/public/staff-fields-main.html`, potem `git checkout` | Bez zmiany oba warianty przechodzą. Po zmianie (pomiar z 13.10, e2e 0.19) Playwright padał na lokatorze, a agent z personą `doer` znajdował nowy przycisk. Z domyślną personą agent dokładał własne sprawdzanie i fałszywie oblewał krok. |
| **E6** `e6-api-ui` | Dane przez API, sprawdzenie w UI i odwrotnie. Fixture API w e2e. | stan domyślny | 3/3 przechodzą. |
| **E7** `e7-mock-500` | Zapis kończy się 500. Czy użytkownik widzi błąd? | stan domyślny (mock w teście) | **7 z 8 nie przechodzi i tak ma być.** W Rolnopolu `id="animalMessage"` występuje dwa razy, więc komunikat błędu trafia za okno dialogowe i użytkownik go nie widzi. Prawdę mówią test „jak użytkownik” i wszystkie warianty `agent.assert` (drzewo i zrzut ekranu). Przechodzi tylko naiwny test na tekst błędu, bo tekst jest w DOM, tyle że schowany. |
| **E8** `e8-visual` | Porównanie wizualne `toHaveScreenshot`. | stan domyślny | Pierwsze uruchomienie zapisuje wzorzec (`*-snapshots/`, poza repo, bo zależy od systemu), kolejne porównują. |
| **E9** `e9-tampered-ui` | UI pokazuje złą kwotę, API mówi prawdę. Kto to złapie? | stan domyślny (podmiana odpowiedzi w teście) | Kod (UI kontra API), `agent.extract` z kodem i agent-audytor z narzędziem do bazy **łapią podmianę, więc nie przechodzą, i tak ma być**. „Ślepe” `agent.assert('kwoty są poprawne')` przechodzi, bo agent nie wie, jakie kwoty są prawdziwe. Kontrola z poprawnym UI przechodzi. |
| **E9b** `e9b-truncated` | To samo, gdy UI ucina liczbę (1112 → 111). | stan domyślny | Jak w E9: audytor łapie, ślepe `agent.assert` nie. |
| **E10** `e10-console` | Błędy JS i `console.error` na 8 stronach. | stan domyślny | 9/9 przechodzą (w tym kontrola z celowym błędem). |
| **E11** `e11-ait1-port` | Port testów z frameworka AI_Testers 1 (Page Object, Playwright) do e2e. | stan domyślny | 3/3 przechodzą. |

Persony w `e2e.config.ts`: `qa` (zna pułapki Rolnopolu: stronicowane listy, wyszukiwarka filtruje po typie), `doer` (wykonuje kroki, nie sprawdza wyniku, dzięki czemu krok trafia do cache) i `auditor` w `e2e.exp.config.ts` (z narzędziem `backendAnimals`, które czyta dane prosto z `../rolnopol/data/animals.json`).

## Bliźniaki w Playwright Test

Katalog `pw/` zawiera te same scenariusze E6–E10 w czystym Playwright Test. Rolnopol musi już działać:

```bash
cd pw
npm install
npx playwright install chromium
npx playwright test                       # APP_URL=http://localhost:3100 dla innego portu
```

## Bug bash z `e2e explore`

`e2e.bugbash.config.ts` uruchamia eksplorację na działającym Rolnopolu z personami `skeptic` i `fuzzer`:

```bash
START_PATH=/register.html npx e2e explore "Register a new account and try to break the form validation" --config e2e.bugbash.config.ts --agent fuzzer
```
