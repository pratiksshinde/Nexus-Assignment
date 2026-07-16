"use client";

import { FormEvent, useState } from "react";
import {
  createContact,
  createTag,
  deleteContact,
  importContacts,
  updateContact,
} from "../services/contactService";
import type { Contact, Tag } from "../types";
import { errorMessage } from "../utils";
import ContactTags from "./ContactTags";

export default function ContactsSection({
  contacts,
  tags,
  reload,
  notice,
}: {
  contacts: Contact[];
  tags: Tag[];
  reload: () => Promise<void>;
  notice: (text: string) => void;
}) {
  const [busy, setBusy] = useState("");
  const [editing, setEditing] = useState<Contact | null>(null);

  async function run(key: string, task: () => Promise<void>) {
    setBusy(key);
    try { await task(); } catch (caught) { notice(errorMessage(caught)); } finally { setBusy(""); }
  }

  async function addContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await run("contact", async () => {
      const values = Object.fromEntries(new FormData(form));
      values.custom_fields = values.custom_fields ? JSON.parse(String(values.custom_fields)) : {};
      await createContact(values);
      form.reset();
      await reload();
      notice("Contact added");
    });
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = event.currentTarget;
    await run("edit", async () => {
      const values = Object.fromEntries(new FormData(form));
      values.custom_fields = values.custom_fields ? JSON.parse(String(values.custom_fields)) : {};
      await updateContact(editing.id, values);
      setEditing(null);
      await reload();
      notice("Contact updated");
    });
  }

  async function importCsv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await run("import", async () => {
      const result = await importContacts(new FormData(form));
      notice(`${result.data.added} added, ${result.data.skipped} skipped`);
      form.reset();
      await reload();
    });
  }

  async function addTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await run("tag", async () => {
      await createTag(Object.fromEntries(new FormData(form)));
      form.reset();
      await reload();
    });
  }

  function edit(contact: Contact) {
    setEditing(contact);
  }

  return (
    <section>
      <h2>Contacts</h2>
      <div className="grid two">
        <form className="card" onSubmit={addContact}>
          <h3>Add contact</h3>
          <input name="name" placeholder="Name" required disabled={Boolean(busy)} />
          <input name="email" type="email" placeholder="Email" disabled={Boolean(busy)} />
          <input name="phone" placeholder="Phone" disabled={Boolean(busy)} />
          <input name="city" placeholder="City" disabled={Boolean(busy)} />
          <textarea name="custom_fields" placeholder='Custom fields JSON, e.g. {"plan":"pro"}' rows={2} disabled={Boolean(busy)} />
          <button disabled={Boolean(busy)}>{busy === "contact" ? "Adding…" : "Add contact"}</button>
        </form>
        <div className="stack">
          <form className="card" onSubmit={importCsv}>
            <h3>Import CSV</h3>
            <input name="file" type="file" accept=".csv,text/csv" required disabled={Boolean(busy)} />
            <button disabled={Boolean(busy)}>{busy === "import" ? "Importing…" : "Import"}</button>
          </form>
          <form className="card inline" onSubmit={addTag}>
            <input name="name" placeholder="New tag" required disabled={Boolean(busy)} />
            <button disabled={Boolean(busy)}>{busy === "tag" ? "Creating…" : "Create tag"}</button>
          </form>
        </div>
      </div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email / phone</th><th>City</th><th>Tags</th><th /></tr></thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td>{contact.name}</td>
                <td>{contact.email || contact.phone}</td>
                <td>{contact.city || "—"}</td>
                <td><ContactTags key={`${contact.id}-${contact.tags.map((tag) => tag.id).join("-")}`} contact={contact} tags={tags} reload={reload} notice={notice} /></td>
                <td>
                  <div className="inline">
                    <button type="button" className="small" disabled={Boolean(busy)} onClick={() => edit(contact)}>Edit</button>
                    <button type="button" className="danger small" disabled={Boolean(busy)} onClick={() => run(`delete-${contact.id}`, async () => {
                      await deleteContact(contact.id);
                      if (editing?.id === contact.id) setEditing(null);
                      await reload();
                    })}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !busy && setEditing(null)}>
          <div className="card modal" role="dialog" aria-modal="true" aria-labelledby="edit-contact-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="spread">
              <h3 id="edit-contact-title">Edit contact</h3>
              <button type="button" className="modal-close" aria-label="Close edit form" disabled={Boolean(busy)} onClick={() => setEditing(null)}>×</button>
            </div>
            <form onSubmit={saveEdit}>
              <input name="name" defaultValue={editing.name} placeholder="Name" required disabled={Boolean(busy)} />
              <input name="email" type="email" defaultValue={editing.email || ""} placeholder="Email" disabled={Boolean(busy)} />
              <input name="phone" defaultValue={editing.phone || ""} placeholder="Phone" disabled={Boolean(busy)} />
              <input name="city" defaultValue={editing.city || ""} placeholder="City" disabled={Boolean(busy)} />
              <textarea
                name="custom_fields"
                defaultValue={editing.custom_fields ? JSON.stringify(editing.custom_fields) : ""}
                placeholder='Custom fields JSON, e.g. {"plan":"pro"}'
                rows={3}
                disabled={Boolean(busy)}
              />
              <div className="modal-actions">
                <button type="button" className="secondary" disabled={Boolean(busy)} onClick={() => setEditing(null)}>Cancel</button>
                <button disabled={Boolean(busy)}>{busy === "edit" ? "Saving…" : "Update contact"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
