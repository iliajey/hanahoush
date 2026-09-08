from _p115 import *
from django.apps import apps
import json
counts = {}
for model in apps.get_models():
    label = f"{model._meta.app_label}.{model.__name__}"
    try:
        counts[label] = model._base_objects.count() if hasattr(model, "_base_objects") else model.objects.count()
    except Exception as e:
        counts[label] = f"ERR {e}"
print(json.dumps(counts, indent=1))
