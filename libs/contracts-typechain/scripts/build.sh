#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKING_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ARTIFACTS_DIR="$WORKING_DIR/artifacts"
SRC_DIR="$WORKING_DIR/src"
DIST_DIR="$WORKING_DIR/dist"

rm -rf "$ARTIFACTS_DIR" "$SRC_DIR" "$DIST_DIR"

mkdir -p "$ARTIFACTS_DIR"

contracts=(
  "AgreementERC1155"
  "AgreementFactory"
  "AgreementProxy"
  "AgreementRelationsRegistry"
  "FallbackVault"
  "FeeManager"
  "NamespaceRegistry"
  "SplitCurrencyListManager"
  "RoyaltyLoan"
  "RoyaltyLoanFactory"
  "ERC20TokenMock"
  "Whitelist"
)

# Build find arguments for contract names
find_args=()
for c in "${contracts[@]}"; do
  find_args+=(-name "$c.json" -o)
done
unset 'find_args[-1]'

# Find all matching JSONs, excluding shared folder
files=$(find "$WORKING_DIR"/../contracts-*/artifacts/contracts/ -type f \( "${find_args[@]}" \) -not -path "*/shared/*")

# Copy files to TARGET_DIR
for f in $files; do
  cp "$f" "$ARTIFACTS_DIR/"
done

npx typechain --target ethers-v5 --out-dir "$SRC_DIR" "$ARTIFACTS_DIR"/*.json
tsc "$SRC_DIR/index.ts" --outDir "$DIST_DIR" --declaration --skipLibCheck

rm -rf "$ARTIFACTS_DIR"