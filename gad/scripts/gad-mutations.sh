#!/bin/sh
# Testy mutacyjne na GAD: włącza po kolei bug, uruchamia podaną komendę testów, zapisuje wynik i resetuje config.
#   gad/scripts/gad-mutations.sh <katalog-wyników> <komenda testów...>
# GAD musi działać (domyślnie :3000, inaczej GAD_URL). Lista bugów: config/config-bugs.js w repo GAD.
OUT=$1; shift
mkdir -p "$OUT"
BUGS="${BUGS:-bug_validation_001 bug_validation_002 bug_validation_005 bug_404_if_article_created_recently bug_404_if_comment_created_recently bug_articles_001 bug_articles_002 bug_disable_module_comments bug_slower_responses_1000ms bug_random_503}"
for bug in $BUGS; do
  curl -s ${GAD_URL:-http://localhost:3000}/api/config/reset >/dev/null
  curl -s -X POST ${GAD_URL:-http://localhost:3000}/api/config/bugs -H 'Content-Type: application/json' -d "{\"$bug\": true}" >/dev/null
  start=$(date +%s)
  "$@" > "$OUT/$bug.log" 2>&1
  end=$(date +%s)
  echo "$bug  exit=$?  $((end-start))s  $(grep -Eo '[0-9]+ (failed|passed|flaky|skipped)' "$OUT/$bug.log" | tr '\n' ' ')$(grep -Eo 'Tests +[0-9]+ (failed|passed)[^)]*' "$OUT/$bug.log" | head -1)"
done
curl -s ${GAD_URL:-http://localhost:3000}/api/config/reset >/dev/null
