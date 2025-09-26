import { useState } from 'react';
import { KeyIcon, ClipboardIcon, CheckIcon, SparklesIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { useApi } from '../contexts/ApiContext';
import toast from 'react-hot-toast';

const TokenGenerator = () => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const { apiCall } = useApi();

  const generateToken = async () => {
    setIsLoading(true);
    try {
      // Generate token without username - backend will auto-assign
      const response = await apiCall('/api/tokens/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          autoGenerate: true
        })
      });

      if (response && response.token) {
        setToken(response.token);
        toast.success('Token generated successfully!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Token generation failed:', error);
      toast.error('Failed to generate token. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = async () => {
    if (!token) return;
    
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success('Token copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy token');
    }
  };

  const copyScript = async () => {
    if (!token) return;
    
    const script = `-- Zebux Dashboard Sync Script
loadstring(game:HttpGet("https://zebux.up.railway.app/api/lua/sync.lua"))()
WebsiteSync.SetToken("${token}")
WebsiteSync.Start()
print("✅ Zebux sync started!")`;
    
    try {
      await navigator.clipboard.writeText(script);
      setScriptCopied(true);
      toast.success('Script copied to clipboard!');
      setTimeout(() => setScriptCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy script');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
          <KeyIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Generate Sync Token</h1>
        <p className="text-gray-400 text-lg">
          Get your unique token to start syncing game data with Zebux Dashboard
        </p>
      </div>

      {/* Token Generation */}
      <div className="glass-card p-8 rounded-2xl border border-white/10">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-white mb-2">Generate Your Token</h2>
          <p className="text-gray-400">
            Click the button below to instantly generate your unique sync token
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={generateToken}
            disabled={isLoading}
            className="glass-button-enhanced px-12 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="spinner"></div>
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <SparklesIcon className="h-6 w-6" />
                <span>Generate Token</span>
              </div>
            )}
          </button>
        </div>

        {/* Token Display */}
        {token && (
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-xl border border-green-500/30 bg-green-500/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Your Token</h3>
                <div className="flex items-center space-x-2 text-green-400 text-sm">
                  <CheckIcon className="h-4 w-4" />
                  <span>Generated</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-1 glass-card p-4 rounded-lg border border-white/10 font-mono text-sm text-gray-300 break-all">
                  {token}
                </div>
                <button
                  onClick={copyToken}
                  className="glass-button-enhanced p-3 rounded-lg transition-all duration-200"
                  title="Copy token"
                >
                  {copied ? (
                    <CheckIcon className="h-5 w-5 text-green-400" />
                  ) : (
                    <ClipboardIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Script Section */}
            <div className="glass-card p-6 rounded-xl border border-purple-500/30 bg-purple-500/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Run This Script</h3>
                <button
                  onClick={copyScript}
                  className="glass-button-enhanced px-4 py-2 rounded-lg text-sm transition-all duration-200"
                >
                  {scriptCopied ? (
                    <div className="flex items-center space-x-2">
                      <CheckIcon className="h-4 w-4 text-green-400" />
                      <span>Copied!</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CodeBracketIcon className="h-4 w-4" />
                      <span>Copy Script</span>
                    </div>
                  )}
                </button>
              </div>
              
              <div className="glass-card p-4 rounded-lg border border-white/10 bg-gray-900/50">
                <pre className="text-sm text-gray-300 overflow-x-auto">
{`-- Zebux Dashboard Sync Script
loadstring(game:HttpGet("https://zebux.up.railway.app/api/lua/sync.lua"))()
WebsiteSync.SetToken("${token}")
WebsiteSync.Start()
print("✅ Zebux sync started!")`}
                </pre>
              </div>
              
              <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-blue-300 text-sm">
                  <strong>Instructions:</strong> Copy this script and run it in your Roblox executor. 
                  Your game data will automatically sync to the dashboard!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl border border-white/10 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-white font-semibold mb-2">Instant Generation</h3>
          <p className="text-gray-400 text-sm">
            No forms to fill - get your token with one click
          </p>
        </div>
        
        <div className="glass-card p-6 rounded-xl border border-white/10 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <KeyIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-white font-semibold mb-2">Secure & Unique</h3>
          <p className="text-gray-400 text-sm">
            Each token is unique and securely generated
          </p>
        </div>
        
        <div className="glass-card p-6 rounded-xl border border-white/10 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CodeBracketIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-white font-semibold mb-2">Ready-to-Use</h3>
          <p className="text-gray-400 text-sm">
            Complete script provided - just copy and run
          </p>
        </div>
      </div>

      {/* Help Section */}
      <div className="glass-card p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Need Help?</h3>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex items-start space-x-3">
            <span className="text-purple-400 font-bold">1.</span>
            <p>Generate your token using the button above</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-purple-400 font-bold">2.</span>
            <p>Copy the provided script to your clipboard</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-purple-400 font-bold">3.</span>
            <p>Run the script in your Roblox executor</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-purple-400 font-bold">4.</span>
            <p>Your data will automatically appear on the dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenGenerator;
