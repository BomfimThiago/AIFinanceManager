#!/bin/sh -e
set -x

echo "🔍 Linting Python code with Ruff..."
uv run ruff check --fix src

echo "✨ Formatting Python code with Ruff..."
uv run ruff format src

echo "✅ Linting and formatting complete!"