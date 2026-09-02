type ScreenShareOptions = DisplayMediaStreamOptions & {
  systemAudio?: "include" | "exclude";
  windowAudio?: "system" | "window" | "exclude";
  monitorTypeSurfaces?: "include" | "exclude";
  selfBrowserSurface?: "include" | "exclude";
  surfaceSwitching?: "include" | "exclude";
};

type DisplayAudioConstraints = MediaTrackConstraints & {
  suppressLocalAudioPlayback?: boolean;
};

export type ScreenRecording = {
  stop: () => void;
  done: Promise<File>;
  computerAudio: boolean;
};

function pickMimeType() {
  const types = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function stopTracks(stream: MediaStream) {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function liveAudioTracks(stream: MediaStream) {
  return stream
    .getAudioTracks()
    .filter((track) => track.enabled && track.readyState === "live" && !track.muted);
}

function isMac() {
  return navigator.userAgent.includes("Mac");
}

function computerAudioTracks(display: MediaStream) {
  const tracks = liveAudioTracks(display);
  if (tracks.length === 0) {
    return [];
  }
  const surface = display.getVideoTracks()[0]?.getSettings().displaySurface;
  if (surface === "monitor" && isMac()) {
    return [];
  }
  return tracks;
}

function dropAudio(stream: MediaStream, keep: MediaStreamTrack[]) {
  for (const track of stream.getAudioTracks()) {
    if (!keep.includes(track)) {
      stream.removeTrack(track);
      track.stop();
    }
  }
}

type MicAudioConstraints = MediaTrackConstraints & {
  voiceIsolation?: boolean;
};

function micConstraints(): MicAudioConstraints {
  return {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    voiceIsolation: false,
  };
}

async function mixAudio(display: MediaStream, mic: MediaStream | undefined) {
  const displayAudio = computerAudioTracks(display);
  dropAudio(display, displayAudio);
  const micAudio = mic ? liveAudioTracks(mic) : [];
  const computerAudio = displayAudio.length > 0;

  if (displayAudio.length === 0 && micAudio.length === 0) {
    return { stream: display, close: () => undefined, computerAudio };
  }
  if (displayAudio.length > 0 && micAudio.length === 0) {
    return { stream: display, close: () => undefined, computerAudio };
  }
  if (displayAudio.length === 0 || isMac()) {
    dropAudio(display, []);
    return {
      stream: new MediaStream([...display.getVideoTracks(), ...micAudio]),
      close: () => undefined,
      computerAudio: false,
    };
  }

  const sampleRate = micAudio[0]?.getSettings().sampleRate;
  const context = new AudioContext(
    sampleRate ? { sampleRate, latencyHint: "interactive" } : { latencyHint: "interactive" },
  );
  await context.resume();
  const destination = context.createMediaStreamDestination();
  context.createMediaStreamSource(new MediaStream(displayAudio)).connect(destination);
  context.createMediaStreamSource(new MediaStream(micAudio)).connect(destination);
  return {
    stream: new MediaStream([...display.getVideoTracks(), ...destination.stream.getAudioTracks()]),
    close: () => {
      void context.close();
    },
    computerAudio,
  };
}

export async function startScreenRecording(): Promise<ScreenRecording> {
  const audio: DisplayAudioConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    suppressLocalAudioPlayback: false,
  };
  const options: ScreenShareOptions = {
    video: { frameRate: { ideal: 30 }, displaySurface: "browser" },
    audio,
    systemAudio: "include",
    windowAudio: "system",
    monitorTypeSurfaces: "include",
    selfBrowserSurface: "exclude",
    surfaceSwitching: "include",
  };
  const display = await navigator.mediaDevices.getDisplayMedia(options);

  let mic: MediaStream | undefined;
  try {
    mic = await navigator.mediaDevices.getUserMedia({ audio: micConstraints() });
  } catch {
    mic = undefined;
  }

  const mixed = await mixAudio(display, mic);
  const mimeType = pickMimeType();
  const recorder = mimeType
    ? new MediaRecorder(mixed.stream, { mimeType, audioBitsPerSecond: 256000 })
    : new MediaRecorder(mixed.stream, { audioBitsPerSecond: 256000 });
  const chunks: Blob[] = [];

  let finish = (_file: File) => {};
  const done = new Promise<File>((resolve) => {
    finish = resolve;
  });

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });
  recorder.addEventListener("stop", () => {
    stopTracks(display);
    if (mic) {
      stopTracks(mic);
    }
    mixed.close();
    const type = recorder.mimeType || "video/webm";
    finish(
      new File(chunks, "screen-recording.webm", {
        type,
      }),
    );
  });

  const video = display.getVideoTracks()[0];
  video?.addEventListener("ended", () => {
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  });

  recorder.start(1000);

  return {
    done,
    computerAudio: mixed.computerAudio,
    stop: () => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    },
  };
}
