import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * A modal built on the native `<dialog>` element.
 *
 * `showModal` gives focus trapping, Escape handling and an inert background
 * for free, which a div-based modal has to reimplement badly.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) {
      return;
    }
    if (open && !element.open) {
      element.showModal();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  return (
    <dialog
      className="dialog"
      ref={dialog}
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        // Escape closes the dialog; keep React's state in step with it.
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 className="section-heading" id="confirm-title">
        {title}
      </h2>
      <p className="lede">{description}</p>
      <div className="dialog-actions">
        {/* First in the DOM, so `showModal` focuses it: pressing Enter on a
            dialog you did not expect should never be the destructive answer. */}
        <button
          className="button"
          data-variant="secondary"
          type="button"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button className="button" type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
