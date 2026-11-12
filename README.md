# Testy E2E Rolnopolu we frameworku e2e od TesterArmy

Kod z webinaru AI_Testers 2.0 **„Testy E2E – dokąd zmierzamy?”** (14.10.2026, Przemek Barański i Krzysiek Kijas), zaktualizowany do **e2e 0.23.0** (listopad 2026).

Testujemy aplikację [Rolnopol](https://github.com/jaktestowac/rolnopol) we frameworku [e2e od TesterArmy](https://tester.army/e2e). Jesteśmy kursantami tego frameworka, nie jego autorami: nie współpracujemy z TesterArmy, sprawdzaliśmy go sami.

## Czym jest e2e

e2e to open source'owy framework do testów E2E (licencja Apache-2.0). Testy piszesz w TypeScripcie, a testy webowe uruchamia pod spodem Playwright. Sam decydujesz, ile AI jest w teście:

- **Test skryptowy.** Lokatory i `expect`, jak w Playwrighcie. Działa bez modelu i bez kosztów.
- **Test z agentem.** Cel opisujesz zwykłymi słowami (`agent.act('dodaj zwierzę do farmy')`), a agent sam klika w aplikacji.
- **Mieszany.** Agent przechodzi scenariusz, a wynik sprawdzasz twardą asercją.

Najważniejsza funkcja to **cache z powtórką kroków**. Krok `agent.act`, który potwierdziła późniejsza asercja, zapisuje wykonane akcje. Kolejne uruchomienie odtwarza je bez wywoływania modelu. Agent wraca dopiero wtedy, gdy aplikacja się zmieni i powtórka przestanie pasować.

Nasz pomiar na tym repo (12.11.2026, e2e 0.23.0, 8 testów z `tests/`, Copilot):

| | gpt-4.1, 1. uruchomienie | gpt-4.1, 2. uruchomienie (cache) | Claude Sonnet 4.6, 1. uruchomienie | Claude Sonnet 4.6, cache |
|---|---|---|---|---|
| Wywołania modelu | 21 | 8 (tylko `agent.assert`) | 27 | 8 |
| Tokeny | 101 tys. | 17 tys. | 203 tys. | 20 tys. |
| Czas | 177 s | 90 s | 76 s | 48 s |

gpt-4.1 jest wolniejszy, ale nie zużywa limitu premium requests w Copilocie (szczegóły niżej).

`agent.assert` zawsze woła model, także przy powtórce z cache. Chcesz przebiegu bez modelu, to po `agent.act` sprawdzaj wynik przez `expect(locator)`.

## Wymagania

- **Node.js 24.8+ albo 22.22.3+.** Starszy Node, np. 22.14, nie zainstaluje paczek. Sprawdź: `node -v`.
- **Git** i **GitHub CLI (`gh`)**.
- **GitHub Copilot** (wystarczy plan z dostępem do modeli w API, np. Copilot Pro). Szczegóły w sekcji [Model](#model-github-copilot).

## Szybki start

```bash
# 1. Rolnopol i ten projekt obok siebie, w jednym katalogu
git clone https://github.com/jaktestowac/rolnopol.git
git clone https://github.com/AI-Testers-pl/testerarmy-e2e-rolnopol.git
cd rolnopol && npm install && cd ..
cd testerarmy-e2e-rolnopol

# 2. Wyłącz telemetrię, zanim uruchomisz pierwszą komendę e2e
npx e2e telemetry disable

# 3. Zależności (Chromium runner ściągnie sam przy pierwszym uruchomieniu;
#    ręcznie: npx @e2e-dev/web install chromium)
npm install

# 4. Logowanie do Copilota (jednorazowo)
gh auth login -h github.com -p https -w
npx e2e login github-copilot

# 5. Sprawdzenie, czy wszystko gotowe (nic nie uruchamia)
npx e2e doctor

# 6. Testy
npx e2e run
```

Rolnopola nie uruchamiasz ręcznie. Runner sam go startuje z `../rolnopol` i zatrzymuje po testach.

**Uwaga na port 3000.** Jeśli na porcie 3000 działa już jakakolwiek inna aplikacja, runner jej użyje (`reuseExisting`) i testy padną z dziwnymi błędami, np. `404` na `/register.html`. Wtedy uruchom Rolnopol na innym porcie:

```bash
ROLNOPOL_PORT=3100 npx e2e run
```

Rolnopol w innym katalogu: `ROLNOPOL_DIR=/sciezka/do/rolnopol npx e2e run`.

**Po testach przywróć dane Rolnopolu**, bo testy dodają konta i zwierzęta:

```bash
git -C ../rolnopol checkout -- data/
```

## Co jest w testach

| Plik | Co pokazuje | Model |
|---|---|---|
| `tests/example.e2e.ts` | strona się otwiera | nie |
| `tests/auth.setup.e2e.ts` | logowanie raz na przebieg i zapis sesji `demo` | nie |
| `tests/animals.e2e.ts` | agent dodaje grupę zwierząt (persona `doer`), wynik sprawdzają `expect` i `agent.assert` | tak (z cache: tylko assert) |
| `tests/register/register.playwright.e2e.ts` | rejestracja: same lokatory i `expect` | nie |
| `tests/register/register.mixed.e2e.ts` | rejestracja: agent wypełnia formularz, wynik sprawdza kod | tak (z cache: nie) |
| `tests/register/register.agent.e2e.ts` | rejestracja w pełni agentowa | tak |
| `tests/register/register.ai-check.e2e.ts` | zwykłe akcje, sprawdzenie przez `agent.assert` | tak |
| `tests/register/assert-mutations.e2e.ts` | czy `agent.assert` odrzuca fałszywe twierdzenia (1 prawdziwe, 4 fałszywe) | tak |

W teście `assert-mutations` zobaczysz w wyniku cztery czerwone `agent.assert`. To poprawne: fałszywe twierdzenia mają zostać odrzucone, a test sprawdza, że tak się stało.

Cztery warianty rejestracji to ten sam scenariusz z coraz większym udziałem AI. Porównaj czas, liczbę wywołań i tokeny w podsumowaniu `npx e2e run`. Pomysł pochodzi z wpisu Sławka Radzymińskiego [Agentic E2E testing: actions, assertions and cost](https://awesome-testing.com/2026/10/agentic-e2e-testing-actions-assertions-and-cost).

Wybrane testy:

```bash
npx e2e run --tag register            # cztery warianty rejestracji
npx e2e run tests/animals.e2e.ts      # jeden plik
npx e2e run --no-cache                # bez powtórki z cache, agent od zera
npx e2e run --last-failed             # tylko to, co ostatnio nie przeszło
```

Po przebiegu:

```bash
python3 scripts/report-steps.py       # co zrobił agent, co poszło z cache, jakie akcje
```

Raport jest w `.e2e/report.json`, ślad każdego testu w `.e2e/results/<test>/trace.md`, log Rolnopolu w `.e2e/logs/rolnopol.log`.

## Model: GitHub Copilot

W `e2e.config.ts` domyślny model to `copilot('gpt-4.1')`. Inny model wybierzesz bez zmiany kodu:

```bash
E2E_MODEL=claude-sonnet-4.6 npx e2e run
npx e2e models github-copilot          # modele dostępne w Twoim planie
```

**Uważaj na limit premium requests.** Copilot Pro daje 300 premium requests miesięcznie. Modele bez mnożnika, np. `gpt-4.1`, nie zużywają tego limitu. Claude Sonnet zużywa go przy **każdym wywołaniu modelu**, a test z agentem to 5–15 wywołań. U nas 300 zapytań skończyło się po ok. 15 minutach testów. Potem model zwraca `429 quota exceeded`. Stan limitu sprawdzisz tak:

```bash
gh api /copilot_internal/user --jq '.quota_snapshots.premium_interactions'
```

Modele oznaczone `not enabled` włączysz w ustawieniach Copilota na github.com.

**Logowanie:**

- e2e **nie korzysta z logowania w VS Code**. Token bierze z `gh auth token`, dlatego potrzebny jest `gh auth login`.
- **Token PAT nie działa.** Fine-grained PAT z uprawnieniem „Copilot Requests” e2e przyjmie i powie „login stored”, ale API Copilota odrzuci go przy pierwszym wywołaniu (`400`, „Personal Access Tokens are not supported”).

Inny dostawca (OpenAI, Anthropic, Google, OpenRouter): zobacz [dokumentację modeli](https://e2e.tester.army/docs) albo offline w `node_modules/e2e/docs`. Doinstaluj paczkę `@ai-sdk/<dostawca>` i podmień `model` w `e2e.config.ts`.

## Eksperymenty (`tests/exp/`)

Eksperymenty z webinaru: czy agent zauważy zmianę wymagań, znikającą funkcję, błąd backendu, zmianę etykiety przycisku. Część z nich ma **celowo nie przechodzić**, bo pokazuje błąd albo ograniczenie. Opis każdego eksperymentu i oczekiwane wyniki: [tests/exp/README.md](tests/exp/README.md).

```bash
npx e2e run --config e2e.exp.config.ts --tag e7
```

Obok, w katalogu `pw/`, są te same scenariusze w czystym Playwright Test do porównania (`cd pw && npm install && npx playwright test`, Rolnopol musi wtedy już działać).

## Praca z agentem kodującym

W repo jest skill e2e (`.agents/skills/e2e/`, link w `.claude/skills/e2e`) i serwer MCP e2e (`.mcp.json`, `.cursor/mcp.json`). Agent kodujący (Claude Code, Cursor, Copilot) czyta skill i dokumentację offline z `node_modules/e2e/docs`, więc prompt „dodaj test dodawania pola w Rolnopolu” nie wymaga dodatkowych wyjaśnień. Po aktualizacji e2e skill odświeżysz komendą `npx e2e upgrade`.

## Telemetria

CLI e2e domyślnie wysyła anonimowe dane o użyciu: komendę, nazwy flag (bez wartości), wersje, system, czas i kody błędów. Według dokumentacji nie wysyła treści testów, danych aplikacji ani haseł. **Pierwsze uruchomienie z włączoną telemetrią już coś wysyła**, dlatego wyłącz ją na samym początku:

```bash
npx e2e telemetry disable          # na stałe, ~/.config/e2e/telemetry.json
export DO_NOT_TRACK=1              # dla terminala albo CI
```

Szczegóły: [e2e.tester.army/docs/telemetry](https://e2e.tester.army/docs/telemetry).

## Ograniczenia, o których warto wiedzieć

- Wersja 0.x: API i config zmieniają się między wersjami minor. Wersje są przypięte w `package.json`. Aktualizacja: `npx e2e upgrade`.
- `agent.assert`, `agent.waitFor` i `agent.extract` zawsze wołają model ([#963](https://github.com/tester-army/e2e/issues/963), zamknięte jako „not planned”).
- Model nie jest częścią klucza cache. Po zmianie modelu powtórka dalej się odtwarza, a raport pokazuje tylko `recorded with <model>`. Nowy model sprawdzisz przez `--no-cache` ([#1000](https://github.com/tester-army/e2e/issues/1000)).
- Przy modelach przez Copilota AI SDK wypisuje ostrzeżenie `"responseFormat" is not supported`. W naszych testach nie miało wpływu na wynik.

## GAD

Na boku, w [gad/](gad/README.md), jest dodatkowy zestaw na aplikację GAD (artykuły, DDT rejestracji, DDT API, testy mutacyjne). Nie jest potrzebny do pracy z Rolnopolem.

## Linki

- Framework: [tester.army/e2e](https://tester.army/e2e), dokumentacja [e2e.tester.army/docs](https://e2e.tester.army/docs), kod i zgłoszenia [github.com/tester-army/e2e](https://github.com/tester-army/e2e)
- Rolnopol: [github.com/jaktestowac/rolnopol](https://github.com/jaktestowac/rolnopol)
- Program AI_Testers: [aitesters.pl](https://aitesters.pl)
