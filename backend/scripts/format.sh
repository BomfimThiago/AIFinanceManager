#!/bin/sh -e
set -x

echo "✨ Formatting Python code with Ruff..."
uv run ruff format src

echo "✅ Code formatting complete!"