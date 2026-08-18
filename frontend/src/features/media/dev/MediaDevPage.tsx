import { useState } from "react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { MediaPicker } from "../components/MediaPicker"

/** Development console for the reusable CMS media picker/uploader. */
export function MediaDevPage() {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)

  return (
    <PageWrapper title="Media Library Console" description="Exercise the reusable media picker (staff-only API).">
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm font-medium">Media picker</p>
              <p className="text-sm text-muted-foreground">
                {picked ? `Last selected: ${picked}` : "No media selected yet."}
              </p>
            </div>
            <Button onClick={() => setOpen(true)}>Open media library</Button>
          </CardContent>
        </Card>

        <MediaPicker
          open={open}
          onOpenChange={setOpen}
          onSelect={(media) => setPicked(media.original_name)}
        />
      </div>
    </PageWrapper>
  )
}