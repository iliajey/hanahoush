#!/bin/sh
# Apply migrations and load any seed data.
set -e
python manage.py migrate --noinput
python manage.py loaddata initial
