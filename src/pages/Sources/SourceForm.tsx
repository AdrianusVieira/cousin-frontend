import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";

import { mapFieldErrors } from "@/lib/api/mapFieldErrors";

import { FormField } from "@/components/FormField";
import { Modal } from "@/components/Modal";

import form from "@/styles/form.module.css";

const LABELS = {
  cancel: "Cancel",
  create: "Create source",
  description: "Description",
  name: "Name",
  title: "New Source",
};

interface FormValues {
  description: string;
  name: string;
}

interface SourceFormProps {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: { description?: string; name: string }) => void;
  serverError?: unknown;
}

export function SourceForm({ isSubmitting, onClose, onSubmit, serverError }: SourceFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<FormValues>({
    defaultValues: { description: "", name: "" },
  });

  useEffect(() => {
    mapFieldErrors(serverError, setError as Parameters<typeof mapFieldErrors>[1]);
  }, [serverError, setError]);

  const processSubmit = useCallback(
    (values: FormValues) => {
      if (!values.name.trim()) {
        setError("name", { message: "Required" });
        return;
      }

      onSubmit({
        name: values.name.trim(),
        ...(values.description.trim() ? { description: values.description.trim() } : {}),
      });
    },
    [onSubmit, setError],
  );

  return (
    <Modal
      footer={
        <>
          <button className={form.btnSecondary} onClick={onClose} type="button">
            {LABELS.cancel}
          </button>
          <button
            className={form.btnPrimary}
            disabled={isSubmitting}
            onClick={handleSubmit(processSubmit)}
            type="button"
          >
            {LABELS.create}
          </button>
        </>
      }
      onClose={onClose}
      title={LABELS.title}
    >
      <div className={form.form}>
        <FormField error={errors.name?.message} label={LABELS.name} required>
          <input className={form.input} type="text" {...register("name")} />
        </FormField>

        <FormField label={LABELS.description}>
          <input className={form.input} type="text" {...register("description")} />
        </FormField>
      </div>
    </Modal>
  );
}
