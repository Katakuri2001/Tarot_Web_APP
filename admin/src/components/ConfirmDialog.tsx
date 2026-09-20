import { createContext, useContext, useRef, useState, ReactNode } from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => false);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });

  function close(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="modal-backdrop" onClick={() => close(false)}>
          <div
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="modal-title">{pending.title}</h2>
            <p id="confirm-message" className="modal-message">{pending.message}</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => close(false)} autoFocus>
                {pending.cancelLabel || "Cancel"}
              </button>
              <button className={`btn ${pending.danger ? "btn-danger" : "btn-primary"}`} onClick={() => close(true)}>
                {pending.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
