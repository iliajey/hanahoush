import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { Checkbox } from "./checkbox"
import { RadioGroup, RadioGroupItem } from "./radio-group"
import { Switch } from "./switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Textarea } from "./textarea"

const FormControls = () => (
  <div className="grid w-full max-w-md gap-6">
    <div className="grid gap-1.5">
      <Label htmlFor="name">Name</Label>
      <Input id="name" placeholder="Full name" />
    </div>

    <div className="grid gap-1.5">
      <Label htmlFor="bio">Bio</Label>
      <Textarea id="bio" placeholder="Tell us about yourself…" />
    </div>

    <div className="grid gap-1.5">
      <Label>Language</Label>
      <Select defaultValue="fa">
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fa">فارسی</SelectItem>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="ar">العربية</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms</Label>
    </div>

    <RadioGroup defaultValue="a">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="a" id="a" />
        <Label htmlFor="a">Option A</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="b" id="b" />
        <Label htmlFor="b">Option B</Label>
      </div>
    </RadioGroup>

    <div className="flex items-center gap-2">
      <Switch id="notify" />
      <Label htmlFor="notify">Enable notifications</Label>
    </div>

    <Button>Submit</Button>
  </div>
)

const meta: Meta<typeof FormControls> = {
  title: "Form/Controls",
  component: FormControls,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof FormControls>

export const Overview: Story = {}
