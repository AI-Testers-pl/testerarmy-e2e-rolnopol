#!/bin/sh
# Zakłada w GAD (GAD_URL, domyślnie :3000) konto testowe dla e2e. Kod 409 = konto już jest.
curl -s -o /dev/null -w "%{http_code}\n" -X POST ${GAD_URL:-http://localhost:3000}/api/users -H 'Content-Type: application/json' \
  -d "{\"email\":\"e2e-agent@test.pl\",\"firstname\":\"E2E\",\"lastname\":\"Agent\",\"password\":\"${GAD_PASSWORD:-Haslo123!e2e}\",\"avatar\":\"./data/users/face.png\"}"
