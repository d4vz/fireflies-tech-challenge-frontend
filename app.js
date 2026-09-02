const API_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://backend-production-6086.up.railway.app";

const STAGE_ORDER = ["uploading", "storing", "transcribing", "summarizing", "saving"];

const form = document.querySelector("#form");
const fileInput = document.querySelector("#file");
const filename = document.querySelector("#filename");
const send = document.querySelector("#send");
const stagesEl = document.querySelector("#stages");
const errorEl = document.querySelector("#error");
const detail = document.querySelector("#detail");
const listEl = document.querySelector("#list");

function parseSseBlock(block) {
  let event = "message";
  const dataLines = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }
  if (dataLines.length === 0) {
    return null;
  }
  return { event, data: JSON.parse(dataLines.join("\n")) };
}

async function* readSse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      return;
    }
    buffer += decoder.decode(chunk.value, { stream: true });
    let sep = buffer.indexOf("\n\n");
    while (sep !== -1) {
      const parsed = parseSseBlock(buffer.slice(0, sep));
      buffer = buffer.slice(sep + 2);
      if (parsed) {
        yield parsed;
      }
      sep = buffer.indexOf("\n\n");
    }
  }
}

function setStage(stage) {
  stagesEl.hidden = false;
  const current = STAGE_ORDER.indexOf(stage);
  for (const row of stagesEl.querySelectorAll(".stage")) {
    const index = STAGE_ORDER.indexOf(row.dataset.stage);
    row.classList.toggle("active", index === current);
    row.classList.toggle("done", index < current);
    const fill = index < current ? 100 : index === current ? 55 : 0;
    row.querySelector(".bar > span").style.width = `${fill}%`;
  }
}

function finishStages() {
  for (const row of stagesEl.querySelectorAll(".stage")) {
    row.classList.remove("active");
    row.classList.add("done");
    row.querySelector(".bar > span").style.width = "100%";
  }
}

function showError(message) {
  errorEl.textContent = message;
}

function listSection(title, items) {
  const heading = document.createElement("h2");
  heading.textContent = title;
  const list = document.createElement("ul");
  for (const item of items) {
    const line = document.createElement("li");
    line.textContent = item;
    list.append(line);
  }
  return [heading, list];
}

function showMeeting(meeting) {
  detail.innerHTML = "";
  const heading = document.createElement("h2");
  heading.textContent = meeting.sourceId;
  const time = document.createElement("p");
  time.className = "lede";
  time.textContent = new Date(meeting.createdAt).toLocaleString();
  const img = document.createElement("img");
  img.className = "shot";
  img.alt = "";
  img.src = meeting.blob.thumbnailUrl;
  const summaryHeading = document.createElement("h2");
  summaryHeading.textContent = "Summary";
  const summaryText = document.createElement("p");
  summaryText.textContent = meeting.summary?.text || "(no summary)";
  const transcriptHeading = document.createElement("h2");
  transcriptHeading.textContent = "Transcript";
  const transcript = document.createElement("pre");
  transcript.textContent = meeting.transcript.text || "(empty transcript)";
  detail.append(
    heading,
    time,
    img,
    summaryHeading,
    summaryText,
    ...listSection("Takeaways", meeting.summary?.takeaways ?? []),
    ...listSection("Action items", meeting.summary?.actionItems ?? []),
    transcriptHeading,
    transcript,
  );

  for (const button of listEl.querySelectorAll("button")) {
    if (button.dataset.id === meeting._id) {
      button.setAttribute("aria-current", "true");
    } else {
      button.removeAttribute("aria-current");
    }
  }
}

function renderList(meetings) {
  listEl.innerHTML = "";
  for (const meeting of meetings) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.id = meeting._id;
    button.innerHTML = "";
    const name = document.createElement("span");
    name.textContent = meeting.sourceId;
    const when = document.createElement("small");
    when.textContent = new Date(meeting.createdAt).toLocaleString();
    button.append(name, when);
    button.addEventListener("click", () => showMeeting(meeting));
    item.append(button);
    listEl.append(item);
  }
}

async function loadMeetings() {
  const res = await fetch(`${API_URL}/meetings`);
  if (!res.ok) {
    throw new Error("could not load meetings");
  }
  renderList(await res.json());
}

async function uploadFile(file) {
  showError("");
  setStage("uploading");
  const res = await fetch(`${API_URL}/meetings/upload?filename=${encodeURIComponent(file.name)}`, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = await res.json();
    throw new Error(body.error || "upload failed");
  }
  let meeting = null;
  for await (const item of readSse(res)) {
    if (item.event === "progress") {
      setStage(item.data.stage);
    }
    if (item.event === "done") {
      meeting = item.data;
    }
    if (item.event === "error") {
      throw new Error(item.data.error);
    }
  }
  if (!meeting) {
    throw new Error("upload ended without a meeting");
  }
  finishStages();
  await loadMeetings();
  showMeeting(meeting);
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  filename.textContent = file ? file.name : "Choose a video";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = fileInput.files[0];
  if (!file) {
    showError("file is required");
    return;
  }
  send.disabled = true;
  try {
    await uploadFile(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "upload failed";
    showError(message);
  } finally {
    send.disabled = false;
  }
});

loadMeetings().catch((error) => {
  const message = error instanceof Error ? error.message : "could not load meetings";
  showError(message);
});
