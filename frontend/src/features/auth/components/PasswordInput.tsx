import { forwardRef, useState } from "react"
import type { InputHTMLAttributes } from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/shared/lib/cn"
import { Input } from "@/components/ui/input"

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: boolean
}

/** Text input with a show/hide password toggle. */
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    return (
      <div className={cn("relative", className)}>
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          error={error}
          className="pe-10"
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 end-3 flex items-center text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
