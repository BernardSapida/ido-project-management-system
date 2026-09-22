import {
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
} from "@heroui/react";
import { useEffect, useRef } from "react";
import type { FieldValues } from "react-hook-form";
import type { BoundField, FieldBindingProps } from "../field-binding";
import { FieldBinding } from "../field-binding";
import { cn } from "../../lib/cn";

/** Words = runs of non-whitespace. Matches how the rich text editor's footer
 *  counts, so a form mixing the two reads the same. */
function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

interface AppTextAreaBaseProps {
  className?: string;
  "data-cy"?: string;
  description?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  label: string;
  /**
   * The character budget. A live `words · count / maxLength chars` reading is
   * pinned inside the field, bottom-right, from the first render - it never appears
   * only once it is breached, which is a cap the user meets by hitting it. The
   * reading turns danger at the limit.
   *
   * It is **not** wired to the DOM `maxLength`. A paste is allowed to overflow
   * so the reading can say how far over, the field goes invalid, and submit is
   * what blocks. A hard `maxLength` truncates a paste in silence and strands the
   * caret at the end.
   */
  maxLength: number;
  placeholder?: string;
  /**
   * Resting height, in rows. The field auto-grows from here as the user types.
   * Height is the one sizing concern a caller reliably needs on a textarea, and
   * it is not expressible through className.
   */
  rows?: number;
  /**
   * Ceiling for the auto-grow, in rows. At `maxRows` the field stops growing and
   * scrolls internally rather than pushing the submit button off the screen.
   * Clamped up to `rows` if a caller passes something smaller.
   */
  maxRows?: number;
}

type AppTextAreaProps<T extends FieldValues> = AppTextAreaBaseProps &
  FieldBindingProps<string, T>;

/** Multi-line text. The same InputGroup shell as `AppInputGroup`, so the two
 *  share a border, a focus ring and an invalid state in a form that mixes them.
 *
 *  Auto-grows between `rows` and `maxRows`; a word + character reading pinned
 *  inside the field is part of it, not opt-in. */
export function AppTextArea<T extends FieldValues>({
  className,
  "data-cy": dataCy,
  description,
  isDisabled,
  isReadOnly,
  isRequired,
  label,
  maxLength,
  maxRows = 12,
  placeholder,
  rows = 6,
  ...binding
}: AppTextAreaProps<T>) {
  return (
    <FieldBinding binding={binding} emptyValue="">
      {(field) => (
        <TextAreaField
          className={className}
          data-cy={dataCy}
          description={description}
          field={field}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isRequired={isRequired}
          label={label}
          maxLength={maxLength}
          maxRows={maxRows}
          placeholder={placeholder}
          rows={rows}
        />
      )}
    </FieldBinding>
  );
}

function TextAreaField({
  className,
  "data-cy": dataCy,
  description,
  field,
  isDisabled,
  isReadOnly,
  isRequired,
  label,
  maxLength,
  maxRows = 12,
  placeholder,
  rows = 6,
}: AppTextAreaBaseProps & { field: BoundField<string> }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const value = field.value ?? "";

  // Grow to fit the content, then let CSS `max-height` cap it and the textarea's
  // own overflow scroll the rest. Runs on every value change and on a width
  // change, since a narrower field rewraps to more lines.
  useEffect(() => {
    const el = rootRef.current?.querySelector("textarea");
    if (!el) return;

    const resize = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [value]);

  const count = value.length;
  const words = countWords(value);
  const over = count - maxLength;
  const atLimit = count >= maxLength;
  const cappedRows = Math.max(maxRows, rows);

  // The over-limit state is the field's own; it stacks on top of whatever the
  // binding already says. The count is repeated as a message, not only as a
  // colour - a red number alone is silent to a colour-blind reader.
  const errorMessage =
    over > 0
      ? `${over} character${over === 1 ? "" : "s"} over the limit`
      : field.errorMessage;

  return (
    <TextField
      className={cn("w-full", className)}
      data-cy={dataCy}
      isDisabled={isDisabled}
      isInvalid={field.isInvalid || over > 0}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      name={field.name}
      onBlur={field.onBlur}
      onChange={field.onChange}
      ref={rootRef}
      validationBehavior="aria"
      value={value}
    >
      <Label>{label}</Label>

      {/* The reading sits inside the field, pinned bottom-right. `pb-9` on the
			    textarea reserves its lane so the last line of text clears it; the
			    reading is a solid chip with a soft border, opaque over whatever is
			    behind it. */}
      <div className="relative">
        <InputGroup fullWidth>
          <InputGroup.TextArea
            className="resize-none wrap-break-word pb-9"
            placeholder={placeholder}
            rows={rows}
            style={{ maxHeight: `calc(${cappedRows}lh + 2.75rem)` }}
          />
        </InputGroup>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-2.5 bottom-2 rounded-md border px-1.5 py-0.5 shadow-sm",
            "bg-card text-[11px] leading-none tabular-nums tracking-tight",
            atLimit
              ? "border-danger/40 font-semibold text-danger"
              : "border-border/60 text-muted",
          )}
          data-cy={dataCy ? `${dataCy}-count` : undefined}
        >
          {words} {words === 1 ? "word" : "words"} · {count} / {maxLength} chars
        </span>
      </div>

      {description ? <Description>{description}</Description> : null}

      {/* Announced only when it changes - when the field crosses the cap -
			    not on every keystroke. The visible count carries the running number. */}
      <span className="sr-only" role="status">
        {over > 0 ? "Over the character limit" : ""}
      </span>

      <FieldError>{errorMessage}</FieldError>
    </TextField>
  );
}
