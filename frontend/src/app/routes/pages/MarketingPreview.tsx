import { Cpu, Globe, Layers, LineChart, Settings } from "lucide-react"
import { PageWrapper } from "@/app/layouts/PageWrapper"
import { SectionHeader, AnimatedDivider } from "@/components/marketing/common"
import { Hero } from "@/components/marketing/hero"
import { StatCard, StatGrid } from "@/components/marketing/statistics"
import { ServiceCard, ServiceGrid } from "@/components/marketing/services"
import { ProjectCard, ProjectGrid, TechnologyChip } from "@/components/marketing/projects"
import { ArticleCard, ArticleGrid } from "@/components/marketing/articles"
import { ERPFeatureCard } from "@/components/marketing/erp"
import { VerticalTimeline } from "@/components/marketing/timeline"
import { TestimonialCard, TestimonialGrid } from "@/components/marketing/testimonials"
import { GradientCTA } from "@/components/marketing/cta"
import { ContactCard } from "@/components/marketing/contact"
import { EnterpriseFooter } from "@/components/marketing/footer"
import { GlassPanel, SpotlightContainer } from "@/components/marketing/common"

export function MarketingPreview() {
  return (
    <PageWrapper title="Marketing Component Library" description="Developer preview — all marketing components.">
      <div className="rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
        DEV-ONLY component gallery. This page intentionally renders static sample props to document the marketing
        component API — it is not a CMS page and is excluded from the production build.
      </div>
      <div className="space-y-16">
        <SectionHeader eyebrow="Components" title="Marketing Library" description="Premium, handcrafted components for the Hanahoush website." />

        <section>
          <SectionHeader eyebrow="Hero" title="Hero Section" align="start" />
          <Hero headline="Enterprise software, engineered like a product." subtitle="ERP, AI, web applications and programming services — built for companies that demand quality." primaryCta={{ label: "Start a project", href: "#" }} secondaryCta={{ label: "Explore services", href: "#" }} />
        </section>

        <section>
          <SectionHeader eyebrow="Statistics" title="Stat Cards + Grid" align="start" />
          <StatGrid>
            <StatCard label="Sample services" value="3" />
            <StatCard label="Sample projects" value="3" />
            <StatCard label="Sample articles" value="3" />
            <StatCard label="Sample testimonials" value="2" />
          </StatGrid>
          <p className="mt-3 text-xs text-muted-foreground">Sample props for component documentation — the live site derives statistics from real CMS data.</p>
        </section>

        <section>
          <SectionHeader eyebrow="Services" title="Service Cards" align="start" />
          <ServiceGrid>
            {[
              { icon: <Globe />, title: "Enterprise Software", description: "Custom enterprise applications engineered for scale, security and maintainability.", features: ["Architecture design", "API development", "Cloud deployment"], href: "#" },
              { icon: <Layers />, title: "ERP (hanRP)", description: "Our own ERP product line, purpose-built for regional enterprises — modular, bilingual, cloud-ready.", features: ["Finance", "Procurement", "HR", "Inventory"], href: "#" },
              { icon: <Settings />, title: "Odoo Implementation", description: "Full-cycle Odoo consulting, customisation and deployment for mid-to-large businesses.", href: "#" },
            ].map((s) => (<ServiceCard key={s.title} {...s} />))}
          </ServiceGrid>
        </section>

        <section>
          <SectionHeader eyebrow="Projects" title="Project Cards" align="start" />
          <ProjectGrid>
            {["E-Commerce Platform", "ERP System", "Analytics Dashboard"].map((title, i) => (
              <ProjectCard key={title} title={title} description="A premium enterprise project delivered end-to-end." tags={["Django", "React", "PostgreSQL"]} client={["Anonymised client", "Anonymised client", "Anonymised client"][i]} />
            ))}
          </ProjectGrid>
        </section>

        <section>
          <SectionHeader eyebrow="Articles" title="Article Cards" align="start" />
          <ArticleGrid>
            {["Digital Transformation Guide", "ERP Migration Strategy", "AI in Enterprise"].map((title) => (
              <ArticleCard key={title} title={title} description="In-depth technical article covering enterprise software patterns and strategies." category="Technology" date="Aug 2024" readTime="5 min read" />
            ))}
          </ArticleGrid>
        </section>

        <section>
          <SectionHeader eyebrow="ERP" title="ERP Components" align="start" />
          <div className="grid gap-6 md:grid-cols-2">
            <ERPFeatureCard icon={<Cpu />} title="Modular Architecture" description="Pick the modules you need — finance, procurement, HR, inventory, CRM. All bilingual and cloud-native." />
            <ERPFeatureCard icon={<LineChart />} title="Real-time Analytics" description="Dashboards with live data. Drill down from KPIs to transaction records in seconds." />
          </div>
        </section>

        <section>
          <SectionHeader eyebrow="Timeline" title="Milestones" align="start" />
          <VerticalTimeline items={[
            { date: "Sample", title: "Illustrative milestone", description: "Sample timeline entry — replace with verified company history." },
            { date: "Sample", title: "Illustrative milestone", description: "Sample timeline entry — replace with verified company history." },
            { date: "Sample", title: "Illustrative milestone", description: "Sample timeline entry — replace with verified company history." },
          ]} />
        </section>

        <section>
          <SectionHeader eyebrow="Testimonials" title="Customer Cards" align="start" />
          <TestimonialGrid>
            <TestimonialCard quote="Sample testimonial copy for the component gallery — real quotes come from the CMS." name="Anonymised review" role="Manufacturing sector" company="Sector anonymised" rating={5} />
            <TestimonialCard quote="Another illustrative sample — verified client quotes arrive through the content platform." name="Anonymised review" role="Services sector" company="Sector anonymised" rating={5} />
          </TestimonialGrid>
          <p className="mt-3 text-xs text-muted-foreground">Sample testimonials are anonymised; no real clients or organisations are referenced.</p>
        </section>

        <section>
          <SectionHeader eyebrow="CTA" title="Call to Action" align="start" />
          <GradientCTA title="Ready to build something exceptional?" description="Our engineering team is ready to discuss your project." primary={{ label: "Start a project", href: "#" }} secondary={{ label: "Talk to engineering", href: "#" }} />
        </section>

        <section>
          <SectionHeader eyebrow="Common" title="Glass + Spotlight + Glow + Divider" align="start" />
          <div className="grid gap-6 md:grid-cols-2">
            <GlassPanel level="standard" className="p-6">Glass panel — translucent blurred surface</GlassPanel>
            <SpotlightContainer className="p-6">Spotlight container — move your cursor</SpotlightContainer>
          </div>
          <div className="mt-6">
            <AnimatedDivider className="my-6" />
            <div className="flex flex-wrap gap-3">
              <TechnologyChip label="Django" /><TechnologyChip label="React" /><TechnologyChip label="PostgreSQL" />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader eyebrow="Contact" title="Contact Cards" align="start" />
          <div className="grid gap-6 md:grid-cols-3">
            <ContactCard icon="mail" title="Email" content="contact@example.com" href="mailto:contact@example.com" />
            <ContactCard icon="phone" title="Phone" content="Verified number — to be added" />
            <ContactCard icon="map" title="Office" content="Office address — to be confirmed" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Placeholder contact details for the gallery — the live site uses verified company channels.</p>
        </section>

        <section>
          <SectionHeader eyebrow="Footer" title="Enterprise Footer" align="start" />
          <EnterpriseFooter
            columns={[
              { title: "Company", links: [{ label: "About", href: "#" }, { label: "Projects", href: "#" }, { label: "Contact", href: "#" }] },
              { title: "Services", links: [{ label: "Enterprise Software", href: "#" }, { label: "ERP (hanRP)", href: "#" }, { label: "Odoo", href: "#" }] },
              { title: "Resources", links: [{ label: "Articles", href: "#" }, { label: "FAQ", href: "#" }, { label: "Privacy", href: "#" }] },
            ]}
            company={{ name: "Hanahoush", year: 2025 }}
          />
        </section>
      </div>
    </PageWrapper>
  )
}
