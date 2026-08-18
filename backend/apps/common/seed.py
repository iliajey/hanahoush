"""Demo data seeder (Phase 6.5, content hardened in Phase 9D).

Creates sample content across articles, projects, services and the company
app, tagged by the ``superadmin`` author so ``reset_demo`` can find it.

Content policy (Phase 9D):
- No fabricated named individuals, clients, partners, offices, social
  profiles, milestones or statistics are seeded. Where real-world data is
  unavailable the copy stays generic and professional (demo content), and is
  clearly non-committal about outcomes.
- Testimonials carry no names/companies (anonymized, generic quotes).
- Project clients are generic descriptors (anonymized, e.g. "A manufacturing
  enterprise"), never real-sounding company names.

Localized copy literals make some lines longer than the line-length rule;
this data file opts out of E501 (ruff) for readability.
"""
# ruff: noqa: E501
import logging

from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.articles.models import Article, Category, Tag
from apps.company.models import (
    FAQ,
    AboutPage,
    Office,
    Partner,
    SiteSettings,
    SocialLink,
    TeamMember,
    Testimonial,
    Timeline,
)
from apps.projects.models import Project, ProjectCategory, Technology
from apps.services.models import Service, ServiceSection

logger = logging.getLogger(__name__)

User = get_user_model()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def demo_author():
    """Return a superuser to tag demo content with."""
    return User.objects.filter(is_superuser=True).first()


def demo_users():
    """Return the demo users used as content authors (for reset_demo)."""
    return list(User.objects.filter(is_superuser=True))


# ---------------------------------------------------------------------------
# Articles
# ---------------------------------------------------------------------------
def seed_articles(author):
    categories = [
        ("فناوری", "Technology", "technology", "اخبار و مقالات فناوری اطلاعات."),
        ("کسب و کار", "Business", "business", "مطالب مرتبط با کسب و کار و مدیریت."),
        ("طراحی", "Design", "design", "مقالات طراحی محصول و تجربه کاربری."),
    ]
    category_objs = {}
    for fa, en, slug, desc_fa in categories:
        category_objs[slug], _ = Category.objects.get_or_create(
            slug=slug,
            defaults={"title_fa": fa, "title_en": en, "description_fa": desc_fa},
        )

    tags = [
        ("Django", "django"),
        ("React", "react"),
        ("DevOps", "devops"),
        ("هوش مصنوعی", "ai"),
        ("ERP", "erp"),
        ("طراحی UI", "ui-ux"),
    ]
    tag_objs = []
    for fa, slug in tags:
        tag, _ = Tag.objects.get_or_create(slug=slug, defaults={"title_fa": fa, "title_en": fa})
        tag_objs.append(tag)

    articles = [
        {
            "slug": "demo-digital-transformation",
            "fa": ("تحول دیجیتال در سازمان‌ها", "نگاهی به راه‌های پیاده‌سازی تحول دیجیتال در سازمان‌های ایرانی."),
            "en": ("Digital Transformation in Organizations", "A practical guide to digital transformation."),
            "cat": "technology",
            "tags": ["devops", "erp"],
            "featured": True,
        },
        {
            "slug": "demo-django-rest-framework",
            "fa": ("راهنمای جامع Django REST Framework", "ساخت APIهای امن و مقیاس‌پذیر با جنگو."),
            "en": ("Django REST Framework Guide", "Building secure and scalable APIs with Django."),
            "cat": "technology",
            "tags": ["django", "react"],
            "featured": False,
        },
        {
            "slug": "demo-react-best-practices",
            "fa": ("بهترین روش‌های توسعه با React", "معماری تمیز و کامپوننت‌های قابل استفاده مجدد."),
            "en": ("React Best Practices", "Clean architecture and reusable components."),
            "cat": "design",
            "tags": ["react", "ui-ux"],
            "featured": True,
        },
        {
            "slug": "demo-erp-selection",
            "fa": ("انتخاب سیستم ERP مناسب", "معیارهای انتخاب پیاده‌سازی ERP سازمانی."),
            "en": ("Choosing the Right ERP", "Criteria for selecting an enterprise ERP."),
            "cat": "business",
            "tags": ["erp"],
            "featured": False,
        },
        {
            "slug": "demo-ai-in-business",
            "fa": ("هوش مصنوعی در کسب و کار", "کاربردهای عملی هوش مصنوعی در صنایع مختلف."),
            "en": ("AI in Business", "Practical applications of artificial intelligence."),
            "cat": "business",
            "tags": ["ai"],
            "featured": False,
        },
        {
            "slug": "demo-devops-culture",
            "fa": ("فرهنگ DevOps در تیم‌ها", "استقرار پیوسته و فرهنگ همکاری در تیم‌های نرم‌افزاری."),
            "en": ("DevOps Culture in Teams", "Continuous delivery and collaboration culture."),
            "cat": "technology",
            "tags": ["devops"],
            "featured": False,
        },
    ]

    created = 0
    for item in articles:
        article, was_created = Article.objects.get_or_create(
            slug=item["slug"],
            defaults={
                "title_fa": item["fa"][0],
                "title_en": item["en"][0],
                "short_description_fa": item["fa"][1][:120],
                "short_description_en": item["en"][1][:120],
                "description_fa": item["fa"][1],
                "description_en": item["en"][1],
                "status": "published",
                "is_public": True,
                "is_featured": item["featured"],
                "category": category_objs[item["cat"]],
                "author": author,
                "created_by": author,
                "updated_by": author,
                "published_at": timezone.now(),
            },
        )
        # Backfill published_at on records seeded before Phase 9D so ordering
        # and sitemap lastmod behave correctly.
        if article.published_at is None:
            article.published_at = timezone.now()
            article.save(update_fields=["published_at"])
        if was_created:
            article.tags.set([t for t in tag_objs if t.slug in item["tags"]])
            created += 1
    logger.info("Seeded %d articles.", created)
    return created


def demo_case_study(en_title: str) -> dict:
    """Generic, honest structured case-study content for demo projects.

    Intentionally avoids invented clients, metrics or financial claims —
    the copy is universal so it applies to any demo project.
    """
    return {
        "challenge": {
            "fa": "الزامات پیچیده کسب‌وکار و سیستم‌های قدیمی که تغییر را دشوار می‌کردند.",
            "en": "Complex business requirements and legacy systems that made change slow and risky.",
        },
        "objectives": {
            "fa": "تحویل راه‌حلی مقیاس‌پذیر، قابل نگهداری و دوزبانه که مطابق نیاز واقعی باشد.",
            "en": "Deliver a scalable, maintainable, bilingual solution that fits the real need.",
        },
        "solution_approach": {
            "fa": "معماری ماژولار با تمرکز بر نگهداری‌پذیری و اشتراک تدریجی پیشرفت.",
            "en": "A modular architecture focused on maintainability, with incremental progress shared along the way.",
        },
        "architecture": {
            "description": {
                "fa": "معماری لایه‌ای استاندارد: فرانت‌اند مدرن، API، پایگاه داده و سرویس‌های خارجی.",
                "en": "Standard layered architecture: modern frontend, API, database and external services.",
            },
            "nodes": [
                {"layer": "Frontend", "labels": {"en": ["React", "TypeScript"]}},
                {"layer": "Backend", "labels": {"en": ["Django", "REST API"]}},
                {"layer": "Database", "labels": {"en": ["PostgreSQL"]}},
                {"layer": "Services", "labels": {"en": ["External services"]}},
            ],
        },
        "implementation_stages": [
            {"stage": {"fa": "کشف", "en": "Discovery"}, "detail": {"fa": "کارگاه‌های شناخت نیازمندی‌ها.", "en": "Requirements discovery workshops."}},
            {"stage": {"fa": "معماری", "en": "Architecture"}, "detail": {"fa": "طراحی سیستم و انتخاب فناوری.", "en": "System design and technology selection."}},
            {"stage": {"fa": "توسعه", "en": "Development"}, "detail": {"fa": "اسپرینت‌های چابک با دموی هفتگی.", "en": "Agile sprints with weekly demos."}},
            {"stage": {"fa": "آزمون", "en": "Testing"}, "detail": {"fa": "آزمون unit و پایان‌به‌پایان.", "en": "Unit and end-to-end testing."}},
            {"stage": {"fa": "استقرار", "en": "Deployment"}, "detail": {"fa": "استقرار ابری و نظارت.", "en": "Cloud deployment and monitoring."}},
        ],
        "results": {
            "en": "A dependable, maintainable system delivered through a transparent process — outcome described qualitatively as the project defines it.",
            "fa": "سیستمی مطمئن و قابل نگهداری که با فرآیندی شفاف تحویل شد.",
        },
    }


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------
def seed_projects(author):
    categories = [
        ("توسعه وب", "Web Development", "web"),
        ("اپلیکیشن موبایل", "Mobile", "mobile"),
        ("سیستم‌های سازمانی", "Enterprise", "enterprise"),
    ]
    cat_objs = {}
    for fa, en, slug in categories:
        cat_objs[slug], _ = ProjectCategory.objects.get_or_create(
            slug=slug, defaults={"title_fa": fa, "title_en": en}
        )

    technologies = [
        ("Django", "django", "پایتون"),
        ("React", "react", "جاوااسکریپت"),
        ("PostgreSQL", "postgresql", "پایگاه داده"),
        ("Redis", "redis", "کش"),
        ("TypeScript", "typescript", "جاوااسکریپت"),
        ("Tailwind CSS", "tailwind", "استایل"),
        ("Kubernetes", "kubernetes", "زیرساخت"),
    ]
    tech_objs = []
    for en, slug, fa in technologies:
        tech, _ = Technology.objects.get_or_create(slug=slug, defaults={"title_fa": fa, "title_en": en})
        tech_objs.append(tech)

    projects = [
        {
            "slug": "demo-shop-platform",
            "fa": "پلتفرم فروشگاه آنلاین",
            "en": "Online Shop Platform",
            "client": "یک کسب‌وکار تجارت الکترونیک",
            "client_en": "An e-commerce business",
            "cat": "web",
            "techs": ["django", "react", "postgresql", "redis"],
            "featured": True,
            "start": "2025-01-01",
            "end": "2025-06-01",
        },
        {
            "slug": "demo-erp-system",
            "fa": "سیستم مدیریت منابع سازمانی",
            "en": "Enterprise Resource Planning System",
            "client": "یک شرکت تولیدی",
            "client_en": "A manufacturing enterprise",
            "cat": "enterprise",
            "techs": ["django", "postgresql", "redis", "kubernetes"],
            "featured": True,
            "start": "2024-03-01",
            "end": "2025-03-01",
        },
        {
            "slug": "demo-mobile-app",
            "fa": "اپلیکیشن موبایل خدمات شهری",
            "en": "City Services Mobile App",
            "client": "یک نهاد خدمات عمومی",
            "client_en": "A public services body",
            "cat": "mobile",
            "techs": ["react", "typescript", "django"],
            "featured": False,
            "start": "2025-02-01",
            "end": "2025-08-01",
        },
        {
            "slug": "demo-analytics-dashboard",
            "fa": "داشبورد تحلیلی سازمانی",
            "en": "Enterprise Analytics Dashboard",
            "client": "یک گروه مالی",
            "client_en": "A financial group",
            "cat": "enterprise",
            "techs": ["react", "typescript", "django", "redis"],
            "featured": False,
            "start": "2024-10-01",
            "end": "2025-02-01",
        },
        {
            "slug": "demo-corporate-website",
            "fa": "وب‌سایت سازمانی",
            "en": "Corporate Website Redesign",
            "client": "یک هلدینگ چندبخشی",
            "client_en": "A multi-division holding",
            "cat": "web",
            "techs": ["react", "tailwind", "django"],
            "featured": False,
            "start": "2025-04-01",
            "end": "2025-07-01",
        },
    ]

    created = 0
    for item in projects:
        project, was_created = Project.objects.get_or_create(
            slug=item["slug"],
            defaults={
                "title_fa": item["fa"],
                "title_en": item["en"],
                "description_fa": f"یک مرور اجمالی از «{item['fa']}» و رویکرد مهندسی پشت آن.",
                "description_en": f"An overview of the {item['en']} and the engineering approach behind it.",
                "client": item["client"],
                "category": cat_objs[item["cat"]],
                "status": "published",
                "is_public": True,
                "is_featured": item["featured"],
                "start_date": item["start"],
                "end_date": item["end"],
                "case_study": demo_case_study(item["en"]),
                "created_by": author,
                "updated_by": author,
            },
        )
        if not project.case_study:
            project.case_study = demo_case_study(item["en"])
            project.save(update_fields=["case_study"])
        if was_created:
            project = Project.objects.get(slug=item["slug"])
            project.technologies.set([t for t in tech_objs if t.slug in item["techs"]])
            created += 1
    logger.info("Seeded %d projects.", created)
    return created


# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------
def seed_services(author):
    sections = [
        ("توسعه نرم‌افزار", "Software Development", "software"),
        ("خدمات دیجیتال", "Digital Services", "digital"),
    ]
    section_objs = {}
    for fa, en, slug in sections:
        section_objs[slug], _ = ServiceSection.objects.get_or_create(
            slug=slug, defaults={"title_fa": fa, "title_en": en, "description_fa": f"بخش {fa}."}
        )

    services = [
        ("توسعه وب", "Web Development", "software", "طراحی و توسعه وب‌سایت‌های حرفه‌ای."),
        ("توسعه موبایل", "Mobile Development", "software", "توسعه اپلیکیشن‌های موبایل چندپلتفرمی."),
        ("مشاوره ERP", "ERP Consulting", "digital", "استقرار و پیکربندی سیستم‌های ERP."),
        ("طراحی تجربه کاربری", "UX/UI Design", "digital", "طراحی رابط و تجربه کاربری مدرن."),
    ]
    created = 0
    for fa, en, section_slug, desc in services:
        _, was_created = Service.objects.get_or_create(
            slug=f"demo-{en.lower().replace(' ', '-')}",
            defaults={
                "title_fa": fa,
                "title_en": en,
                "description_fa": desc,
                "description_en": desc,
                "section": section_objs[section_slug],
                "status": "published",
                "is_public": True,
                "created_by": author,
                "updated_by": author,
            },
        )
        created += int(was_created)
    logger.info("Seeded %d services.", created)
    return created


# ---------------------------------------------------------------------------
# Company
# ---------------------------------------------------------------------------
def _purge_demo_company(author):
    """Delete previously-seeded company records that carried fabricated
    people/claims (named testimonials, named team members, milestones,
    invented offices, invented social profiles, invented partners).

    Idempotent: on a re-run of ``bootstrap`` over an existing database this
    removes Phase 6.5-era demo rows so the safer Phase 9D content replaces
    them instead of accumulating alongside them.
    """
    purged = 0
    purged += Testimonial.objects.filter(created_by=author).delete()[0]
    purged += TeamMember.objects.filter(created_by=author).delete()[0]
    purged += Timeline.objects.filter(created_by=author).delete()[0]
    purged += SocialLink.objects.filter(created_by=author).delete()[0]
    purged += Office.objects.filter(created_by=author).delete()[0]
    purged += Partner.objects.filter(created_by=author).delete()[0]
    purged += FAQ.objects.filter(created_by=author).delete()[0]
    if purged:
        logger.info("Purged %d fabricated company demo rows.", purged)
    return purged


def seed_company(author):
    created = 0
    created += _purge_demo_company(author)

    about, about_created = AboutPage.objects.get_or_create(
        slug="demo-about",
        defaults={
            "title_fa": "درباره هانه‌هوش",
            "title_en": "About Hanahoush",
            "description_fa": "هانه‌هوش یک پلتفرم سازمانی برای مدیریت محتوا و فرآیندهای کسب و کار است.",
            "description_en": "Hanahoush is an enterprise platform for content and business process management.",
            "status": "published",
            "is_public": True,
            "mission_fa": "توانمندسازی سازمان‌ها با فناوری روز.",
            "mission_en": "Empowering organizations with modern technology.",
            "vision_fa": "مرجع فناوری سازمانی در منطقه.",
            "vision_en": "The regional reference for enterprise technology.",
            "created_by": author,
            "updated_by": author,
        },
    )
    created += int(about_created)

    # FAQ: real English questions (no more "FAQ 1" placeholders) and
    # coherent localized answers. These describe process, not invented facts.
    faqs = [
        (
            "چه خدماتی ارائه می‌دهید؟",
            "What services do you offer?",
            "خدمات توسعه وب، موبایل، مشاوره و استقرار ERP و طراحی تجربه کاربری.",
            "Web, mobile, ERP consulting and deployment, and UX/UI design services.",
        ),
        (
            "آیا از فناوری ابری پشتیبانی می‌کنید؟",
            "Do you support cloud technology?",
            "بله، استقرار ابری و زیرساخت‌های مقیاس‌پذیر بخشی از فرآیند تحویل ماست.",
            "Yes — cloud deployment and scalable infrastructure are part of our delivery process.",
        ),
        (
            "زمان تحویل پروژه چقدر است؟",
            "How long does a project take?",
            "بسته به پیچیدگی پروژه معمولاً بین ۲ تا ۶ ماه.",
            "Depending on complexity, typically two to six months.",
        ),
        (
            "آیا پشتیبانی پس از تحویل دارید؟",
            "Do you provide support after delivery?",
            "بله، قراردادهای پشتیبانی و نگهداری پس از تحویل ارائه می‌شود.",
            "Yes — support and maintenance agreements are available after delivery.",
        ),
        (
            "امکان سفارشی‌سازی ERP وجود دارد؟",
            "Can the ERP be customized?",
            "بله، سفارشی‌سازی بر اساس نیاز سازمان در محدوده پروژه تعریف می‌شود.",
            "Yes — customization is scoped to the organization's requirements.",
        ),
        (
            "چگونه شروع کنیم؟",
            "How do we get started?",
            "از طریق فرم تماس با ما در ارتباط باشید.",
            "Get in touch through our contact form.",
        ),
    ]
    for i, (q_fa, q_en, a_fa, a_en) in enumerate(faqs, start=1):
        _, was_created = FAQ.objects.get_or_create(
            question_en=q_en,
            defaults={
                "question_fa": q_fa,
                "answer_fa": a_fa,
                "answer_en": a_en,
                "sort_order": i,
                "created_by": author,
                "updated_by": author,
            },
        )
        created += int(was_created)

    # Partners section = technology platforms our teams build with. These are
    # honest statements about our stack, not invented business partnerships.
    platforms = [
        ("Python / Django", "python-django", "اکوسیستم پایتون و جنگو برای توسعه وب.", "The Python & Django ecosystem for web development."),
        ("React", "react", "کتابخانه رابط کاربری React.", "The React user-interface library."),
        ("PostgreSQL", "postgresql", "پایگاه داده متن‌باز PostgreSQL.", "The PostgreSQL open-source database."),
        ("Kubernetes", "kubernetes", "ارکستراسیون کانتینر با Kubernetes.", "Container orchestration with Kubernetes."),
        ("Docker", "docker", "کانتینری‌سازی و استقرار با Docker.", "Containerization and deployment with Docker."),
    ]
    for i, (name, _key, desc_fa, desc_en) in enumerate(platforms, start=1):
        _, was_created = Partner.objects.get_or_create(
            name=name,
            defaults={
                "description_fa": desc_fa,
                "description_en": desc_en,
                "sort_order": i,
                "created_by": author,
                "updated_by": author,
            },
        )
        created += int(was_created)

    # Team, timeline, offices, social links and named testimonials are NOT
    # seeded: real data would be required. (See _purge_demo_company above.)

    # Testimonials: anonymized, generic quotes — no names, no companies, no
    # invented business outcomes. Clearly demo/representative content.
    testimonials = [
        (
            "مدیر فنی — بخش تولید",
            "A technical manager in manufacturing",
            "تجربه همکاری شفاف با تیم مهندسی هانه‌هوش؛ پیشرفت در هر مرحله قابل مشاهده بود.",
            "A transparent engagement with the Hanahoush engineering team — progress was visible at every step.",
        ),
        (
            "مدیر محصول — شرکت نرم‌افزاری",
            "A product manager at a software company",
            "رویکرد منظم در کشف نیازمندی‌ها و تحویل مرحله‌به‌مرحله، ریسک پروژه را کم کرد.",
            "A disciplined approach to requirements discovery and staged delivery reduced project risk.",
        ),
        (
            "مدیر اجرایی — سازمان خدماتی",
            "An executive at a services organization",
            "همکاری قابل اتکا با تمرکز بر نتیجه و کیفیت؛ ارتباط مداوم در طول پروژه.",
            "A dependable engagement focused on outcomes and quality, with continuous communication throughout.",
        ),
        (
            "مسئول دیجیتال — خرده‌فروشی",
            "A digital lead at a retail business",
            "تحویل به‌موقع و مستندسازی خوب؛ تجربه‌ای قابل اطمینان.",
            "On-time delivery and good documentation — a reliable experience.",
        ),
    ]
    for i, (name, _role_en, content_fa, content_en) in enumerate(testimonials, start=1):
        _, was_created = Testimonial.objects.get_or_create(
            author_name=name,
            defaults={
                "author_role": "",
                "company": "",
                "content_fa": content_fa,
                "content_en": content_en,
                "rating": 5,
                "is_featured": True,
                "sort_order": i,
                "created_by": author,
                "updated_by": author,
            },
        )
        created += int(was_created)

    if not SiteSettings.objects.exists():
        # No placeholder contact channels: real email/phone can be set in the
        # admin once known. Empty values keep the site from showing invented
        # contact details.
        SiteSettings.objects.create(
            site_name="Hanahoush",
            contact_email="",
            contact_phone="",
            default_locale="fa",
            supported_locales=["fa", "en", "ar"],
            created_by=author,
            updated_by=author,
        )
        created += 1

    logger.info("Seeded %d company records.", created)
    return created


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------
def seed_demo_data() -> dict:
    """Seed all demo content and return a per-domain count map."""
    author = demo_author() or User.objects.filter(is_superuser=True).first()
    if author is None:
        logger.warning("No superuser available to author demo content.")
        return {}
    counts = {
        "articles": seed_articles(author),
        "projects": seed_projects(author),
        "services": seed_services(author),
        "company": seed_company(author),
    }
    return counts


def clear_demo_data() -> dict:
    """Delete content authored by demo users (used by reset_demo)."""
    from django.db import transaction

    authors = demo_users()
    counts = {}
    with transaction.atomic():
        counts["articles"] = Article.objects.filter(created_by__in=authors).delete()[0]
        counts["projects"] = Project.objects.filter(created_by__in=authors).delete()[0]
        counts["services"] = Service.objects.filter(created_by__in=authors).delete()[0]
        counts["company"] = (
            AboutPage.objects.filter(created_by__in=authors).delete()[0]
            + FAQ.objects.filter(created_by__in=authors).delete()[0]
            + Partner.objects.filter(created_by__in=authors).delete()[0]
            + TeamMember.objects.filter(created_by__in=authors).delete()[0]
            + Testimonial.objects.filter(created_by__in=authors).delete()[0]
            + Office.objects.filter(created_by__in=authors).delete()[0]
            + Timeline.objects.filter(created_by__in=authors).delete()[0]
            + SocialLink.objects.filter(created_by__in=authors).delete()[0]
        )
    return counts
