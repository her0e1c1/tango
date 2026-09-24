import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { getTagNameSchema } from "./queries/getTagNameSchema";

export function useTagFormState(tags: string[], editingTag: string | undefined) {
  const addForm = useForm<{ name: string }>({
    defaultValues: { name: "" },
    resolver: zodResolver(getTagNameSchema(tags)),
  });
  const renameForm = useForm<{ name: string }>({
    defaultValues: { name: "" },
    resolver: zodResolver(getTagNameSchema(tags, editingTag)),
  });
  return { addForm, renameForm };
}
