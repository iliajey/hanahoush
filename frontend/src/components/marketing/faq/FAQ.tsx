import { cn } from "@/shared/lib/cn"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"

export interface FAQItem { question: string; answer: string }

export function FAQAccordion({ items, className, onValueChange }: { items: FAQItem[]; className?: string; onValueChange?: (value: string) => void }) {
  return (
    <Accordion type="single" collapsible className={cn("w-full", className)} onValueChange={onValueChange}>
      {items.map((item, i) => (
        <AccordionItem key={i} value={`faq-${i}`}>
          <AccordionTrigger className="text-left text-base font-medium">{item.question}</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export function FAQSearch({ onSearch, className }: { onSearch: (q: string) => void; className?: string }) {
  return <Input placeholder="Search FAQ…" onChange={(e) => onSearch(e.target.value)} className={cn("mb-6 max-w-md", className)} />
}

export function FAQCategoryFilter({ categories, active, onChange, className }: { categories: string[]; active: string; onChange: (c: string) => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {categories.map((c) => (
        <button key={c} onClick={() => onChange(c)} className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors", c === active ? "bg-brand-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}>{c}</button>
      ))}
    </div>
  )
}
