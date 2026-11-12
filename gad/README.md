# Dodatek: e2e na aplikacji GAD

Ten katalog nie jest potrzebny do pracy z Rolnopolem. To dodatkowy zestaw, którym porównywaliśmy e2e od TesterArmy z frameworkiem Playwright z kursu „Testy Automatyczne z Playwright” na aplikacji [GAD](https://github.com/jaktestowac/gad-gui-api-demo) (jaktestowac.pl).

| Plik | Co sprawdza |
|---|---|
| `tests/gad.setup.e2e.ts` | zakłada konto testowe `e2e-agent@test.pl` przez API (jeśli go nie ma), loguje się i zapisuje sesję `gad` |
| `tests/g1-article.e2e.ts` | cykl życia artykułu: wariant mieszany (agent dodaje, kod sprawdza) i w pełni agentowy (dodanie, sprawdzenie, usunięcie) |
| `tests/g2-register-ddt.e2e.ts` | DDT rejestracji: puste pole daje komunikat „This field is required” (kod i `agent.assert`) |
| `tests/g3-users-api.e2e.ts` | DDT API rejestracji: `fetch`, asercje na wartościach i schemat `zod` zamiast request objectów |
| `scripts/gad-user.sh` | to samo konto testowe ręcznie, przez `curl` (gdy GAD już działa) |
| `scripts/gad-mutations.sh` | testy mutacyjne: włącza po kolei 10 bugów GAD i uruchamia podany zestaw testów |
| `e2e.gad.config.ts` | config: model i agenci z głównego `e2e.config.ts`, cel to GAD, start GAD przez runner |

## Uruchomienie

Sklonuj GAD obok tego repo i zainstaluj zależności:

```bash
git clone https://github.com/jaktestowac/gad-gui-api-demo.git
cd gad-gui-api-demo && npm install && cd ..
```

Runner sam startuje GAD z `../gad-gui-api-demo` i zatrzymuje go po testach. Domyślny port to 3000, tak samo jak w Rolnopolu, a jeśli na porcie coś już działa, runner tego użyje. Inny port: `GAD_PORT=3200`, inny katalog: `GAD_DIR=/sciezka/do/gad`.

Komendy z katalogu głównego tego repo:

```bash
npx e2e run --config gad/e2e.gad.config.ts                   # cały zestaw
npx e2e run --config gad/e2e.gad.config.ts --tag g3          # tylko API
GAD_PORT=3200 npx e2e run --config gad/e2e.gad.config.ts     # GAD na innym porcie
```

Testy mutacyjne wymagają GAD uruchomionego ręcznie (`npm start` w katalogu GAD), bo skrypt przełącza bugi przez API między przebiegami:

```bash
# wyniki każdego bugu w /tmp/gad-mut/<bug>.log
gad/scripts/gad-mutations.sh /tmp/gad-mut npx e2e run --config gad/e2e.gad.config.ts
```

## Pułapki, które wyszły na GAD

- **Konto z danych startowych GAD nie zadziała w `credentials`.** Ma hasło krótsze niż 6 znaków, a e2e odrzuca takie wartości (`INVALID_CONFIG`), bo nie umie ich zamaskować w raportach. Dlatego setup zakłada osobne konto.
- **Agent nie obsłuży okna `confirm()`.** Usunięcie artykułu kończy się `blocked`, dopóki kod nie zarejestruje `browser.onDialog('accept')`.
- **Dane GAD rosną z każdym przebiegiem.** Zrób kopię `db/db.json` przed testami i przywróć ją po nich (albo zresetuj bazę przez API GAD).
