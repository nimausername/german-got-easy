import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ErrorAlertProps = {
  readonly title?: string;
  readonly message: string;
};

/**
 * Standard inline error surface for forms and session flows.
 */
export const ErrorAlert = ({ title = "Something went wrong", message }: ErrorAlertProps) => (
  <Alert variant="destructive">
    <AlertCircle />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);
