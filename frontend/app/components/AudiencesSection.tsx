"use client";

import { FormEvent, useState } from "react";
import { createAudience, deleteAudience } from "../services/audienceService";
import type { Audience, Tag } from "../types";
import { errorMessage } from "../utils";

export default function AudiencesSection({
  audiences,
  tags,
  reload,
  notice,
}: {
  audiences: Audience[];
  tags: Tag[];
  reload: () => Promise<void>;
  notice: (text: string) => void;
}) {
  const [type, setType] = useState("city");
  const [busy, setBusy] = useState(false);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true);

    try {
      await createAudience({
        name: values.name,
        filter_definition: {
          type,
          operator: type === "city" ? values.operator : "equals",
          value: values.value,
          ...(type === "custom_field" && { field: values.field }),
        },
      });
      form.reset();
      await reload();
    } catch (caught) {
      notice(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    try {
      await deleteAudience(id);
      await reload();
    } catch (caught) {
      notice(errorMessage(caught));
    }
  }

  return (
    <section>
      <h2>Audiences</h2>
      <form className="card" onSubmit={create}>
        <h3>Save a filtered audience</h3>
        <div className="form-row">
          <input name="name" placeholder="Audience name" required disabled={busy} />
          <select value={type} disabled={busy} onChange={(event) => setType(event.target.value)}>
            <option value="city">City</option>
            <option value="tag">Tag</option>
            <option value="custom_field">Custom field</option>
          </select>
          {type === "custom_field" && <input name="field" placeholder="Field name" required disabled={busy} />}
          {type === "tag" ? (
            <select name="value" required disabled={busy}>
              <option value="">Choose tag</option>
              {tags.map((tag) => <option value={tag.id} key={tag.id}>{tag.name}</option>)}
            </select>
          ) : <input name="value" placeholder="Value" required disabled={busy} />}
          {type === "city" && (
            <select name="operator" disabled={busy}>
              <option value="equals">Equals</option>
              <option value="contains">Contains</option>
            </select>
          )}
          <button disabled={busy}>{busy ? "Saving…" : "Save audience"}</button>
        </div>
      </form>
      <div className="cards audience-cards">
        {audiences.map((audience) => (
          <article className="card" key={audience.id}>
            <h3>{audience.name}</h3>
            <strong>{audience.contact_count} contacts</strong>
            <pre>{JSON.stringify(audience.filter_definition)}</pre>
            <button className="danger small" onClick={() => remove(audience.id)}>Delete</button>
          </article>
        ))}
      </div>
    </section>
  );
}
