"""Django ORM implementation of the repository port."""
from typing import Any, Generic, TypeVar

from django.db import models

from apps.common.domain.interfaces.base_repository import BaseRepository

Model = TypeVar("Model", bound=models.Model)


class DjangoRepository(BaseRepository, Generic[Model]):
    """Generic repository over a Django model.

    Feature apps subclass this and expose the exact query API their
    use cases need.

    Usage::

        class UserRepository(DjangoRepository[UserModel]):
            pass
    """

    model_class: type[models.Model]

    def __init__(self) -> None:
        if not hasattr(self, "model_class"):
            raise TypeError("Subclasses must declare model_class.")

    def get(self, *args: Any, **kwargs: Any) -> models.Model:
        return self.model_class.objects.get(*args, **kwargs)

    def list(self, *args: Any, **kwargs: Any) -> list[models.Model]:
        return list(self.model_class.objects.filter(*args, **kwargs))

    def create(self, **kwargs: Any) -> models.Model:
        return self.model_class.objects.create(**kwargs)

    def update(self, instance: models.Model, **kwargs: Any) -> models.Model:
        for field, value in kwargs.items():
            setattr(instance, field, value)
        instance.save()
        return instance

    def delete(self, instance: models.Model) -> None:
        instance.delete()
