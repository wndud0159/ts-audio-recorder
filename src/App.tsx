import React, { useState } from "react";
import useRecorder from "./hooks/useRecorder";

function App() {
  const [audioURL, isRecording, startRecording, stopRecording, downloadRecord, analyserCanvas] = useRecorder();

  console.log(audioURL);
  return (
    <div>
      <canvas ref={analyserCanvas}></canvas>
      <audio src={`${audioURL}`} controls />
      <div className=" space-x-2 mt-3">
        <button className=" border border-green-300 px-4 rounded-md py-2" onClick={startRecording} disabled={isRecording}>
          start recording
        </button>
        <button className=" border border-green-300 px-4 rounded-md py-2" onClick={stopRecording} disabled={!isRecording}>
          stop recording
        </button>
        <button className=" border border-green-300 px-4 rounded-md py-2" onClick={downloadRecord}>
          download
        </button>
      </div>
    </div>
  );
}

export default App;
