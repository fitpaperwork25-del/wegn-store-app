#!/usr/bin/env bash
# Checks that every local migration's tables/columns and every local Edge
# Function actually exist in production. Doesn't rely on `supabase migration
# list` - this repo's migration filenames are date-only (no time component),
# so several files share one "version" and the CLI's own tracking collapses
# them together. This checks real declared state against real live state
# instead.
#
# Usage: PROJECT_REF=<ref> ./scripts/check-deploy-parity.sh
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_REF="${PROJECT_REF:-$(cat supabase/.temp/project-ref 2>/dev/null || true)}"
if [ -z "$PROJECT_REF" ]; then
  echo "Could not determine project ref. Set PROJECT_REF=<ref> or run 'supabase link' first." >&2
  exit 1
fi

fail=0

echo "== Checking tables/columns declared in migrations against live schema =="

live_schema=$(supabase db query --linked \
  "select table_name || '.' || column_name from information_schema.columns where table_schema='public';" \
  2>/dev/null | grep -oE '"[a-z_]+\.[a-z_0-9]+"' | tr -d '"')

live_tables=$(echo "$live_schema" | cut -d. -f1 | sort -u)

# CREATE TABLE IF NOT EXISTS <name>
while read -r table; do
  [ -z "$table" ] && continue
  if ! echo "$live_tables" | grep -qx "$table"; then
    echo "MISSING TABLE: $table (declared in a migration, not found in production)"
    fail=1
  fi
done < <(grep -rhoiE 'create table (if not exists )?(public\.)?[a-z_][a-z_0-9]*' supabase/migrations/*.sql \
  | awk '{print $NF}' | sed 's/^public\.//' | tr 'A-Z' 'a-z' | sort -u)

# ALTER TABLE <table> ... ADD COLUMN IF NOT EXISTS <col>
grep -rhoiE '(alter table [a-z_.]+|add column if not exists [a-z_][a-z_0-9]*)' supabase/migrations/*.sql \
  | awk '
    BEGIN { IGNORECASE = 1 }
    /alter table/ { match($0, /alter table (public\.)?([a-z_][a-z_0-9]*)/, m); table = tolower(m[2]); next }
    /add column/  { match($0, /add column if not exists ([a-z_][a-z_0-9]*)/, m); if (table != "") print table "." tolower(m[1]) }
  ' 2>/dev/null | sort -u | while read -r pair; do
    [ -z "$pair" ] && continue
    if ! echo "$live_schema" | grep -qx "$pair"; then
      echo "MISSING COLUMN: $pair (declared in a migration, not found in production)"
      fail=1
    fi
  done

echo ""
echo "== Checking local Edge Functions against deployed Edge Functions =="

deployed_fns=$(supabase functions list --project-ref "$PROJECT_REF" 2>/dev/null | grep -oE '"slug":"[a-z-]+"' | sed 's/"slug":"//;s/"//')

for dir in supabase/functions/*/; do
  fn=$(basename "$dir")
  [ "$fn" = "_shared" ] && continue
  if ! echo "$deployed_fns" | grep -qx "$fn"; then
    echo "MISSING FUNCTION: $fn (exists locally, not deployed)"
    fail=1
  fi
done

echo ""
if [ "$fail" -eq 0 ]; then
  echo "Deploy parity OK - nothing missing."
else
  echo "Deploy parity gaps found above. Apply the relevant migration(s) with:"
  echo "  supabase db query --linked --file supabase/migrations/<file>.sql"
  echo "and deploy missing functions with:"
  echo "  supabase functions deploy <name> --project-ref $PROJECT_REF --use-api"
fi
exit $fail
