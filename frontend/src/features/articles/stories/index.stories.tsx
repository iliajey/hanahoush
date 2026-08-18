import type { Meta, StoryObj } from "@storybook/react"

import {
  ArticleContent,
  ArticleFilterBar,
  ArticleTableOfContents,
  CodeBlock,
  NewsletterCTA,
  ReadingProgress,
  RelatedArticles,
} from "@/features/articles/components"
import { ArticleCard, ArticleGrid } from "@/components/marketing/articles"

export default {
  title: "Articles/KnowledgeHub",
  tags: ["autodocs"],
} satisfies Meta

const sampleArticle = {
  id: 1,
  slug: "django-guide",
  title_en: "Building Scalable APIs with Django REST Framework",
  short_description_en: "Patterns for versioning, pagination, filtering and security in production APIs.",
  category: { id: 1, title_en: "Technology", slug: "technology" },
  tags: [{ id: 1, title_en: "Django", slug: "django" }],
  cover_image: null,
  reading_time: 12,
  published_at: "2025-01-01T00:00:00Z",
  is_featured: true,
  is_public: true,
}

export const ArticleCardStory: StoryObj = {
  name: "ArticleCard",
  render: () => (
    <ArticleGrid>
      <ArticleCard
        title={sampleArticle.title_en}
        description={sampleArticle.short_description_en}
        category="Technology"
        date="Jan 2025"
        readTime="12 min"
        featured
      />
      <ArticleCard title="React Architecture at Scale" description="Feature slices, state and performance." category="Frontend" readTime="10 min" />
      <ArticleCard title="ERP Migration Strategy" description="From legacy to hanRP without downtime." category="ERP" readTime="8 min" />
    </ArticleGrid>
  ),
}

export const ArticleContentStory: StoryObj = {
  name: "ArticleContent",
  render: () => (
    <div className="max-w-3xl">
      <ArticleContent
        html={`
          <h2>Introduction</h2>
          <p>Django REST Framework is the backbone of many production systems.</p>
          <h3>Versioning</h3>
          <p>Namespace versioning keeps the API stable.</p>
          <pre><code class="language-python">class ArticleViewSet(viewsets.ModelViewSet):\n    queryset = Article.objects.all()</code></pre>
          <blockquote>Good architecture pays for itself.</blockquote>
          <h2>Security</h2>
          <p>Always sanitize and throttle.</p>
        `}
      />
    </div>
  ),
}

export const ArticleFiltersStory: StoryObj = {
  name: "ArticleFilters",
  render: () => (
    <ArticleFilterBar
      filters={{}}
      onChange={() => {}}
      categories={[
        { id: 1, title_en: "Technology", slug: "technology" },
        { id: 2, title_en: "Business", slug: "business" },
      ]}
      tags={[{ id: 1, title_en: "Django", slug: "django", articles_count: 5 }]}
      count={12}
    />
  ),
}

export const TableOfContentsStory: StoryObj = {
  name: "ArticleTableOfContents",
  render: () => (
    <div className="max-w-xs">
      <ArticleTableOfContents
        toc={[
          { id: "intro-1", text: "Introduction", level: 2 },
          { id: "versioning-2", text: "Versioning", level: 3 },
          { id: "security-3", text: "Security", level: 2 },
        ]}
      />
    </div>
  ),
}

export const ReadingProgressStory: StoryObj = {
  name: "ReadingProgress",
  render: () => (
    <div className="p-6">
      <ReadingProgress />
      <p className="text-sm text-muted-foreground">Scroll to see the reading progress bar at the top of the viewport.</p>
    </div>
  ),
}

export const CodeBlockStory: StoryObj = {
  name: "CodeBlock",
  render: () => (
    <div className="max-w-2xl space-y-4">
      <CodeBlock language="python" code={'from django.db import models\n\nclass Article(models.Model):\n    title = models.CharField(max_length=255)'} />
      <CodeBlock language="javascript" code={'export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })'} />
    </div>
  ),
}

export const NewsletterCTAStory: StoryObj = {
  name: "NewsletterCTA",
  render: () => <NewsletterCTA source="storybook" title="Don't miss new engineering writing." description="Our best articles, in your inbox every month." />,
}

export const RelatedArticlesStory: StoryObj = {
  name: "RelatedArticles",
  render: () => <RelatedArticles articles={[sampleArticle, { ...sampleArticle, id: 2, slug: "react-scale", title_en: "React at Scale" }, { ...sampleArticle, id: 3, slug: "erp-migration", title_en: "ERP Migration" }]} locale="en" />,
}
