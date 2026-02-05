#!/bin/sh
set -e

# Run migrations before starting the app
node ./node_modules/typeorm/cli.js -d dist/infra/db/data-source.js migration:run

exec node dist/main.js
