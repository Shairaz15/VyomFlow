import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Upload, RefreshCw, Key, 
  AlertCircle, Code, Copy, Check, Terminal,
  FileAudio, Settings, Send, Languages, Globe
} from 'lucide-react';

export const SarvamTest: React.FC = () => {
  const [apiKey, setApiKey] = useState('sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad');
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'mic' | 'upload' | 'code'>('mic');
  
  // Settings - Focused on Translate Mode
  const [model, setModel] = useState('saaras:v4');
  const [languageCode, setLanguageCode] = useState('hi-IN'); // Default to Hindi
  const mode = 'translate';
  const sampleRate = 16000;
  const proxyPort = 5001;

  // Statuses
  const [isRecording, setIsRecording] = useState(false);
  const [isProxyConnected, setIsProxyConnected] = useState<boolean | null>(null);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Transcripts & Logs
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [logs, setLogs] = useState<{ id: string; time: string; text: string; type: 'info' | 'success' | 'error' | 'ws' }[]>([]);
  const [rawResponse, setRawResponse] = useState<any>(null);

  // File Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTranscribingFile, setIsTranscribingFile] = useState(false);

  // Copy state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Audio & WS Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const addLog = (text: string, type: 'info' | 'success' | 'error' | 'ws' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ id: Math.random().toString(), time, text, type }, ...prev.slice(0, 49)]);
  };

  // Check Proxy Server Health
  const checkProxyHealth = async () => {
    try {
      const res = await fetch(`http://localhost:${proxyPort}/health`);
      if (res.ok) {
        setIsProxyConnected(true);
        addLog(`Sarvam Proxy connected on http://localhost:${proxyPort}`, 'success');
      } else {
        setIsProxyConnected(false);
      }
    } catch {
      setIsProxyConnected(false);
    }
  };

  useEffect(() => {
    checkProxyHealth();
  }, [proxyPort]);

  // Handle WebSocket Connection
  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    setWsStatus('connecting');
    setErrorMsg(null);
    addLog(`Connecting to Sarvam Translation WS (mode=${mode}, lang=${languageCode}, model=${model})...`, 'ws');

    const wsUrl = `ws://localhost:${proxyPort}?model=${model}&language-code=${languageCode}&mode=${mode}&sample_rate=${sampleRate}&api_key=${encodeURIComponent(apiKey)}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsStatus('connected');
      addLog(`WebSocket Translation Connected! Ready for Indian speech audio stream.`, 'success');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        addLog(`Received response: ${JSON.stringify(msg)}`, 'ws');

        if (msg.type === 'data') {
          const newText = msg.data?.transcript || '';
          setTranscript((prev) => prev + (prev ? ' ' : '') + newText);
          setInterimTranscript('');
          setRawResponse(msg);
        } else if (msg.type === 'error') {
          setErrorMsg(msg.data?.error || 'WebSocket Error');
          addLog(`Sarvam Error: ${msg.data?.error}`, 'error');
        }
      } catch (err) {
        addLog(`Raw WS message: ${event.data}`, 'ws');
      }
    };

    ws.onerror = () => {
      setWsStatus('error');
      setErrorMsg('WebSocket connection error. Make sure node proxy is running (`npm run sarvam-proxy`)!');
      addLog('WebSocket error encountered', 'error');
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      addLog('WebSocket connection closed.', 'info');
    };

    wsRef.current = ws;
    return ws;
  };

  // Convert Float32 PCM to Int16 PCM WAV buffer
  const convertFloat32ToInt16 = (buffer: Float32Array): ArrayBuffer => {
    let l = buffer.length;
    let buf = new Int16Array(l);
    while (l--) {
      let s = Math.max(-1, Math.min(1, buffer[l]));
      buf[l] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return buf.buffer;
  };

  // Start Live Mic Recording
  const startRecording = async () => {
    try {
      setTranscript('');
      setInterimTranscript('');
      setErrorMsg(null);

      connectWebSocket();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      addLog('Microphone active. Translating voice to English text live...', 'info');

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const int16Buffer = convertFloat32ToInt16(inputData);
        
        const bytes = new Uint8Array(int16Buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        wsRef.current.send(JSON.stringify({
          audio: {
            data: base64Data,
            sample_rate: '16000',
            encoding: 'audio/wav',
          },
        }));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setIsRecording(true);
      addLog('Recording live! Speak in Hindi or another Indian language to translate to English.', 'success');

    } catch (err: any) {
      setErrorMsg(`Microphone error: ${err.message}`);
      addLog(`Mic Error: ${err.message}`, 'error');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (processorRef.current && audioContextRef.current) {
      processorRef.current.disconnect();
      sourceRef.current?.disconnect();
      audioContextRef.current.close();
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'flush' }));
      addLog('Sent flush signal to Sarvam Translation API.', 'info');
    }

    setIsRecording(false);
    addLog('Recording stopped.', 'info');
  };

  // Handle Audio File Upload Speech Translation
  const handleFileTranscribe = async () => {
    if (!selectedFile) return;

    setIsTranscribingFile(true);
    setErrorMsg(null);
    addLog(`Uploading file '${selectedFile.name}' for English Translation...`, 'info');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Use dedicated REST translate endpoint
      let targetEndpoint = 'https://api.sarvam.ai/speech-to-text-translate';
      let selectedModel = model === 'saaras:v4' ? 'saaras:v3' : model;

      formData.append('model', selectedModel);
      if (languageCode !== 'unknown') {
        formData.append('language_code', languageCode);
      }

      let response;
      try {
        response = await fetch(targetEndpoint, {
          method: 'POST',
          headers: { 'api-subscription-key': apiKey },
          body: formData,
        });
      } catch (corsErr) {
        addLog('Routing through local proxy translate endpoint...', 'info');
        response = await fetch(`http://localhost:${proxyPort}/api/translate`, {
          method: 'POST',
          body: formData,
        });
      }

      const data = await response.json();
      setRawResponse(data);

      if (response.ok) {
        setTranscript(data.transcript || 'No translation returned.');
        addLog('File translation to English successful!', 'success');
      } else {
        const errStr = data.error?.message || data.message || JSON.stringify(data);
        setErrorMsg(`Sarvam Translate Error: ${errStr}`);
        addLog(`File Translation Error: ${errStr}`, 'error');
      }
    } catch (err: any) {
      setErrorMsg(`Failed to translate file: ${err.message}`);
      addLog(`Network/Server Error: ${err.message}`, 'error');
    } finally {
      setIsTranscribingFile(false);
    }
  };

  const nodeTranslateCodeExample = `// Sarvam AI Speech-to-English TRANSLATION (Node.js)
import fs from 'node:fs';
import WebSocket from 'ws';

const API_KEY = '${apiKey}';
const MODEL = '${model}';
const LANG = '${languageCode}'; // Spoken language: 'hi-IN' (Hindi), 'ta-IN' (Tamil), etc.
const MODE = 'translate';      // Translates spoken speech into English text
const SAMPLE_RATE = ${sampleRate};

const URL = \`wss://api.sarvam.ai/speech-to-text/ws?model=\${MODEL}&language-code=\${LANG}&mode=\${MODE}&sample_rate=\${SAMPLE_RATE}\`;

console.log('Connecting to Sarvam AI Speech-to-English Translation WebSocket...');

const ws = new WebSocket(URL, {
  headers: { 'Api-Subscription-Key': API_KEY },
});

ws.on('open', () => {
  console.log('Connected! Streaming audio for English translation...');
  
  // Audio file containing spoken Hindi/Indian speech (16kHz PCM WAV)
  const audio = fs.readFileSync('audio.wav');
  const chunkSize = 4096;
  
  for (let i = 0; i < audio.length; i += chunkSize) {
    const chunk = audio.subarray(i, i + chunkSize);
    ws.send(JSON.stringify({
      audio: {
        data: chunk.toString('base64'),
        sample_rate: String(SAMPLE_RATE),
        encoding: 'audio/wav',
      },
    }));
  }
  
  ws.send(JSON.stringify({ type: 'flush' }));
});

let englishTranslation = '';

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());

  if (msg.type === 'data') {
    englishTranslation = msg.data.transcript ?? '';
    console.log('🇬🇧 English Translation:', englishTranslation);
  } else if (msg.type === 'error') {
    console.error('Sarvam Error:', msg.data.error);
    ws.close();
  }
});
`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/20">
              <Languages className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Sarvam AI Speech Translation Studio
              </h1>
              <p className="text-sm text-slate-400">
                Real-time Speech-to-English Translation for Indian Languages
              </p>
            </div>
          </div>

          {/* Proxy Health Indicator */}
          <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800">
            <div className={`w-3 h-3 rounded-full animate-pulse ${isProxyConnected ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-amber-400 shadow-lg shadow-amber-500/50'}`} />
            <div className="text-xs">
              <div className="font-semibold text-slate-300">
                {isProxyConnected ? 'Proxy Server Online' : 'Direct Mode'}
              </div>
              <div className="text-slate-500">
                {isProxyConnected ? `http://localhost:${proxyPort}` : `Run 'npm run sarvam-proxy'`}
              </div>
            </div>
            <button 
              onClick={checkProxyHealth}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Refresh proxy status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Translation Banner Guide */}
        <div className="p-4 bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-slate-900/90 border border-purple-800/60 rounded-xl text-purple-200 text-xs flex items-start gap-3 shadow-lg">
          <Globe className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-purple-100 flex items-center gap-2">
              🌐 Speech-to-English Translation Ready
            </div>
            <div>
              Speak in <strong>Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, or Punjabi</strong>. Sarvam AI translates your voice into <strong>English text</strong> in real-time.
            </div>
            <div className="text-purple-300 italic">
              👉 <strong>Example:</strong> Speak <em>"Mera naam Rahul hai"</em> → Output: <strong>"My name is Rahul"</strong>
            </div>
          </div>
        </div>

        {/* API Key & Configuration Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* API Key */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-purple-400" />
              Api-Subscription-Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                placeholder="sk_..."
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Input Spoken Language */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-pink-400" />
              Spoken Input Language
            </label>
            <select
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
              className="w-full bg-slate-950 border border-pink-500/50 text-pink-200 font-bold rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-pink-500"
            >
              <option value="hi-IN">🇮🇳 Hindi (hi-IN) - Recommended</option>
              <option value="unknown">🔍 Auto-Detect Spoken Language</option>
              <option value="ta-IN">🇮🇳 Tamil (ta-IN)</option>
              <option value="te-IN">🇮🇳 Telugu (te-IN)</option>
              <option value="mr-IN">🇮🇳 Marathi (mr-IN)</option>
              <option value="bn-IN">🇮🇳 Bengali (bn-IN)</option>
              <option value="gu-IN">🇮🇳 Gujarati (gu-IN)</option>
              <option value="kn-IN">🇮🇳 Kannada (kn-IN)</option>
              <option value="ml-IN">🇮🇳 Malayalam (ml-IN)</option>
              <option value="pa-IN">🇮🇳 Punjabi (pa-IN)</option>
              <option value="en-IN">🇬🇧 English (en-IN)</option>
            </select>
          </div>

          {/* Model Selection */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              Sarvam STT Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
            >
              <option value="saaras:v4">saaras:v4 (Latest WebSocket)</option>
              <option value="saaras:v3">saaras:v3 (REST Translate & WS)</option>
              <option value="saaras:v2.5">saaras:v2.5</option>
              <option value="saaras:v2">saaras:v2</option>
            </select>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('mic')}
            className={`flex items-center gap-2 px-5 py-3 font-medium text-sm border-b-2 transition-all ${
              activeTab === 'mic'
                ? 'border-purple-500 text-purple-400 bg-purple-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            Live Microphone Speech Translation
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-5 py-3 font-medium text-sm border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Audio File Translation
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-5 py-3 font-medium text-sm border-b-2 transition-all ${
              activeTab === 'code'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            Node.js Code
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-xs text-rose-400 hover:text-rose-200">
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: Live Microphone Translation */}
        {activeTab === 'mic' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Control Panel */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between items-center text-center space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-slate-200">Speech-to-English Translation</h3>
                <p className="text-xs text-slate-400">
                  Speak in Hindi/Indian language into your microphone to translate to English text live
                </p>
              </div>

              {/* Mic Visualizer Button */}
              <div className="relative">
                {isRecording && (
                  <div className="absolute -inset-4 bg-purple-500/30 rounded-full blur-xl animate-ping" />
                )}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 shadow-2xl ${
                    isRecording
                      ? 'bg-gradient-to-tr from-rose-600 to-pink-500 shadow-rose-500/40 text-white'
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/30 text-white'
                  }`}
                >
                  {isRecording ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
                </button>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-300">
                  {isRecording ? '🔴 Listening & Translating to English...' : 'Click mic to start speaking'}
                </div>
                <div className="text-xs text-slate-500">
                  Spoken input: <strong className="text-pink-400 font-mono">{languageCode}</strong>
                </div>
              </div>
            </div>

            {/* English Output Box */}
            <div className="lg:col-span-2 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                    <Languages className="w-4 h-4 text-purple-400" />
                    🇬🇧 English Translation Output
                  </h3>
                  {transcript && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(transcript);
                          setCopiedTranscript(true);
                          setTimeout(() => setCopiedTranscript(false), 1500);
                        }}
                        className="text-xs text-purple-400 hover:text-purple-200"
                      >
                        {copiedTranscript ? 'Copied!' : 'Copy Translation'}
                      </button>
                      <button
                        onClick={() => setTranscript('')}
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <div className="min-h-[220px] p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm leading-relaxed text-slate-200 relative overflow-y-auto max-h-[300px]">
                  {transcript ? (
                    <div>
                      <span>{transcript}</span>
                      {interimTranscript && (
                        <span className="text-purple-400 italic"> {interimTranscript}</span>
                      )}
                      {isRecording && <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse" />}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 italic">
                      {isRecording 
                        ? 'Listening to Indian speech... Translating to English...' 
                        : 'Speak in Hindi (e.g. "Mera naam Rahul hai"). English translation will appear here in real time...'}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Info */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
                <span>WS Status: <strong className="text-slate-300 capitalize">{wsStatus}</strong></span>
                <span>Spoken Language: <strong className="text-pink-400">{languageCode}</strong></span>
                <span>Model: <strong className="text-indigo-300">{model}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: File Upload */}
        {activeTab === 'upload' && (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-6">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-slate-200">
                Audio File Speech-to-English Translation
              </h3>
              <p className="text-xs text-slate-400">
                Upload an audio file in Hindi or an Indian language to translate it into English text
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* File Drop Area */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-700 hover:border-purple-500 bg-slate-950/60 p-8 rounded-xl flex flex-col items-center justify-center text-center transition-colors">
                  <FileAudio className="w-12 h-12 text-purple-400 mb-3" />
                  <div className="text-sm font-medium text-slate-300">
                    {selectedFile ? selectedFile.name : 'Choose or drop an audio file'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Supports WAV, MP3, M4A, WEBM, FLAC'}
                  </div>

                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="audio-upload-input"
                  />
                  
                  <label
                    htmlFor="audio-upload-input"
                    className="mt-4 px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-colors"
                  >
                    Select Audio File
                  </label>
                </div>

                <button
                  disabled={!selectedFile || isTranscribingFile}
                  onClick={handleFileTranscribe}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isTranscribingFile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Translating audio file to English...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Translate Audio File to English
                    </>
                  )}
                </button>
              </div>

              {/* Output Display */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  🇬🇧 English Translation Output
                </label>
                <div className="min-h-[180px] p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm leading-relaxed text-slate-200 overflow-y-auto max-h-[250px]">
                  {transcript ? (
                    transcript
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 italic">
                      English translation output will appear here...
                    </div>
                  )}
                </div>

                {rawResponse && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Raw API JSON Response</label>
                    <pre className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto max-h-[140px]">
                      {JSON.stringify(rawResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Node Code */}
        {activeTab === 'code' && (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-200">Sarvam AI Speech-to-English Translation Node.js Script</h3>
                <p className="text-xs text-slate-400">
                  Node.js code configured for real-time speech translation into English
                </p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(nodeTranslateCodeExample);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
              {nodeTranslateCodeExample}
            </pre>
          </div>
        )}

        {/* Live Logs Terminal */}
        <div className="p-5 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Event Console Logs
            </h4>
            <button onClick={() => setLogs([])} className="text-xs text-slate-500 hover:text-slate-300">
              Clear Console
            </button>
          </div>

          <div className="font-mono text-xs max-h-40 overflow-y-auto space-y-1">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-slate-600 select-none">[{log.time}]</span>
                  <span
                    className={
                      log.type === 'error'
                        ? 'text-rose-400 font-semibold'
                        : log.type === 'success'
                        ? 'text-emerald-400'
                        : log.type === 'ws'
                        ? 'text-purple-400'
                        : 'text-slate-300'
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-600 italic">No events logged yet. Perform a microphone recording or file upload to view live logs.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
