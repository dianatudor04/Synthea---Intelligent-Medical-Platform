#!/usr/bin/env bash
# Download the DDInter drug-drug interaction dataset (one CSV per ATC code group).
# Run from this directory: bash download.sh
# Then import into the DB: cd ../../ && npm run import:ddinter
set -euo pipefail
cd "$(dirname "$0")"

for code in A B C D G H J L M N P R S V; do
  echo "Downloading group ${code}..."
  wget -q "http://ddinter.scbdd.com/static/media/download/ddinter_downloads_code_${code}.csv"
done

echo "Done. $(ls -1 *.csv | wc -l) files downloaded."
