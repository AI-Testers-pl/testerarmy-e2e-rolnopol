#!/bin/sh
# Przełączniki Rolnopolu do eksperymentów: feature flagi i chaos engine (API bez logowania).
#   scripts/rolnopol.sh flag <nazwa> <true|false>
#   scripts/rolnopol.sh chaos <off|level1..level5>
#   scripts/rolnopol.sh fault <ścieżka> <p>   # 500 na POST z prawdopodobieństwem p
#   scripts/rolnopol.sh reset    # flagi i chaos do stanu domyślnego
URL=${APP_URL:-http://localhost:3000}
case "$1" in
  flag)  curl -s -X PATCH "$URL/api/v1/feature-flags" -H 'Content-Type: application/json' \
           -d "{\"flags\":{\"$2\":$3}}" | grep -o "\"$2\":[a-z]*" ;;
  chaos) curl -s -X PATCH "$URL/api/v1/chaos-engine" -H 'Content-Type: application/json' \
           -d "{\"mode\":\"$2\"}" | grep -o '"mode":"[a-z0-9]*"' | head -1 ;;
  fault) # scripts/rolnopol.sh fault /v1/animals 0.5  -> 500 na POST pod ścieżką z danym prawdopodobieństwem
         curl -s -X PATCH "$URL/api/v1/chaos-engine" -H 'Content-Type: application/json' -d "{\"mode\":\"custom\",\"customConfig\":{\"enabled\":true,
           \"latency\":{\"enabled\":false},\"responseLoss\":{\"enabled\":false},
           \"errorInjection\":{\"enabled\":true,\"probability\":$3,\"statusCodes\":[500],\"message\":\"[Chaos] injected\"},
           \"scope\":{\"methods\":[\"POST\"],\"includePaths\":[\"$2\"],\"percentOfTraffic\":100}}}" | grep -o '"probability":[0-9.]*' | tail -1 ;;
  reset) curl -s -X POST "$URL/api/v1/feature-flags/reset" >/dev/null
         curl -s -X POST "$URL/api/v1/chaos-engine/reset" >/dev/null; echo reset ;;
  *) echo "użycie: $0 flag <nazwa> <true|false> | chaos <tryb> | reset"; exit 1 ;;
esac
