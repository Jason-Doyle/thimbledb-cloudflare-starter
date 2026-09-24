import {
  createThimbleConnection,
  ThimbleConnectionError,
  type ThimbleClient,
  type ThimbleCollection,
} from "thimbledb";
import {
  notesDefinition,
  type Note,
} from "./collections";
import "./styles.css";

type AuthConfig = {
  oidcProviders: string[];
};

let client: ThimbleClient | null = null;
let notes: ThimbleCollection<Note> | null = null;
let csrfToken = "";
let lastDeletedId: string | null = null;

const authPanel = element<HTMLElement>("auth-panel");
const app = element<HTMLElement>("app");
const provider = element<HTMLSelectElement>("provider");
const token = element<HTMLTextAreaElement>("token");
const authMessage = element<HTMLParagraphElement>("auth-message");
const status = element<HTMLParagraphElement>("status");
const notesOutput = element<HTMLElement>("notes");
const restorePanel = element<HTMLElement>("restore");

element<HTMLButtonElement>("sign-in").addEventListener(
  "click",
  () => runAction(signIn),
);
element<HTMLButtonElement>("sign-out").addEventListener(
  "click",
  () => runAction(signOut),
);
element<HTMLFormElement>("note-form").addEventListener(
  "submit",
  (event) => runAction(() => addNote(event)),
);
element<HTMLButtonElement>("filter").addEventListener(
  "click",
  () => runAction(findByTitle),
);
element<HTMLButtonElement>("show-all").addEventListener(
  "click",
  () => runAction(renderAll),
);
element<HTMLButtonElement>("restore-button").addEventListener(
  "click",
  () => runAction(restoreLastDeleted),
);

try {
  await bootstrap();
} catch (error) {
  showError(error);
}

async function bootstrap(): Promise<void> {
  const auth = await fetchJson<AuthConfig>("/api/auth/config");
  provider.replaceChildren(
    ...auth.oidcProviders.map((id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = id;
      return option;
    }),
  );
  element<HTMLButtonElement>("sign-in").disabled =
    auth.oidcProviders.length === 0;
  authMessage.textContent =
    auth.oidcProviders.length === 0
      ? "Configure an OIDC provider in wrangler.jsonc before signing in."
      : "Supply an API access token from the configured OIDC provider.";

  try {
    const connection = await createThimbleConnection();
    client = connection.client;
    csrfToken = connection.config.csrfToken;
    notes = client.collection(notesDefinition);
    authPanel.hidden = true;
    app.hidden = false;
    await renderAll();
  } catch (error) {
    if (
      error instanceof ThimbleConnectionError &&
      error.status === 401
    ) {
      authPanel.hidden = false;
      app.hidden = true;
      return;
    }
    throw error;
  }
}

async function signIn(): Promise<void> {
  const providerId = provider.value;
  const accessToken = token.value.trim();
  if (!providerId || !accessToken) {
    authMessage.textContent =
      "Select a provider and supply an access token.";
    return;
  }
  const response = await fetch(
    `/api/auth/oidc/${encodeURIComponent(providerId)}/session`,
    {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: "{}",
    },
  );
  token.value = "";
  if (!response.ok) {
    authMessage.textContent =
      `Sign in failed with ${response.status}.`;
    return;
  }
  window.location.reload();
}

async function signOut(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      "x-thimble-csrf": csrfToken,
    },
    body: "{}",
  });
  if (!response.ok) {
    status.textContent =
      `Sign out failed with ${response.status}.`;
    return;
  }
  await client?.logout();
  window.location.reload();
}

async function addNote(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const collection = requireNotes();
  const title = element<HTMLInputElement>("title").value.trim();
  const body = element<HTMLTextAreaElement>("body").value.trim();
  if (!title) {
    return;
  }
  await collection.put({
    id: crypto.randomUUID(),
    title,
    body,
    lastModified: Date.now(),
  });
  element<HTMLFormElement>("note-form").reset();
  await renderAll();
}

async function findByTitle(): Promise<void> {
  const title =
    element<HTMLInputElement>("title-filter").value.trim();
  if (!title) {
    await renderAll();
    return;
  }
  const result = await requireNotes()
    .where((note) => note.title.eq(title))
    .orderBy((note) => note.lastModified.desc())
    .take(50)
    .get();
  status.textContent =
    `${result.documents.length} notes via ${result.plan}` +
    (result.indexName ? ` ${result.indexName}` : "");
  renderNotes(result.documents);
}

async function renderAll(): Promise<void> {
  const result = await requireNotes()
    .orderBy((note) => note.lastModified.desc())
    .take(100)
    .get();
  status.textContent =
    `${result.documents.length} notes via ${result.plan}`;
  renderNotes(result.documents);
}

function renderNotes(items: Note[]): void {
  notesOutput.replaceChildren(
    ...items.map((note) => {
      const article = document.createElement("article");
      const title = document.createElement("h2");
      title.textContent = note.title;
      const body = document.createElement("p");
      body.textContent = note.body || "No body";
      const metadata = document.createElement("small");
      metadata.textContent = new Date(
        note.lastModified,
      ).toLocaleString();
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger";
      remove.textContent = "Delete";
      remove.addEventListener("click", () =>
        runAction(async () => {
          await requireNotes().delete(note.id);
          lastDeletedId = note.id;
          restorePanel.hidden = false;
          await renderAll();
        }),
      );
      article.append(title, body, metadata, remove);
      return article;
    }),
  );
}

async function restoreLastDeleted(): Promise<void> {
  if (!lastDeletedId) {
    return;
  }
  await requireNotes().restore(lastDeletedId);
  lastDeletedId = null;
  restorePanel.hidden = true;
  await renderAll();
}

function requireNotes(): ThimbleCollection<Note> {
  if (!notes) {
    throw new Error("The notes collection is not connected");
  }
  return notes;
}

function runAction(operation: () => Promise<void>): void {
  void operation().catch(showError);
}

function showError(error: unknown): void {
  const message =
    error instanceof Error ? error.message : String(error);
  if (app.hidden) {
    authMessage.textContent = message;
  } else {
    status.textContent = message;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function element<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) {
    throw new Error(`Missing element: ${id}`);
  }
  return value as T;
}
