import { useEffect, useState, useRef } from "react";
import { saveAs } from "file-saver";
import fileDownload from "js-file-download";

const useRecorder = (): [string, boolean, () => void, () => void, () => void, any] => {
  const [audioURL, setAudioURL] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const canvas = useRef<HTMLCanvasElement | any>(null);

  let audioCtx: any;

  useEffect(() => {
    console.log("useEffect");
    // Lazily obtain recorder first time we're recording.
    if (recorder === null) {
      if (isRecording) {
        requestRecorder();
      }
      return;
    }

    // Manage recorder state.
    if (isRecording) {
      recorder.start();
    } else {
      recorder.stop();
    }

    // Obtain the audio when ready.
    const handleData = (e: BlobEvent) => {
      console.log("data: ", e.data);
      setAudioURL(URL.createObjectURL(e.data));
    };

    recorder.addEventListener("dataavailable", handleData);
    return () => recorder.removeEventListener("dataavailable", handleData);
  }, [recorder, isRecording]);

  const startRecording = () => {
    console.log("test");
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const downloadRecord = () => {
    const a = document.createElement("a");
    a.href = audioURL;
    a.download = "test"; // filename
    a.click();
  };

  return [audioURL, isRecording, startRecording, stopRecording, downloadRecord, canvas];
  async function requestRecorder() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setRecorder(new MediaRecorder(stream));
    visualize(stream);
  }

  function visualize(stream: MediaStream) {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    const canvasCtx = canvas.current?.getContext("2d");

    const source = audioCtx.createMediaStreamSource(stream);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    //analyser.connect(audioCtx.destination);

    const timer = setInterval(() => {
      draw();
    }, 100);

    function draw() {
      console.log("test");
      const WIDTH = canvas.current.width;
      const HEIGHT = canvas.current.height;

      // requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = "black";
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      canvasCtx.lineWidth = 10;
      canvasCtx.strokeStyle = "white";

      canvasCtx.beginPath();

      let sliceWidth = (WIDTH * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 128.0;
        let y = (v * HEIGHT) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.current.width, canvas.current.height / 2);
      canvasCtx.stroke();
    }
  }
};

export default useRecorder;
