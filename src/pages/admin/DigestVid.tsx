/**
 * DigestVid — AIvor Weekly Video Content Tool
 *
 * Instructions page for launching and using the DigestVid local server,
 * which produces 60-second AIvor video digests (events picks / news roundups).
 */

import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import {
  Video,
  Terminal,
  ExternalLink,
  Copy,
  CheckCircle,
  Clapperboard,
  Mic,
  Film,
  Scissors,
  Download,
  Clock,
  MonitorPlay,
  Layers,
} from 'lucide-react';

const SERVER_URL = 'http://localhost:8900';

const STEPS = [
  {
    title: 'Open a terminal (WSL)',
    command: 'cd /home/robbe/aivor_digestvid && python3 video/server.py',
    description: 'Starts the DigestVid server on port 8900. Keep the terminal open while using the tool.',
  },
  {
    title: 'Open the UI',
    command: null,
    description: 'Click the button below or go to http://localhost:8900 in your browser.',
    link: SERVER_URL,
  },
  {
    title: 'Fill in 3 segments',
    command: null,
    description: 'Choose Events Picks or News Roundup tab. Enter event names, venues, dates, and descriptions (or headlines and summaries for news).',
  },
  {
    title: 'Generate Script',
    command: null,
    description: 'Click "Generate Script" to preview the AIvor voiceover. The duration budget bar shows how close you are to 60 seconds. Adjust descriptions if over budget.',
  },
  {
    title: 'Render Video',
    command: null,
    description: 'Click "Render Episode" in the bottom-right panel. Toggle "Live TTS" for real Chatterbox voice, or leave off for silent test renders. Progress bar updates through 7 steps.',
  },
  {
    title: 'Download outputs',
    command: null,
    description: 'When rendering completes, download links appear: landscape (16:9), subtitled version, vertical (9:16 for Stories/Reels), and SRT subtitle file.',
  },
];

const PIPELINE_STEPS = [
  { icon: Mic, label: 'TTS Synthesis', desc: 'Chatterbox generates AIvor voice from script' },
  { icon: Film, label: 'Segment Render', desc: 'FFmpeg composites background + text + logo + audio' },
  { icon: Layers, label: 'Concatenate', desc: 'Intro + 3 segments + outro joined into one video' },
  { icon: Clapperboard, label: 'Music Mix', desc: 'Music bed ducked to 15% under voice' },
  { icon: Scissors, label: 'Subtitles', desc: 'SRT burned into video' },
  { icon: MonitorPlay, label: 'Vertical Crop', desc: '16:9 cropped to 9:16 for Stories/Reels' },
];

export function DigestVid() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyCommand = (command: string, idx: number) => {
    navigator.clipboard.writeText(command);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">
              DigestVid
            </h1>
            <p className="text-gray-600 mt-1">
              AIvor weekly 60-second video content — events picks &amp; news roundups
            </p>
          </div>
          <a
            href={SERVER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <ExternalLink size={16} />
            Open DigestVid UI
          </a>
        </div>

        {/* Status Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Video className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Local Server Tool</h2>
              <p className="text-sm text-gray-500">
                Runs on your machine — no deployment needed
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={14} />
              <span>~18 seconds per render (test mode)</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Download size={14} />
              <span>Outputs: 16:9 + 9:16 + SRT</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mic size={14} />
              <span>Chatterbox TTS (AIvor voice)</span>
            </div>
          </div>
        </div>

        {/* Quick Start Steps */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Start</h2>
          <div className="space-y-3">
            {STEPS.map((step, idx) => (
              <div key={idx} className="card">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blkout-50 text-blkout-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                    {step.command && (
                      <div className="mt-3 flex items-center gap-2">
                        <code className="flex-1 bg-gray-900 text-green-400 text-sm px-4 py-2.5 rounded-lg font-mono overflow-x-auto">
                          {step.command}
                        </code>
                        <button
                          onClick={() => copyCommand(step.command!, idx)}
                          className="btn btn-outline btn-sm flex-shrink-0 inline-flex items-center gap-1"
                        >
                          {copiedIdx === idx ? (
                            <>
                              <CheckCircle size={14} className="text-green-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 btn btn-primary btn-sm inline-flex items-center gap-2"
                      >
                        <ExternalLink size={14} />
                        Open localhost:8900
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Overview */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Render Pipeline
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PIPELINE_STEPS.map((step, idx) => (
              <div key={idx} className="card text-center">
                <div className="w-10 h-10 bg-blkout-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <step.icon className="h-5 w-5 text-blkout-600" />
                </div>
                <h3 className="font-medium text-gray-900 text-sm">
                  {step.label}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Two Formats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">
              Weekly Events Picks
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Segment 1: Top Party
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Segment 2: Top Learning
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Segment 3: Top Rekindle
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Fields: event name, venue, date, 1-2 sentence description
            </p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">
              Weekly News Roundup
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Segment 1: Lead Story
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Segment 2: Community Spotlight
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Segment 3: What's Coming
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Fields: headline, 2-3 sentence summary, source (optional)
            </p>
          </div>
        </div>

        {/* CLI Alternative */}
        <div className="card bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Terminal size={18} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">CLI Alternative</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            You can also generate scripts and render videos entirely from the command line:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-900 text-green-400 text-xs px-3 py-2 rounded font-mono">
                node scripts/generate-script.js --sample events
              </code>
              <button
                onClick={() => copyCommand('node scripts/generate-script.js --sample events', 100)}
                className="btn btn-outline btn-sm"
              >
                {copiedIdx === 100 ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-900 text-green-400 text-xs px-3 py-2 rounded font-mono">
                python3 video/render_episode.py --sample events --no-tts --out ./output
              </code>
              <button
                onClick={() => copyCommand('python3 video/render_episode.py --sample events --no-tts --out ./output', 101)}
                className="btn btn-outline btn-sm"
              >
                {copiedIdx === 101 ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DigestVid;
