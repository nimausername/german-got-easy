"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type PasswordInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "type"
> & {
  readonly invalid?: boolean;
  readonly groupClassName?: string;
};

/**
 * Password field with lock icon and show/hide toggle.
 * Adapted from ReUI c-input-group-35.
 */
export const PasswordInput = ({
  invalid = false,
  id,
  className,
  groupClassName,
  ...props
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleToggleVisibility = () => {
    setShowPassword((value) => !value);
  };

  return (
    <InputGroup className={groupClassName}>
      <InputGroupAddon align="inline-start">
        <Lock className="size-4 text-muted-foreground" aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        type={showPassword ? "text" : "password"}
        aria-invalid={invalid || undefined}
        className={className}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-sm"
          className="touch-manipulation"
          onClick={handleToggleVisibility}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-controls={id}
          aria-pressed={showPassword}
        >
          {showPassword ? (
            <EyeOff className="size-4 text-muted-foreground" aria-hidden />
          ) : (
            <Eye className="size-4 text-muted-foreground" aria-hidden />
          )}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
};
