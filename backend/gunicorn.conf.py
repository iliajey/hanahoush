"""Gunicorn configuration for the Hanahoush backend (production).

Used when running ``gunicorn config.wsgi:application`` directly on a
server or PaaS. This is process configuration, not container tooling.
"""
import multiprocessing
import os

bind = f"0.0.0.0:{os.environ.get('GUNICORN_PORT', '8000')}"
workers = int(os.environ.get("GUNICORN_WORKERS", multiprocessing.cpu_count() * 2 + 1))
threads = int(os.environ.get("GUNICORN_THREADS", "2"))
worker_class = "sync"
max_requests = 1000
max_requests_jitter = 50
timeout = 60
graceful_timeout = 30
keepalive = 5

accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("GUNICORN_LOG_LEVEL", "info")
