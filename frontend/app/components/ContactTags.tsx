"use client";

import { useState } from "react";
import { updateContactTags } from "../services/contactService";
import type { Contact, Tag } from "../types";
import { errorMessage } from "../utils";

export default function ContactTags({
  contact,
  tags,
  reload,
  notice,
}: {
  contact: Contact;
  tags: Tag[];
  reload: () => Promise<void>;
  notice: (text: string) => void;
}) {
  const [selected, setSelected] = useState(contact.tags.map((tag) => tag.id));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateContactTags(contact.id, selected);
      await reload();
    } catch (caught) {
      notice(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="tag-editor">
      {tags.map((tag) => (
        <label key={tag.id}>
          <input
            type="checkbox"
            disabled={saving}
            checked={selected.includes(tag.id)}
            onChange={() => setSelected((ids) => ids.includes(tag.id) ? ids.filter((id) => id !== tag.id) : [...ids, tag.id])}
          />
          {tag.name}
        </label>
      ))}
      <button className="small" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save tags"}</button>
    </div>
  );
}
