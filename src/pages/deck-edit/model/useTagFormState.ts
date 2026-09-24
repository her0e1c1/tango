import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { getTagNameSchema } from "./queries/getTagNameSchema";

export function useTagFormState(tags: string[]) {
  const [editingTag, setEditingTag] = useState<string | undefined>(undefined);
  const [tagDeletion, setTagDeletion] = useState<string | undefined>(undefined);
  const addForm = useForm<{ name: string }>({
    defaultValues: { name: "" },
    resolver: zodResolver(getTagNameSchema(tags)),
  });
  const renameForm = useForm<{ name: string }>({
    defaultValues: { name: "" },
    resolver: zodResolver(getTagNameSchema(tags, editingTag)),
  });
  return { addForm, renameForm, editingTag, setEditingTag, tagDeletion, setTagDeletion };
}
