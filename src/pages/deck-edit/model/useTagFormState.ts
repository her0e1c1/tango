import { useForm } from "react-hook-form";

export function useTagFormState() {
  const addForm = useForm<{ name: string }>({ defaultValues: { name: "" } });
  const renameForm = useForm<{ name: string }>({ defaultValues: { name: "" } });
  return { addForm, renameForm };
}
