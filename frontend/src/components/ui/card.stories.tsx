import type { Meta, StoryObj } from "@storybook/react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card"
import { Button } from "./button"

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Card content — used by the temporary homepage and future pages.</p>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="ghost">Cancel</Button>
        <Button>Confirm</Button>
      </CardFooter>
    </Card>
  ),
}
