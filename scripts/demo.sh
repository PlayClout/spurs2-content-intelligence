#!/usr/bin/env bash
# Start the demo: the producer app + the worker + the live engine, all on the DEMO database.
# The demo database is separate from the test database (flow): tests reset data and refuse to touch demo.
#   bash scripts/demo.sh          start everything, open the app
#   bash scripts/demo.sh stop     stop everything
set -u
cd "$(dirname "$0")/.." || exit 1
REPO=$(pwd)
PORT=${DEMO_PORT:-3000}
DB=postgres://postgres:verify@127.0.0.1:55432/demo
RENDERS=out/demo-renders
LOGS=/tmp/spurs2-demo

stop() {
  pkill -f "next start -p $PORT" 2>/dev/null
  pkill -f "DEMO_MARK=spurs2" 2>/dev/null
  for pid in $(ps -eo pid,command | grep "[p]ipeline/worker.ts" | awk '{print $1}'); do
    ps -E -p "$pid" 2>/dev/null | grep -q "DEMO_MARK=spurs2" && kill "$pid" 2>/dev/null
  done
  sleep 1
}
if [ "${1:-}" = "stop" ]; then stop; echo "demo stopped"; exit 0; fi

docker exec s2-pg-verify psql -U postgres -d demo -At -c "select 1" >/dev/null 2>&1 || { echo "demo database not found (docker container s2-pg-verify, database demo)"; exit 1; }
stop
mkdir -p "$LOGS" "$RENDERS"
[ -f web/.next/BUILD_ID ] || (cd web && DATABASE_URL=$DB npm run build > "$LOGS/build.log" 2>&1) || { echo "build failed: $LOGS/build.log"; exit 1; }

export DEMO_MARK=spurs2 RENDER_STORAGE=local
(cd web && DATABASE_URL=$DB RENDER_OUT_DIR="$REPO/$RENDERS" nohup npx next start -p "$PORT" > "$LOGS/app.log" 2>&1 &)
DATABASE_URL=$DB RENDER_OUT_DIR=$RENDERS nohup node_modules/.bin/tsx --env-file=.env pipeline/worker.ts > "$LOGS/worker.log" 2>&1 &
DATABASE_URL=$DB RENDER_OUT_DIR=$RENDERS WORKER_LANE=live nohup node_modules/.bin/tsx --env-file=.env pipeline/worker.ts > "$LOGS/live-engine.log" 2>&1 &

for _ in $(seq 1 40); do curl -s -o /dev/null "http://localhost:$PORT/robots.txt" && break; sleep 1; done
echo "demo running on the DEMO database: http://localhost:$PORT  (logs in $LOGS)"
echo "stop with: bash scripts/demo.sh stop"
[ "${NO_OPEN:-}" ] || open "http://localhost:$PORT"
