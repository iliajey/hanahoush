"""Page Builder demo seed (idempotent).

Creates the section registry, the default navigation menu, footer,
announcement bar, hero configuration, site-wide SEO and the composed "home"
page with its ordered sections.

Localized copy literals make some lines longer than the line-length rule;
this data file opts out of E501 (ruff) for readability.
"""
# ruff: noqa: E501
import logging

from apps.company.models import SiteSettings
from apps.core.models import Status

from .models import (
    SECTION_TYPES,
    AnnouncementBar,
    FooterConfiguration,
    HeroConfiguration,
    NavigationItem,
    NavigationMenu,
    Page,
    PageSection,
    SectionConfiguration,
    SEOConfiguration,
)

logger = logging.getLogger(__name__)


def _sync_section(page, section_type, order, config):
    """Create or refresh a page section from canonical seed copy.

    Phase 9D: bootstrap now syncs seeded section configuration so copy
    refinements actually reach an already-seeded database. The seeder
    remains idempotent — repeated runs converge on the same content.
    """
    section, created = PageSection.objects.update_or_create(
        page=page,
        section_type=section_type,
        defaults={
            "sort_order": order,
            "is_enabled": True,
            "config": config,
            "language_overrides": {},
        },
    )
    return section, int(created)

HOMEPAGE_COPY = {
    "hero": {
        "headline": {
            "fa": "نرم‌افزار سازمانی، مهندسی‌شده مانند یک محصول.",
            "en": "Enterprise software, engineered like a product.",
            "ar": "برمجيات مؤسسية مُهندَسة كمنتج.",
        },
        "subtitle": {
            "fa": "ERP، هوش مصنوعی، اپلیکیشن‌های وب، پیاده‌سازی Odoo و خدمات برنامه‌نویسی — دوزبانه، ابری و مهندسی‌شده تا استاندارد تولید.",
            "en": "ERP, AI, web applications, Odoo and programming services — bilingual, cloud-native and engineered to a production standard.",
            "ar": "ERP والذكاء الاصطناعي وتطبيقات الويب وتنفيذ Odoo وخدمات البرمجة — ثنائية اللغة وسحابية ومُهندَسة بمعايير الإنتاج.",
        },
        "primary": {"label": {"fa": "شروع پروژه", "en": "Start a project", "ar": "ابدأ مشروعاً"}, "href": "/contact"},
        "secondary": {"label": {"fa": "مشاهده خدمات", "en": "Explore services", "ar": "استكشف الخدمات"}, "href": "/services"},
        "align": "center",
        "show_grid": True,
        "show_mesh": True,
        "show_particles": False,
    },
    "statistics": {
        "eyebrow": {"fa": "در یک نگاه", "en": "By the numbers", "ar": "بالأرقام"},
        "title": {"fa": "مهندسی که نتیجه می‌سازد.", "en": "Engineering that delivers.", "ar": "هندسة تحقق النتائج."},
        "description": {
            "fa": "آمار زنده از پلتفرم محتوای هانه‌هوش.",
            "en": "Live statistics pulled from the Hanahoush content platform.",
            "ar": "إحصاءات حية من منصة محتوى هاناهوش.",
        },
        "labels": {
            "projects": {"fa": "پروژه‌های تحویل‌شده", "en": "Projects delivered", "ar": "مشاريع أُنجزت"},
            "articles": {"fa": "مقالات منتشرشده", "en": "Published articles", "ar": "مقالات منشورة"},
        },
    },
    "services": {
        "eyebrow": {"fa": "چه کاری انجام می‌دهیم", "en": "What we do", "ar": "ماذا نقدم"},
        "title": {"fa": "خدمات ما.", "en": "Our services.", "ar": "خدماتنا."},
        "description": {"fa": "تحویل کامل — از معماری تا استقرار.", "en": "Delivered end-to-end — from architecture to deployment.", "ar": "خدمات متكاملة — من البنية إلى النشر."},
        "page_size": 20,
    },
    "projects": {
        "eyebrow": {"fa": "کارهای ما", "en": "Our work", "ar": "أعمالنا"},
        "title": {"fa": "پروژه‌های شاخص.", "en": "Featured projects.", "ar": "مشاريع مميزة."},
        "description": {"fa": "هر پروژه یک همکاری است.", "en": "Every project is a partnership.", "ar": "كل مشروع شراكة."},
        "featured": True,
        "limit": 3,
    },
    "articles": {
        "eyebrow": {"fa": "یادداشت‌ها", "en": "Insights", "ar": "رؤى"},
        "title": {"fa": "آخرین مقالات.", "en": "Latest articles.", "ar": "أحدث المقالات."},
        "description": {"fa": "مقاله‌ها و راهنماهای مهندسی.", "en": "Essays and guides on our engineering.", "ar": "مقالات وأدلة حول هندستنا."},
        "featured": True,
        "limit": 3,
    },
    "about": {
        "eyebrow": {"fa": "درباره هانه‌هوش", "en": "About Hanahoush", "ar": "عن هاناهوش"},
        "title": {"fa": "ماموریت و چشم‌انداز ما.", "en": "Our mission and vision.", "ar": "رسالتنا ورؤيتنا."},
        "description": {"fa": "چرا می‌سازیم.", "en": "Why we build.", "ar": "لماذا نبني."},
    },
    "team": {
        "eyebrow": {"fa": "تیم", "en": "The team", "ar": "الفريق"},
        "title": {"fa": "افراد پشت پلتفرم.", "en": "People behind the platform.", "ar": "الأشخاص خلف المنصة."},
        "description": {"fa": "مهندسان، طراحان و اپراتورها.", "en": "Engineers, designers and operators.", "ar": "مهندسون ومصممون ومشغلون."},
        "limit": 6,
    },
    "timeline": {
        "eyebrow": {"fa": "داستان ما", "en": "Our story", "ar": "قصتنا"},
        "title": {"fa": "نقاط عطف.", "en": "Milestones.", "ar": "معالم."},
        "description": {"fa": "تاریخچه‌ای کوتاه از هانه‌هوش.", "en": "A short history of Hanahoush.", "ar": "تاريخ موجز لهاناهوش."},
    },
    "testimonials": {
        "eyebrow": {"fa": "صدای مشتریان", "en": "Client voices", "ar": "يثق بنا عملاؤنا"},
        "title": {"fa": "نظرات مشتریان.", "en": "What our clients say.", "ar": "ماذا يقول عملاؤنا."},
        "description": {"fa": "همکاری‌های بلندمدت.", "en": "Long-term partnerships.", "ar": "شراكات طويلة."},
        "featured": True,
        "limit": 3,
    },
    "partners": {
        "eyebrow": {"fa": "اکوسیستم", "en": "Ecosystem", "ar": "النظام البيئي"},
        "title": {"fa": "همکاران و پلتفرم‌ها.", "en": "Partners and platforms.", "ar": "شركاء ومنصات."},
        "description": {"fa": "سازمان‌هایی که با آن‌ها کار می‌کنیم.", "en": "The organisations we work with.", "ar": "المنظمات التي نعمل معها."},
    },
    "faq": {
        "eyebrow": {"fa": "سوالات متداول", "en": "FAQ", "ar": "الأسئلة الشائعة"},
        "title": {"fa": "سوالاتی که ممکن است داشته باشید.", "en": "Questions you might have.", "ar": "أسئلة قد تدور في ذهنك."},
        "description": {"fa": "همه‌چیز درباره فرآیند و پشتیبانی.", "en": "Everything about our process and support.", "ar": "كل ما يخص عمليتنا ودعمنا."},
        "page_size": 20,
    },
    "cta": {
        "title": {"fa": "آماده‌اید چیزی فوق‌العاده بسازید؟", "en": "Ready to build something exceptional?", "ar": "مستعد لبناء شيء استثنائي؟"},
        "description": {
            "fa": "تیم مهندسی ما آماده گفتگو درباره پروژه شماست.",
            "en": "Our engineering team is ready to discuss your project.",
            "ar": "فريقنا الهندسي جاهز لمناقشة مشروعك.",
        },
        "primary": {"label": {"fa": "شروع پروژه", "en": "Start a project", "ar": "ابدأ مشروعاً"}, "href": "/contact"},
        "secondary": {"label": {"fa": "گفتگو با مهندسان", "en": "Talk to engineering", "ar": "تحدث إلى فريق الهندسة"}, "href": "/contact"},
    },
}

SECTION_META = {
    "hero": ("Hero", "Animated hero with headline, subtitle and CTAs.", "Sparkles"),
    "statistics": ("Statistics", "Live counters derived from API content.", "BarChart3"),
    "services": ("Services", "Published services grid (or curated core services).", "Layers"),
    "erp": ("ERP (hanRP)", "hanRP product features + module status.", "Cpu"),
    "projects": ("Projects", "Featured portfolio projects.", "FolderGit2"),
    "articles": ("Articles", "Featured article cards.", "FileText"),
    "about": ("About", "Mission and vision.", "Info"),
    "team": ("Team", "Team members.", "Users"),
    "timeline": ("Timeline", "Company milestones.", "Milestone"),
    "partners": ("Partners", "Partner logo marquee.", "Handshake"),
    "testimonials": ("Testimonials", "Client quotes.", "MessageSquareQuote"),
    "faq": ("FAQ", "Accordion FAQ.", "CircleHelp"),
    "cta": ("CTA", "Call to action band.", "Megaphone"),
    "footer": ("Footer", "Footer column + socials.", "PanelBottom"),
    "journey": ("Service Journey", "Problem → Solution → Technology → Result storytelling.", "Route"),
    "comparison": ("Comparison", "Traditional solutions vs the Hanahoush approach.", "Scale"),
    "stack": ("Technology Stack", "Animated technology showcase.", "Cpu"),
    "process": ("Process", "Delivery process steps.", "ListChecks"),
    "featured_projects": ("Featured Projects", "Editorial-style featured portfolio.", "FolderGit2"),
    "project_filters": ("Project Discovery", "Category / technology / year filters + search.", "Filter"),
    "technology_explorer": ("Technology Explorer", "Explore projects by technology.", "Cpu"),
    "projects_timeline": ("Project Timeline", "Portfolio evolution over time.", "Milestone"),
    "case_hero": ("Case Study Hero", "Project title, category, year, tech, hero image.", "BookOpen"),
    "case_challenge": ("Case Study Challenge", "The problem, who had it and the constraints.", "AlertCircle"),
    "case_objectives": ("Case Study Objectives", "Project goals.", "Target"),
    "case_solution": ("Case Study Solution", "The Hanahoush approach.", "Lightbulb"),
    "case_architecture": ("Case Study Architecture", "Architecture visualization (CMS-driven).", "Network"),
    "case_technology": ("Case Study Technology", "Project technology stack.", "Cpu"),
    "case_journey": ("Case Study Journey", "Implementation stages.", "Route"),
    "case_gallery": ("Case Study Gallery", "Project image gallery with lightbox.", "Images"),
    "case_results": ("Case Study Results", "Outcomes and impact (CMS-driven).", "BarChart3"),
    "case_related_projects": ("Case Study Related Projects", "Projects by category/technology overlap.", "FolderGit2"),
    "case_related_articles": ("Case Study Related Articles", "Related articles from the CMS.", "FileText"),
    "case_cta": ("Case Study CTA", "Final call to action.", "Megaphone"),
    "articles_hero": ("Articles Hero", "Editorial hub heading + search.", "Newspaper"),
    "featured_article": ("Featured Article", "One dominant editorial article.", "BookMarked"),
    "latest_articles": ("Latest Articles", "Responsive editorial grid.", "Files"),
    "article_filters": ("Article Discovery", "Search / category / tag / sort + grid.", "Filter"),
    "category_explorer": ("Category Explorer", "Article categories from the CMS.", "FolderTree"),
    "tag_explorer": ("Tag Explorer", "Technical topics from the CMS.", "Tags"),
    "newsletter_cta": ("Newsletter CTA", "Premium newsletter subscription.", "Mail"),
    "article_cta": ("Article CTA", "Contextual call to action.", "Megaphone"),
    "article_hero": ("Article Hero", "Title, meta, cover for a single article.", "BookOpen"),
    "article_content": ("Article Content", "Safe body render + TOC + reading progress.", "AlignLeft"),
    "article_related": ("Article Related Content", "Related articles / projects / services.", "Link2"),
    "company_story": ("Company Story", "Company narrative from the CMS about page.", "Landmark"),
    "values": ("Company Values", "Core values (CMS-configurable).", "Heart"),
    "offices": ("Offices", "Physical office locations.", "MapPin"),
    "social_links": ("Social Links", "Social links from the CMS.", "Share2"),
    "contact_form": ("Contact Form", "Production contact/inquiry form.", "MailQuestion"),
}


def seed_section_registry():
    created = 0
    for code, _label in SECTION_TYPES:
        name, description, icon = SECTION_META[code]
        obj, was_created = SectionConfiguration.objects.get_or_create(
            section_type=code,
            defaults={
                "name": name,
                "description": description,
                "icon": icon,
                "default_config": HOMEPAGE_COPY.get(code, {}),
                "available_locales": ["fa", "en", "ar"],
            },
        )
        created += int(was_created)
    logger.info("Seeded %d section configurations.", created)
    return created


def seed_navigation():
    menu, was_created = NavigationMenu.objects.get_or_create(
        code="main",
        defaults={"name": "Main", "is_default": True, "settings": {"sticky": True}},
    )
    NavigationMenu.objects.filter(is_default=True).exclude(pk=menu.pk).update(is_default=False)
    menu.is_default = True
    menu.save(update_fields=["is_default"])
    created = int(was_created)

    items = [
        ("home", {"fa": "خانه", "en": "Home", "ar": "الرئيسية"}, "/", None, 1, False),
        ("services", {"fa": "خدمات", "en": "Services", "ar": "الخدمات"}, "/services", None, 2, False),
        ("projects", {"fa": "پروژه‌ها", "en": "Projects", "ar": "المشاريع"}, "/projects", None, 3, False),
        ("articles", {"fa": "مقالات", "en": "Articles", "ar": "المقالات"}, "/articles", None, 4, False),
        ("about", {"fa": "درباره ما", "en": "About", "ar": "من نحن"}, "/about", None, 5, False),
        ("contact", {"fa": "تماس با ما", "en": "Contact", "ar": "اتصل بنا"}, "/contact", None, 6, True),
    ]
    for _code, labels, url, _page, sort_order, highlight in items:
        obj, item_created = NavigationItem.objects.get_or_create(
            menu=menu,
            url=url,
            defaults={
                "label_fa": labels["fa"],
                "label_en": labels["en"],
                "label_ar": labels["ar"],
                "sort_order": sort_order,
                "is_highlight": highlight,
                "is_enabled": True,
            },
        )
        created += int(item_created)
    return created


def seed_footer():
    created = 0
    config, was_created = FooterConfiguration.objects.get_or_create(
        pk=1,
        defaults={
            "copyright_fa": "© هانه‌هوش. همه حقوق محفوظ است.",
            "copyright_en": "© Hanahoush. All rights reserved.",
            "copyright_ar": "© هاناهوش. جميع الحقوق محفوظة.",
            "show_socials": False,
            "show_newsletter": False,
            "columns": [
                {
                    "title": {"fa": "شرکت", "en": "Company", "ar": "الشركة"},
                    "links": [
                        {"label": {"fa": "درباره ما", "en": "About", "ar": "من نحن"}, "href": "/about"},
                        {"label": {"fa": "پروژه‌ها", "en": "Projects", "ar": "المشاريع"}, "href": "/projects"},
                        {"label": {"fa": "تماس", "en": "Contact", "ar": "اتصل"}, "href": "/contact"},
                        {"label": {"fa": "مقالات", "en": "Articles", "ar": "المقالات"}, "href": "/articles"},
                    ],
                },
                {
                    "title": {"fa": "خدمات", "en": "Services", "ar": "الخدمات"},
                    "links": [
                        {"label": {"fa": "توسعه وب", "en": "Web Development", "ar": "تطوير الويب"}, "href": "/services"},
                        {"label": {"fa": "مشاوره ERP", "en": "ERP Consulting", "ar": "استشارات ERP"}, "href": "/services"},
                        {"label": {"fa": "هوش مصنوعی", "en": "Artificial Intelligence", "ar": "الذكاء الاصطناعي"}, "href": "/services"},
                    ],
                },
                {
                    "title": {"fa": "منابع", "en": "Resources", "ar": "الموارد"},
                    "links": [
                        {"label": {"fa": "خدمات ما", "en": "Our services", "ar": "خدماتنا"}, "href": "/services"},
                        {"label": {"fa": "پروژه‌ها", "en": "Case studies", "ar": "دراسات الحالة"}, "href": "/projects"},
                        {"label": {"fa": "جستجو", "en": "Search", "ar": "البحث"}, "href": "/search"},
                    ],
                },
            ],
        },
    )
    # Idempotent backfill for databases seeded before Phase 9D: never point the
    # footer at routes that don't exist (/privacy, /terms, /faq) and don't show
    # fabricated social profiles.
    config.show_socials = False
    config.columns = [
        {
            "title": {"fa": "شرکت", "en": "Company", "ar": "الشركة"},
            "links": [
                {"label": {"fa": "درباره ما", "en": "About", "ar": "من نحن"}, "href": "/about"},
                {"label": {"fa": "پروژه‌ها", "en": "Projects", "ar": "المشاريع"}, "href": "/projects"},
                {"label": {"fa": "تماس", "en": "Contact", "ar": "اتصل"}, "href": "/contact"},
                {"label": {"fa": "مقالات", "en": "Articles", "ar": "المقالات"}, "href": "/articles"},
            ],
        },
        {
            "title": {"fa": "خدمات", "en": "Services", "ar": "الخدمات"},
            "links": [
                {"label": {"fa": "توسعه وب", "en": "Web Development", "ar": "تطوير الويب"}, "href": "/services"},
                {"label": {"fa": "مشاوره ERP", "en": "ERP Consulting", "ar": "استشارات ERP"}, "href": "/services"},
                {"label": {"fa": "هوش مصنوعی", "en": "Artificial Intelligence", "ar": "الذكاء الاصطناعي"}, "href": "/services"},
            ],
        },
        {
            "title": {"fa": "منابع", "en": "Resources", "ar": "الموارد"},
            "links": [
                {"label": {"fa": "خدمات ما", "en": "Our services", "ar": "خدماتنا"}, "href": "/services"},
                {"label": {"fa": "پروژه‌ها", "en": "Case studies", "ar": "دراسات الحالة"}, "href": "/projects"},
                {"label": {"fa": "جستجو", "en": "Search", "ar": "البحث"}, "href": "/search"},
            ],
        },
    ]
    config.save(update_fields=["show_socials", "columns"])
    created += int(was_created)
    return created


def seed_announcement():
    bar, was_created = AnnouncementBar.objects.get_or_create(
        pk=1,
        defaults={
            "text_fa": "🎉 نسخه جدید هانه‌هوش منتشر شد.",
            "text_en": "A new Hanahoush release is live.",
            "text_ar": "تم إطلاق إصدار جديد من هاناهوش.",
            "link": "/articles",
            "link_label_fa": "مشاهده",
            "link_label_en": "Read more",
            "link_label_ar": "اقرأ المزيد",
            "is_enabled": False,
            "dismissible": True,
        },
    )
    return int(was_created)


def seed_hero():
    config, was_created = HeroConfiguration.objects.update_or_create(
        pk=1,
        defaults={
            "headline_fa": HOMEPAGE_COPY["hero"]["headline"]["fa"],
            "headline_en": HOMEPAGE_COPY["hero"]["headline"]["en"],
            "headline_ar": HOMEPAGE_COPY["hero"]["headline"]["ar"],
            "subtitle_fa": HOMEPAGE_COPY["hero"]["subtitle"]["fa"],
            "subtitle_en": HOMEPAGE_COPY["hero"]["subtitle"]["en"],
            "subtitle_ar": HOMEPAGE_COPY["hero"]["subtitle"]["ar"],
            "primary_cta_label_fa": HOMEPAGE_COPY["hero"]["primary"]["label"]["fa"],
            "primary_cta_label_en": HOMEPAGE_COPY["hero"]["primary"]["label"]["en"],
            "primary_cta_label_ar": HOMEPAGE_COPY["hero"]["primary"]["label"]["ar"],
            "primary_cta_url": HOMEPAGE_COPY["hero"]["primary"]["href"],
            "secondary_cta_label_fa": HOMEPAGE_COPY["hero"]["secondary"]["label"]["fa"],
            "secondary_cta_label_en": HOMEPAGE_COPY["hero"]["secondary"]["label"]["en"],
            "secondary_cta_label_ar": HOMEPAGE_COPY["hero"]["secondary"]["label"]["ar"],
            "secondary_cta_url": HOMEPAGE_COPY["hero"]["secondary"]["href"],
            "align": "center",
            "show_grid": True,
            "show_mesh": True,
            "show_particles": False,
        },
    )
    return int(was_created)


def seed_seo():
    seo, was_created = SEOConfiguration.objects.get_or_create(
        page__isnull=True,
        defaults={
            "meta_title_fa": "هانه‌هوش — پلتفرم سازمانی",
            "meta_title_en": "Hanahoush — Enterprise Platform",
            "meta_title_ar": "هاناهوش — منصة المؤسسات",
            "meta_description_fa": "نرم‌افزار سازمانی، ERP، هوش مصنوعی و خدمات برنامه‌نویسی.",
            "meta_description_en": "Enterprise software, ERP, AI and programming services.",
            "meta_description_ar": "برمجيات المؤسسات، ERP والذكاء الاصطناعي وخدمات البرمجة.",
            "meta_keywords": "ERP, enterprise, hanahoush, odoo, ai",
            "canonical_url": "",
            "robots": "index,follow",
        },
    )
    return int(was_created)


def seed_home_page():
    page, was_created = Page.objects.get_or_create(
        slug="home",
        defaults={
            "title_fa": "خانه",
            "title_en": "Home",
            "title_ar": "الرئيسية",
            "status": Status.PUBLISHED,
            "is_home": True,
            "template": "default",
            "version": 1,
        },
    )
    Page.objects.filter(is_home=True).exclude(pk=page.pk).update(is_home=False)
    page.is_home = True
    page.status = Status.PUBLISHED
    page.save(update_fields=["is_home", "status"])

    created = int(was_created)
    order = 0
    # Homepage composition (Phase 9D): only sections backed by honest,
    # non-fabricated demo content. Team / timeline / testimonials / partners
    # sections are intentionally not composed until real data exists.
    for section_type in [
        "hero",
        "statistics",
        "services",
        "projects",
        "articles",
        "about",
        "faq",
        "cta",
    ]:
        order += 1
        _, section_created = _sync_section(page, section_type, order, HOMEPAGE_COPY.get(section_type, {}))
        created += section_created

    seo, seo_created = SEOConfiguration.objects.get_or_create(
        page=page,
        defaults={
            "meta_title_fa": "هانه‌هوش — پلتفرم سازمانی",
            "meta_title_en": "Hanahoush — Enterprise Platform",
            "meta_title_ar": "هاناهوش — منصة المؤسسات",
            "meta_description_fa": "نرم‌افزار سازمانی، ERP و خدمات برنامه‌نویسی.",
            "meta_description_en": "Enterprise software, ERP and programming services.",
            "meta_description_ar": "برمجيات المؤسسات وخدمات البرمجة.",
            "meta_keywords": "ERP, hanahoush, enterprise",
            "robots": "index,follow",
        },
    )
    created += int(seo_created)

    # Ensure the site settings singleton exists (hero eyebrow fallback).
    SiteSettings.get_settings()
    return created


SERVICES_PAGE_COPY = {
    "hero": {
        "eyebrow": {"fa": "خدمات هانه‌هوش", "en": "Hanahoush Services", "ar": "خدمات هاناهوش"},
        "headline": {
            "fa": "خدماتی که مانند محصول مهندسی می‌شوند.",
            "en": "Services engineered like a product.",
            "ar": "خدمات مُهندَسة كمنتج.",
        },
        "subtitle": {
            "fa": "از استراتژی تا استقرار — نرم‌افزار سازمانی، ERP، Odoo، هوش مصنوعی و مهندسی وب.",
            "en": "From strategy to deployment — enterprise software, ERP, Odoo, AI and web engineering.",
            "ar": "من الاستراتيجية إلى النشر — برمجيات المؤسسات وERP وOdoo والذكاء الاصطناعي وهندسة الويب.",
        },
        "primary": {"label": {"fa": "شروع پروژه", "en": "Start a project", "ar": "ابدأ مشروعاً"}, "href": "/contact"},
        "secondary": {"label": {"fa": "مشاهده فرآیند", "en": "See our process", "ar": "اطلع على منهجيتنا"}, "href": "/services#process"},
        "align": "center",
        "show_grid": True,
        "show_mesh": True,
        "show_particles": False,
    },
    "journey": {
        "eyebrow": {"fa": "سفر مشتری", "en": "The journey", "ar": "الرحلة"},
        "title": {"fa": "از مشکل تا نتیجه.", "en": "From problem to result.", "ar": "من المشكلة إلى النتيجة."},
        "description": {
            "fa": "چهار گام برای تحویل راه‌حلی که کار می‌کند.",
            "en": "Four steps to a solution that actually works.",
            "ar": "أربع خطوات نحو حل يعمل فعلاً.",
        },
        "steps": [
            {"key": "problem", "icon": "alert", "title": {"fa": "مشکل", "en": "Problem", "ar": "المشكلة"}, "body": {"fa": "ما کسب‌وکارتان را تحلیل می‌کنیم تا ریشه مشکل را پیدا کنیم، نه فقط علائم.", "en": "We analyse your business to find the root problem, not just the symptoms.", "ar": "نحلل أعمالك لنكتشف جذر المشكلة، لا أعراضها فقط."}},
            {"key": "solution", "icon": "lightbulb", "title": {"fa": "راه‌حل", "en": "Solution", "ar": "الحل"}, "body": {"fa": "معماری و نقشه راه متناسب با مقیاس و اهداف شما طراحی می‌کنیم.", "en": "We design an architecture and roadmap matched to your scale and goals.", "ar": "نصمم بنية وخارطة طريق تتوافق مع حجمك وأهدافك."}},
            {"key": "technology", "icon": "cpu", "title": {"fa": "فناوری", "en": "Technology", "ar": "التقنية"}, "body": {"fa": "فقط فناوری ثابت‌شده و متناسب را انتخاب می‌کنیم — هیچ ابزار شیک بی‌فایده‌ای.", "en": "We choose only proven, fit-for-purpose technology — no useless shiny tooling.", "ar": "نختار فقط التقنيات المثبتة والملائمة — لا أدوات ترفيهية عديمة الفائدة."}},
            {"key": "result", "icon": "trending", "title": {"fa": "نتیجه", "en": "Result", "ar": "النتيجة"}, "body": {"fa": "تحویل قابل اندازه‌گیری: سریع‌تر، مطمئن‌تر و مقیاس‌پذیرتر.", "en": "Delivery you can measure — faster, more reliable, more scalable.", "ar": "تسليم قابل للقياس — أسرع وأكثر موثوقية وقابلية للتوسع."}},
        ],
    },
    "core_services": {
        "eyebrow": {"fa": "چه کاری انجام می‌دهیم", "en": "What we do", "ar": "ماذا نفعل"},
        "title": {"fa": "خدمات اصلی.", "en": "Core services.", "ar": "الخدمات الأساسية."},
        "description": {
            "fa": "هفت رشته که یک محصول کامل را ساختند.",
            "en": "Seven disciplines that ship one cohesive product.",
            "ar": "سبع تخصصات تصنع منتجاً متكاملاً واحداً.",
        },
        "items": [
            {"icon": "code", "title": {"fa": "توسعه نرم‌افزار", "en": "Software Development", "ar": "تطوير البرمجيات"}, "tags": ["Python", "Django", "React", "TypeScript"], "cta": {"label": {"fa": "جزئیات", "en": "Learn more", "ar": "اعرف المزيد"}, "href": "/contact"}},
            {"icon": "layers", "title": {"fa": "ERP", "en": "ERP", "ar": "ERP"}, "tags": ["hanRP", "Finance", "Procurement", "HR"], "cta": {"label": {"fa": "جزئیات", "en": "Learn more", "ar": "اعرف المزيد"}, "href": "/contact"}},
            {"icon": "cpu", "title": {"fa": "hanRP", "en": "hanRP", "ar": "hanRP"}, "tags": ["Modular", "Bilingual", "Cloud"], "cta": {"label": {"fa": "جزئیات", "en": "Learn more", "ar": "اعرف المزيد"}, "href": "/contact"}},
            {"icon": "settings", "title": {"fa": "Odoo", "en": "Odoo", "ar": "Odoo"}, "tags": ["Implementation", "Custom modules", "Training"], "cta": {"label": {"fa": "جزئیات", "en": "Learn more", "ar": "اعرف المزيد"}, "href": "/contact"}},
            {"icon": "bot", "title": {"fa": "هوش مصنوعی", "en": "AI Automation", "ar": "أتمتة الذكاء الاصطناعي"}, "tags": ["LLM", "NLP", "RAG", "Predictive"], "cta": {"label": {"fa": "جزئیات", "en": "Learn more", "ar": "اعرف المزيد"}, "href": "/contact"}},
            {"icon": "globe", "title": {"fa": "اپلیکیشن‌های وب", "en": "Web Applications", "ar": "تطبيقات الويب"}, "tags": ["React", "Django", "PWA"], "cta": {"label": {"fa": "جزئیات", "en": "Learn more", "ar": "اعرف المزيد"}, "href": "/contact"}},
            {"icon": "zap", "title": {"fa": "مشاوره برنامه‌نویسی", "en": "Programming Consulting", "ar": "استشارات البرمجة"}, "tags": ["Audit", "Staff aug", "Mentoring"], "cta": {"label": {"fa": "جزئیات", "en": "Learn more", "ar": "اعرف المزيد"}, "href": "/contact"}},
        ],
    },
    "comparison": {
        "eyebrow": {"fa": "چرا هانه‌هوش", "en": "The difference", "ar": "الفرق"},
        "title": {"fa": "راه‌حل‌های سنتی در برابر رویکرد هانه‌هوش.", "en": "Traditional vs the Hanahoush approach.", "ar": "الحلول التقليدية مقابل نهج هاناهوش."},
        "columns": [
            {"label": {"fa": "راه‌حل سنتی", "en": "Traditional", "ar": "التقليدي"}},
            {"label": {"fa": "رویکرد هانه‌هوش", "en": "Hanahoush", "ar": "هاناهوش"}},
        ],
        "rows": [
            {"factor": {"fa": "معماری", "en": "Architecture", "ar": "البنية"}, "traditional": {"fa": "یک‌پارچه، سخت‌تغییر", "en": "Monolithic, hard to change", "ar": "متجانسة وصعبة التغيير"}, "hanahoush": {"fa": "مؤلفه‌محور و مقیاس‌پذیر", "en": "Modular and scalable", "ar": "معيارية وقابلة للتوسع"}},
            {"factor": {"fa": "زمان تحویل", "en": "Time to market", "ar": "الوقت"}, "traditional": {"fa": "ماه‌ها، سیلوهای تیمی", "en": "Months, siloed teams", "ar": "أشهر وفرق معزولة"}, "hanahoush": {"fa": "اسپرینت‌های چابک، دموی هفتگی", "en": "Agile sprints, weekly demos", "ar": "سباقات رشيقة وعروض أسبوعية"}},
            {"factor": {"fa": "هزینه مالکیت", "en": "Total cost of ownership", "ar": "التكلفة"}, "traditional": {"fa": "پنهان و فزاینده", "en": "Hidden and rising", "ar": "خفية ومتصاعدة"}, "hanahoush": {"fa": "شفاف و قابل‌پیش‌بینی", "en": "Transparent and predictable", "ar": "شفافة وقابلة للتنبؤ"}},
        ],
    },
    "stack": {
        "eyebrow": {"fa": "Stack", "en": "Stack", "ar": "التقنيات"},
        "title": {"fa": "فناوری که با آن می‌سازیم.", "en": "Technologies we build with.", "ar": "التقنيات التي نبني بها."},
        "description": {
            "fa": "مجموعه‌ای از ابزار و پلتفرم‌های سازمانی.",
            "en": "The enterprise-grade tools and platforms we rely on.",
            "ar": "الأدوات والمنصات المؤسسية التي نعتمد عليها.",
        },
        "technologies": ["Python", "Django", "React", "TypeScript", "PostgreSQL", "Redis", "Kubernetes", "Odoo", "Golang", "Node.js", "Tailwind CSS", "Docker"],
    },
    "process": {
        "eyebrow": {"fa": "منهج ما", "en": "How we work", "ar": "كيف نعمل"},
        "title": {"fa": "یک فرآیند شفاف، از کشف تا پشتیبانی.", "en": "A transparent process, from discovery to support.", "ar": "عملية شفافة من الاكتشاف إلى الدعم."},
        "description": {
            "fa": "هفت مرحله که هر پروژه را قابل‌پیش‌بینی می‌کند.",
            "en": "Seven stages that make every project predictable.",
            "ar": "سبع مراحل تجعل كل مشروع قابلاً للتنبؤ.",
        },
        "steps": ["Discovery", "Planning", "Architecture", "Development", "Testing", "Deployment", "Support"],
    },
    "faq": {
        "eyebrow": {"fa": "سوالات متداول", "en": "FAQ", "ar": "الأسئلة الشائعة"},
        "title": {"fa": "سوالات درباره خدمات.", "en": "Questions about our services.", "ar": "أسئلة حول خدماتنا."},
        "description": {
            "fa": "اطرح سوال خود را — یا از فرم تماس بپرسید.",
            "en": "Practical answers about scope, timeline and support.",
            "ar": "إجابات عملية حول النطاق والجدول الزمني والدعم.",
        },
        "page_size": 20,
    },
    "projects": {
        "eyebrow": {"fa": "نتیجه", "en": "Related work", "ar": "أعمال ذات صلة"},
        "title": {"fa": "پروژه‌های مرتبط.", "en": "Related projects.", "ar": "مشاريع ذات صلة."},
        "description": {
            "fa": "چالش‌های واقعی که با همین تخصص‌ها حل کردیم.",
            "en": "Real challenges we solved with these very disciplines.",
            "ar": "تحديات حقيقية حللناها بنفس هذه التخصصات.",
        },
        "featured": True,
        "limit": 3,
    },
    "articles": {
        "eyebrow": {"fa": "یادداشت‌ها", "en": "Insights", "ar": "رؤى"},
        "title": {"fa": "مقالات مرتبط.", "en": "Related articles.", "ar": "مقالات ذات صلة."},
        "description": {
            "fa": "نوشته‌های ما درباره مهندسی و محصول.",
            "en": "Writing on engineering and product from our team.",
            "ar": "كتاباتنا عن الهندسة والمنتج.",
        },
        "featured": True,
        "limit": 3,
    },
    "cta": {
        "title": {"fa": "آماده‌اید شروع کنیم؟", "en": "Ready to build something exceptional?", "ar": "مستعد للبدء؟"},
        "description": {
            "fa": "با مهندسان ما گفتگو کنید.",
            "en": "Talk to our engineers about your project.",
            "ar": "تحدث مع مهندسينا حول مشروعك.",
        },
        "primary": {"label": {"fa": "شروع پروژه", "en": "Start a project", "ar": "ابدأ مشروعاً"}, "href": "/contact"},
        "secondary": {"label": {"fa": "تماس با ما", "en": "Contact us", "ar": "تواصل معنا"}, "href": "/contact"},
    },
}

SERVICES_SECTIONS = [
    ("hero", "hero"),
    ("journey", "journey"),
    ("services", "core_services"),
    ("comparison", "comparison"),
    ("stack", "stack"),
    ("process", "process"),
    ("faq", "faq"),
    ("projects", "projects"),
    ("articles", "articles"),
    ("cta", "cta"),
]


def seed_services_page():
    """Create the composed Services page (slug: services)."""
    page, was_created = Page.objects.get_or_create(
        slug="services",
        defaults={
            "title_fa": "خدمات",
            "title_en": "Services",
            "title_ar": "الخدمات",
            "status": Status.PUBLISHED,
            "is_home": False,
            "template": "default",
            "version": 1,
            "sort_order": 10,
        },
    )

    created = int(was_created)
    order = 0
    for section_type, copy_key in SERVICES_SECTIONS:
        order += 1
        _, section_created = _sync_section(page, section_type, order, SERVICES_PAGE_COPY[copy_key])
        created += section_created

    seo, seo_created = SEOConfiguration.objects.get_or_create(
        page=page,
        defaults={
            "meta_title_fa": "هانه‌هوش — خدمات",
            "meta_title_en": "Hanahoush — Services",
            "meta_title_ar": "هاناهوش — الخدمات",
            "meta_description_fa": "نرم‌افزار سازمانی، ERP، Odoo، هوش مصنوعی و توسعه وب.",
            "meta_description_en": "Enterprise software, ERP, Odoo, AI and web development services.",
            "meta_description_ar": "برمجيات المؤسسات وخدمات ERP والذكاء الاصطناعي وتطوير الويب.",
            "meta_keywords": "services, ERP, odoo, ai, web development, hanahoush",
            "robots": "index,follow",
        },
    )
    created += int(seo_created)
    return created


def seed_projects_page():
    """Create the composed Projects page (slug: projects)."""
    page, was_created = Page.objects.get_or_create(
        slug="projects",
        defaults={
            "title_fa": "پروژه‌ها",
            "title_en": "Projects",
            "title_ar": "المشاريع",
            "status": Status.PUBLISHED,
            "is_home": False,
            "template": "default",
            "version": 1,
            "sort_order": 20,
        },
    )
    created = int(was_created)
    copy = {
        "hero": {
            "eyebrow": {"fa": "ما چه ساخته‌ایم", "en": "What we've built", "ar": "ما بنيناه"},
            "headline": {"fa": "پروژه‌هایی که چالش واقعی را حل کردند.", "en": "Projects that solved real challenges.", "ar": "مشاريع حلّت تحديات حقيقية."},
            "subtitle": {"fa": "از ERP تا هوش مصنوعی — نگاهی به کار واقعی هانه‌هوش.", "en": "From ERP to AI — a look at Hanahoush's real work.", "ar": "من ERP إلى الذكاء الاصطناعي — لمحة عن عمل هاناهوش الحقيقي."},
            "primary": {"label": {"fa": "شروع پروژه", "en": "Start a project", "ar": "ابدأ مشروعاً"}, "href": "/contact"},
            "secondary": {"label": {"fa": "درباره ما", "en": "About us", "ar": "من نحن"}, "href": "/about"},
            "align": "center",
            "show_grid": True,
            "show_mesh": True,
            "show_particles": False,
        },
        "featured_projects": {
            "eyebrow": {"fa": "شاخص", "en": "Featured", "ar": "مميز"},
            "title": {"fa": "پروژه‌های شاخص.", "en": "Featured projects.", "ar": "مشاريع مميزة."},
            "description": {"fa": "نمونه‌هایی از کارهایی که ساخته‌ایم.", "en": "A closer look at what we've built.", "ar": "نظرة أقرب على ما بنيناه."},
            "limit": 2,
        },
        "project_filters": {
            "eyebrow": {"fa": "کاوش", "en": "Explore", "ar": "استكشف"},
            "title": {"fa": "کشف پروژه‌ها.", "en": "Discover projects.", "ar": "اكتشف المشاريع."},
            "description": {"fa": "بر اساس دسته، فناوری، سال و جست‌وجو فیلتر کنید.", "en": "Filter by category, technology, year and search.", "ar": "صفِّ حسب الفئة والتقنية والسنة والبحث."},
            "page_size": 12,
        },
        "technology_explorer": {
            "eyebrow": {"fa": "فناوری", "en": "Technology", "ar": "التقنيات"},
            "title": {"fa": "کشف با فناوری.", "en": "Explore by technology.", "ar": "استكشف حسب التقنية."},
            "description": {"fa": "فناوری‌های واقعی استفاده‌شده در پروژه‌های ما.", "en": "The real technologies behind our projects.", "ar": "التقنيات الحقيقية وراء مشاريعنا."},
        },
        "projects_timeline": {
            "eyebrow": {"fa": "تکامل", "en": "Evolution", "ar": "التطور"},
            "title": {"fa": "تکامل پرتفوی.", "en": "Portfolio evolution.", "ar": "تطور المحفظة."},
            "description": {"fa": "پروژه‌های ما در طول زمان.", "en": "Our projects over time.", "ar": "مشاريعنا عبر الزمن."},
        },
        "cta": {
            "title": {"fa": "پروژه‌ای در ذهن دارید؟", "en": "Have a project in mind?", "ar": "لديك مشروع في ذهنك؟"},
            "description": {"fa": "با تیم ما درباره پروژه‌تان گفتگو کنید.", "en": "Talk to our team about yours.", "ar": "تحدث مع فريقنا حول مشروعك."},
            "primary": {"label": {"fa": "شروع گفتگو", "en": "Start a conversation", "ar": "ابدأ المحادثة"}, "href": "/contact"},
            "secondary": {"label": {"fa": "مشاهده خدمات", "en": "See our services", "ar": "اطلع على خدماتنا"}, "href": "/services"},
        },
    }
    sections = ["hero", "featured_projects", "project_filters", "technology_explorer", "projects_timeline", "cta"]
    for i, section_type in enumerate(sections, start=1):
        _, section_created = _sync_section(page, section_type, i, copy.get(section_type, {}))
        created += section_created

    seo, seo_created = SEOConfiguration.objects.get_or_create(
        page=page,
        defaults={
            "meta_title_fa": "هانه‌هوش — پروژه‌ها",
            "meta_title_en": "Hanahoush — Projects",
            "meta_title_ar": "هاناهوش — المشاريع",
            "meta_description_fa": "نمونه کارها و مطالعه موردی پروژه‌های هانه‌هوش.",
            "meta_description_en": "Project portfolio and case studies from Hanahoush.",
            "meta_description_ar": "المحفظة ودراسات الحالة لمشاريع هاناهوش.",
            "meta_keywords": "projects, portfolio, case studies, ERP, AI, web",
            "robots": "index,follow",
        },
    )
    created += int(seo_created)
    return created


def seed_articles_page():
    """Create the composed Articles / Knowledge Hub page (slug: articles)."""
    page, was_created = Page.objects.get_or_create(
        slug="articles",
        defaults={
            "title_fa": "مقالات",
            "title_en": "Articles",
            "title_ar": "المقالات",
            "status": Status.PUBLISHED,
            "is_home": False,
            "template": "default",
            "version": 1,
            "sort_order": 30,
        },
    )
    created = int(was_created)
    copy = {
        "articles_hero": {
            "eyebrow": {"fa": "هانه‌هوش مهندسی و فناوری", "en": "Hanahoush Engineering & Technology", "ar": "هاناهوش للهندسة والتقنية"},
            "headline": {"fa": "مجله مهندسی و فناوری.", "en": "The engineering magazine.", "ar": "مجلة الهندسة والتقنية."},
            "subtitle": {"fa": "نوشته‌های فنی درباره نرم‌افزار، ERP، هوش مصنوعی و معماری — از تیم مهندسی ما.", "en": "Technical writing on software, ERP, AI and architecture — from our engineering team.", "ar": "كتابات تقنية عن البرمجيات وERP والذكاء الاصطناعي والبنية — من فريقنا الهندسي."},
            "primary": {"label": {"fa": "جست‌وجو در مقالات", "en": "Browse articles", "ar": "تصفح المقالات"}, "href": "/articles#discover"},
            "secondary": {"label": {"fa": "خدمات ما", "en": "Our services", "ar": "خدماتنا"}, "href": "/services"},
            "align": "center",
            "show_grid": True,
            "show_mesh": True,
            "show_particles": False,
        },
        "featured_article": {
            "eyebrow": {"fa": "مقاله منتخب", "en": "Featured", "ar": "مميز"},
            "title": {"fa": "نگاهی عمیق.", "en": "A deep dive.", "ar": "غوص عميق."},
            "limit": 1,
        },
        "latest_articles": {
            "eyebrow": {"fa": "آخرین‌ها", "en": "Latest", "ar": "الأحدث"},
            "title": {"fa": "آخرین مقالات.", "en": "Latest articles.", "ar": "أحدث المقالات."},
            "description": {"fa": "جدیدترین نوشته‌های تیم.", "en": "The newest writing from the team.", "ar": "أحدث كتابات الفريق."},
            "limit": 6,
        },
        "article_filters": {
            "eyebrow": {"fa": "کاوش", "en": "Discover", "ar": "استكشف"},
            "title": {"fa": "جست‌وجو و فیلتر مقالات.", "en": "Search & filter articles.", "ar": "ابحث وصفِّ المقالات."},
            "description": {"fa": "بر اساس عنوان، دسته، برچسب و ترتیب.", "en": "By title, category, tag and sort order.", "ar": "بالعنوان والفئة والوسم وترتيب."},
            "page_size": 12,
        },
        "category_explorer": {
            "eyebrow": {"fa": "دسته‌ها", "en": "Categories", "ar": "الفئات"},
            "title": {"fa": "مرور دسته‌ها.", "en": "Browse categories.", "ar": "تصفح الفئات."},
        },
        "tag_explorer": {
            "eyebrow": {"fa": "موضوعات", "en": "Topics", "ar": "المواضيع"},
            "title": {"fa": "کاوش فنی.", "en": "Explore topics.", "ar": "استكشف المواضيع."},
            "description": {"fa": "برچسب‌های واقعی مقالات ما.", "en": "The real tags behind our articles.", "ar": "الوسوم الحقيقية لمقالاتنا."},
        },
        "newsletter_cta": {
            "eyebrow": {"fa": "خبرنامه", "en": "Newsletter", "ar": "النشرة"},
            "title": {"fa": "مطالب جدید را از دست ندهید.", "en": "Don't miss new engineering writing.", "ar": "لا تفوّت كتاباتنا الهندسية الجديدة."},
            "description": {"fa": "هر ماه، بهترین مقالات ما در ایمیل شما.", "en": "Our best articles, in your inbox every month.", "ar": "أفضل مقالاتنا في بريدك كل شهر."},
            "source": "articles-newsletter",
        },
        "article_cta": {
            "title": {"fa": "پروژه‌ای در ذهن دارید؟", "en": "Have a project in mind?", "ar": "لديك مشروع في ذهنك؟"},
            "description": {"fa": "با مهندسان ما گفتگو کنید.", "en": "Talk to our engineers.", "ar": "تحدث مع مهندسينا."},
            "primary": {"label": {"fa": "شروع گفتگو", "en": "Start a conversation", "ar": "ابدأ المحادثة"}, "href": "/contact"},
            "secondary": {"label": {"fa": "مشاهده پروژه‌ها", "en": "See our projects", "ar": "اطلع على مشاريعنا"}, "href": "/projects"},
        },
    }
    sections = ["articles_hero", "featured_article", "latest_articles", "article_filters", "category_explorer", "tag_explorer", "newsletter_cta", "article_cta"]
    for i, section_type in enumerate(sections, start=1):
        _, section_created = _sync_section(page, section_type, i, copy.get(section_type, {}))
        created += section_created

    seo, seo_created = SEOConfiguration.objects.get_or_create(
        page=page,
        defaults={
            "meta_title_fa": "هانه‌هوش — مقالات",
            "meta_title_en": "Hanahoush — Articles & Engineering",
            "meta_title_ar": "هاناهوش — المقالات",
            "meta_description_fa": "مجله مهندسی و فناوری هانه‌هوش.",
            "meta_description_en": "Hanahoush Engineering & Technology magazine.",
            "meta_description_ar": "مجلة هاناهوش للهندسة والتقنية.",
            "meta_keywords": "articles, engineering, erp, ai, software",
            "robots": "index,follow",
        },
    )
    created += int(seo_created)
    return created


def seed_company_pages():
    """Create the composed About and Contact pages."""
    about_copy = {
        "hero": {
            "eyebrow": {"fa": "درباره هانه‌هوش", "en": "About Hanahoush", "ar": "عن هاناهوش"},
            "headline": {"fa": "شرکتی که فناوری می‌سازد.", "en": "The company that builds technology.", "ar": "الشركة التي تصنع التكنولوجيا."},
            "subtitle": {"fa": "مهندسان، معماران و اپراتورهایی که محصول می‌سازند.", "en": "Engineers, architects and operators who ship products.", "ar": "مهندسون ومعماريون ومشغلون يصنعون المنتجات."},
            "primary": {"label": {"fa": "با ما تماس بگیرید", "en": "Get in touch", "ar": "تواصل معنا"}, "href": "/contact"},
            "secondary": {"label": {"fa": "مشاهده خدمات", "en": "Our services", "ar": "خدماتنا"}, "href": "/services"},
            "align": "center",
            "show_grid": True,
            "show_mesh": True,
            "show_particles": False,
        },
        "company_story": {
            "eyebrow": {"fa": "داستان ما", "en": "Our story", "ar": "قصتنا"},
            "title": {"fa": "ما چه می‌سازیم.", "en": "What we build.", "ar": "ماذا نبني."},
            "description": {"fa": "طراحی، ساخت و بهره‌برداری نرم‌افزار سازمانی — با تمرکز بر کیفیت و نتیجه.", "en": "We design, build and operate enterprise software — focused on quality and outcomes.", "ar": "نصمم ونبني ونشغّل برمجيات المؤسسات — بتركيز على الجودة والنتائج."},
        },
        "values": {
            "eyebrow": {"fa": "ارزش‌ها", "en": "Values", "ar": "القيم"},
            "title": {"fa": "چیزهایی که به آن باور داریم.", "en": "What we believe in.", "ar": "ما نؤمن به."},
            "values": [
                {"title": {"fa": "کیفیت مهندسی", "en": "Engineering quality", "ar": "الجودة الهندسية"}, "body": {"fa": "کد و معماری که ماندگار باشد.", "en": "Code and architecture that lasts.", "ar": "برمجيات وبنية تدوم."}},
                {"title": {"fa": "شفافیت", "en": "Transparency", "ar": "الشفافية"}, "body": {"fa": "پیشرفت قابل مشاهده در هر مرحله.", "en": "Visible progress at every step.", "ar": "تقدم مرئي في كل خطوة."}},
                {"title": {"fa": "نتیجه", "en": "Outcomes", "ar": "النتائج"}, "body": {"fa": "ساختن چیزهایی که کار می‌کنند.", "en": "Building things that actually work.", "ar": "بناء أشياء تعمل فعلاً."}},
            ],
        },
        "cta": {
            "title": {"fa": "پروژه‌ای در ذهن دارید؟", "en": "Have a project in mind?", "ar": "لديك مشروع في ذهنك؟"},
            "description": {"fa": "با مهندسان ما گفتگو کنید.", "en": "Talk to our engineers.", "ar": "تحدث مع مهندسينا."},
            "primary": {"label": {"fa": "شروع گفتگو", "en": "Start a conversation", "ar": "ابدأ المحادثة"}, "href": "/contact"},
            "secondary": {"label": {"fa": "مقالات ما", "en": "Read our articles", "ar": "اقرأ مقالاتنا"}, "href": "/articles"},
        },
    }
    # About page composition (Phase 9D): only sections backed by honest demo
    # content. Team / timeline / partners / testimonials / offices / social
    # links are intentionally not composed until real data exists.
    about_sections = ["hero", "company_story", "about", "values", "faq", "cta"]

    contact_copy = {
        "hero": {
            "eyebrow": {"fa": "تماس", "en": "Contact", "ar": "اتصل"},
            "headline": {"fa": "بیایید گفتگو را شروع کنیم.", "en": "Let's start a conversation.", "ar": "لنبدأ المحادثة."},
            "subtitle": {"fa": "درباره پروژه‌تان به ما بگویید — ما پاسخ می‌دهیم.", "en": "Tell us about your project — we'll get back to you.", "ar": "أخبرنا عن مشروعك وسنرد عليك."},
            "primary": {"label": {"fa": "فرم تماس", "en": "Contact form", "ar": "نموذج الاتصال"}, "href": "/contact#contact"},
            "secondary": {"label": {"fa": "درباره ما", "en": "About us", "ar": "من نحن"}, "href": "/about"},
            "align": "center",
            "show_grid": True,
            "show_mesh": True,
            "show_particles": False,
        },
        "contact_form": {
            "eyebrow": {"fa": "درخواست", "en": "Inquiry", "ar": "استفسار"},
            "title": {"fa": "درباره پروژه‌تان بنویسید.", "en": "Write to us about your project.", "ar": "اكتب لنا عن مشروعك."},
            "description": {"fa": "هر درخواست توسط تیم مهندسی ما بررسی می‌شود.", "en": "Every inquiry is reviewed by our engineering team.", "ar": "كل استفسار يراجعه فريقنا الهندسي."},
        },
        "cta": {
            "title": {"fa": "آماده‌اید گفتگو را شروع کنید؟", "en": "Ready to start a conversation?", "ar": "مستعد لبدء المحادثة؟"},
            "description": {"fa": "فرم تماس سریع‌ترین راه برای رسیدن به تیم مهندسی ماست.", "en": "The contact form is the fastest way to reach our engineering team.", "ar": "نموذج الاتصال هو أسرع طريق للوصول إلى فريقنا الهندسي."},
            "primary": {"label": {"fa": "فرم تماس", "en": "Contact form", "ar": "نموذج الاتصال"}, "href": "/contact#contact"},
            "secondary": {"label": {"fa": "مقالات", "en": "Read articles", "ar": "اقرأ المقالات"}, "href": "/articles"},
        },
    }
    contact_sections = ["hero", "contact_form", "cta"]

    created = 0
    for slug, title_fa, title_en, title_ar, sections, copy, seo in [
        ("about", "درباره ما", "About", "من نحن", about_sections, about_copy, {
            "meta_title_fa": "هانه‌هوش — درباره ما",
            "meta_title_en": "Hanahoush — About",
            "meta_title_ar": "هاناهوش — من نحن",
            "meta_description_fa": "درباره شرکت مهندسی هانه‌هوش.",
            "meta_description_en": "About the Hanahoush engineering company.",
            "meta_description_ar": "عن شركة هاناهوش الهندسية.",
            "meta_keywords": "about, company, hanahoush, engineering",
            "robots": "index,follow",
        }),
        ("contact", "تماس", "Contact", "اتصل", contact_sections, contact_copy, {
            "meta_title_fa": "هانه‌هوش — تماس",
            "meta_title_en": "Hanahoush — Contact",
            "meta_title_ar": "هاناهوش — اتصل بنا",
            "meta_description_fa": "با تیم هانه‌هوش در ارتباط باشید.",
            "meta_description_en": "Get in touch with the Hanahoush team.",
            "meta_description_ar": "تواصل مع فريق هاناهوش.",
            "meta_keywords": "contact, inquiry, hanahoush",
            "robots": "index,follow",
        }),
    ]:
        page, was_created = Page.objects.get_or_create(
            slug=slug,
            defaults={
                "title_fa": title_fa,
                "title_en": title_en,
                "title_ar": title_ar,
                "status": Status.PUBLISHED,
                "is_home": False,
                "template": "default",
                "version": 1,
            },
        )
        created += int(was_created)
        for i, section_type in enumerate(sections, start=1):
            _, section_created = _sync_section(page, section_type, i, copy.get(section_type, {}))
            created += section_created
        seo_obj, seo_created = SEOConfiguration.objects.get_or_create(page=page, defaults=seo)
        created += int(seo_created)
    return created


def seed_page_builder() -> dict:
    """Seed all page-builder data; returns per-domain created counts."""
    counts = {
        "sections": seed_section_registry(),
        "navigation": seed_navigation(),
        "footer": seed_footer(),
        "announcement": seed_announcement(),
        "hero": seed_hero(),
        "seo": seed_seo(),
        "pages": seed_home_page(),
    }
    counts["pages"] += seed_services_page()
    counts["pages"] += seed_projects_page()
    counts["pages"] += seed_articles_page()
    counts["pages"] += seed_company_pages()
    return counts
