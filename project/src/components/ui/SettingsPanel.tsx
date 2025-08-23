import React from 'react';

export interface Settings {
  autoTTS: boolean;
  ttsRate?: number; // words-per-minute or engine-specific rate
  ttsVoice?: string; // substring hint for voice
  ttsVolume: number; // 0.0 - 1.0
  temperature: number; // 0.0 - 1.0
  keepTextInputOpen: boolean;
}

interface SettingsPanelProps {
  open: boolean;
  settings: Settings;
  onChange: (next: Partial<Settings>) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ open, settings, onChange, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-50 w-[90vw] max-w-lg bg-white rounded-2xl shadow-2xl border border-gold-200 p-6 text-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300"
          >
            Close
          </button>
        </div>

        <div className="space-y-5">
          {/* Auto TTS toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto play voice (TTS)</div>
              <div className="text-sm text-gray-500">Automatically speak assistant replies</div>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.autoTTS}
                onChange={(e) => onChange({ autoTTS: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-saffron-400 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>

          {/* TTS Rate */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Voice speed (rate)</div>
                <div className="text-sm text-gray-500">Adjust speech rate for synthesized voice</div>
              </div>
              <span className="text-sm text-gray-600">{settings.ttsRate ?? 175}</span>
            </div>
            <input
              type="range"
              min={100}
              max={250}
              step={1}
              value={settings.ttsRate ?? 175}
              onChange={(e) => onChange({ ttsRate: parseInt(e.target.value, 10) })}
              className="w-full mt-2"
            />
          </div>

          {/* TTS Volume */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Voice volume</div>
                <div className="text-sm text-gray-500">Set playback volume for TTS</div>
              </div>
              <span className="text-sm text-gray-600">{Math.round(settings.ttsVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(settings.ttsVolume * 100)}
              onChange={(e) => onChange({ ttsVolume: Math.min(1, Math.max(0, parseInt(e.target.value, 10) / 100)) })}
              className="w-full mt-2"
            />
          </div>

          {/* TTS Voice hint */}
          <div>
            <div className="font-medium">Voice selection (hint)</div>
            <div className="text-sm text-gray-500 mb-2">Optional. Example: "Hindi", "Tamil", "Zira"</div>
            <input
              type="text"
              value={settings.ttsVoice ?? ''}
              onChange={(e) => onChange({ ttsVoice: e.target.value || undefined })}
              placeholder="Auto (by language)"
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-saffron-300"
            />
          </div>

          {/* Chat temperature */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Creativity (temperature)</div>
                <div className="text-sm text-gray-500">Lower for concise factual, higher for creative responses</div>
              </div>
              <span className="text-sm text-gray-600">{settings.temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(settings.temperature * 100)}
              onChange={(e) => onChange({ temperature: Math.min(1, Math.max(0, parseInt(e.target.value, 10) / 100)) })}
              className="w-full mt-2"
            />
          </div>

          {/* Keep text input open */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Keep text input open</div>
              <div className="text-sm text-gray-500">Don't auto-close after sending a message</div>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.keepTextInputOpen}
                onChange={(e) => onChange({ keepTextInputOpen: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-saffron-400 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
