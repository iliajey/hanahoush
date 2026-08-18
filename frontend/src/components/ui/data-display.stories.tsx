import type { Meta, StoryObj } from "@storybook/react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Spinner } from "./spinner"
import { EmptyState } from "./empty-state"
import { ErrorState } from "./error-state"
import { Pagination } from "./pagination"

const meta: Meta = {
  title: "UI/Data Display",
  tags: ["autodocs"],
}

export default meta

export const TabsDemo: StoryObj = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview content</TabsContent>
      <TabsContent value="details">Details content</TabsContent>
    </Tabs>
  ),
}

export const AccordionDemo: StoryObj = {
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-md">
      <AccordionItem value="1">
        <AccordionTrigger>First question</AccordionTrigger>
        <AccordionContent>First answer.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="2">
        <AccordionTrigger>Second question</AccordionTrigger>
        <AccordionContent>Second answer.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const AvatarDemo: StoryObj = {
  render: () => (
    <Avatar>
      <AvatarImage src="" alt="User" />
      <AvatarFallback>HH</AvatarFallback>
    </Avatar>
  ),
}

export const SpinnerDemo: StoryObj = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" label="Loading…" />
    </div>
  ),
}

export const EmptyStateDemo: StoryObj = {
  render: () => <EmptyState title="No items" description="Create your first item to get started." />,
}

export const ErrorStateDemo: StoryObj = {
  render: () => <ErrorState title="Failed to load" onRetry={() => undefined} />,
}

export const PaginationDemo: StoryObj = {
  render: () => <Pagination currentPage={3} totalPages={10} onPageChange={() => undefined} />,
}
