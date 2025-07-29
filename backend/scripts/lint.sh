#!/bin/sh -e
set -x

uv run ruff check --fix src
uv run ruff format src