"""Phase 13 regression tests: long/structured article content must round-trip intact.

Root-cause context: the article ``description_*`` columns are unbounded
``TextField``s with no serializer length validation, so the backend stores
arbitrary-length HTML verbatim. These tests pin that contract for short,
medium, long and very-long bodies across FA/AR/EN (incl. mixed RTL/LTR),
many headings, tables and embedded markup, and prove that:

- create → retrieve → patch round-trips preserve every byte,
- invalid ``status`` values are rejected with a 400 (not silently stored),
- DELETE returns a bodyless 204 (RFC 9110).
"""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.articles.models import Article


def _long_paragraph(locale: str, index: int, words: int = 60) -> str:
    if locale == "fa":
        return " ".join([f"واژه{index}-{i}" for i in range(words)])
    if locale == "ar":
        return " ".join([f"كلمة{index}-{i}" for i in range(words)])
    return " ".join([f"word{index}-{i}" for i in range(words)])


def _headings_block(count: int = 40) -> str:
    parts = []
    for i in range(count):
        parts.append(f"<h2>Section {i}</h2><p>{_long_paragraph('en', i)}</p>")
        parts.append(f"<h3>Subsection {i}</h3><p>{_long_paragraph('fa', i)}</p>")
    return "".join(parts)


TABLE_HTML = (
    "<table><thead><tr><th>Col A</th><th>Col B</th></tr></thead>"
    "<tbody>" + "".join(f"<tr><td>r{i}a</td><td>r{i}b</td></tr>" for i in range(50)) + "</tbody></table>"
)


class LongContentRegressionTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.staff = User.objects.create_user(
            username="longform-editor",
            email="longform@hanahoush.local",
            password="pass12345",
            is_staff=True,
        )

    def setUp(self):
        self.client.force_authenticate(self.staff)

    def url(self, pk=None):
        base = "/api/v1/articles/"
        return base if pk is None else f"{base}{pk}/"

    def _payload(self, slug, description_en="", description_fa="", description_ar="", **overrides):
        payload = {
            "title_fa": f"مقاله {slug}",
            "title_en": f"Article {slug}",
            "title_ar": f"مقالة {slug}",
            "slug": slug,
            "short_description_fa": "خلاصه",
            "short_description_en": "Summary",
            "short_description_ar": "ملخص",
            "description_fa": description_fa,
            "description_en": description_en,
            "description_ar": description_ar,
            "status": "draft",
            "is_public": True,
        }
        payload.update(overrides)
        return payload

    def _roundtrip(self, slug, **bodies):
        create = self.client.post(self.url(), self._payload(slug, **bodies), format="json")
        self.assertEqual(create.status_code, status.HTTP_201_CREATED, create.content[:500])
        pk = create.json()["data"]["id"]

        detail = self.client.get(self.url(pk))
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        for field, expected in bodies.items():
            self.assertEqual(detail.json()["data"][field], expected, f"{field} truncated on read")

        # Patch with an even longer body: update must not truncate either.
        grown = {field: value + value for field, value in bodies.items()}
        patch = self.client.patch(self.url(pk), grown, format="json")
        self.assertEqual(patch.status_code, status.HTTP_200_OK, patch.content[:500])
        reread = self.client.get(self.url(pk))
        for field, expected in grown.items():
            self.assertEqual(reread.json()["data"][field], expected, f"{field} truncated on update")
        return pk

    def test_short_article_roundtrip(self):
        self._roundtrip("short", description_en="<p>Hello world</p>", description_fa="<p>سلام دنیا</p>")

    def test_medium_article_roundtrip(self):
        body = "".join(f"<p>{_long_paragraph('en', i)}</p>" for i in range(20))
        self._roundtrip(
            "medium",
            description_en=body,
            description_fa="".join(f"<p>{_long_paragraph('fa', i)}</p>" for i in range(20)),
        )

    def test_long_article_many_headings(self):
        self._roundtrip("long-headings", description_en=_headings_block(40), description_fa=_headings_block(10))

    def test_very_long_article_200k_chars(self):
        chunk = f"<p>{_long_paragraph('en', 0, 400)}</p>"
        body = chunk * 60  # ~200k+ characters of plain paragraphs
        self.assertGreater(len(body), 200_000)
        self._roundtrip("very-long", description_en=body)

    def test_tables_and_code_roundtrip(self):
        code = "<pre><code class=\"language-python\">def hello():\n    return 'world'</code></pre>"
        self._roundtrip(
            "tables-code", description_en=TABLE_HTML + code, description_fa="<p>متن فارسی</p>" + TABLE_HTML
        )

    def test_rtl_persian_article(self):
        body = "".join(f"<h2>بخش {i}</h2><p>{_long_paragraph('fa', i, 120)}</p>" for i in range(15))
        self._roundtrip("rtl-fa", description_fa=body)

    def test_arabic_article(self):
        body = "".join(f"<h2>قسم {i}</h2><p>{_long_paragraph('ar', i, 120)}</p>" for i in range(15))
        self._roundtrip("rtl-ar", description_ar=body)

    def test_mixed_rtl_ltr_article(self):
        mixed = (
            "<p dir=\"rtl\">متن فارسی با <code>inline_code()</code> و English words</p>"
            "<p dir=\"ltr\">English paragraph with <b>bold</b> و واژه فارسی</p>"
        ) * 50
        self._roundtrip("mixed", description_fa=mixed, description_en=mixed)

    def test_invalid_status_rejected(self):
        response = self.client.post(self.url(), self._payload("bad-status", status="banana"), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.json()["errors"])
        self.assertFalse(Article.objects.filter(slug="bad-status").exists())

    def test_delete_returns_bodyless_204(self):
        pk = self._roundtrip("to-delete", description_en="<p>bye</p>")
        response = self.client.delete(self.url(pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(response.content, b"")
