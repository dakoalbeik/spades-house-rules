import { useCallback, useState } from "react";
import type { ToastItem, ToastType } from "../components/Toast";

let nextId = 1;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showError = useCallback(
    (message?: string) => {
      if (message) addToast(message, "error");
    },
    [addToast],
  );

  const showSuccess = useCallback(
    (message: string) => {
      addToast(message, "success");
    },
    [addToast],
  );

  return { toasts, dismiss, showError, showSuccess, addToast };
}
