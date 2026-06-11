#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# Create superuser if doesn't exist
python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@lms.com').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@lms.com',
        password='admin123'
    )
    print('✅ Superuser created')
else:
    print('Superuser already exists')
END