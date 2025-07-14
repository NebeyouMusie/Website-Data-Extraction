
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Check, AlertCircle, ExternalLink, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DataExtractor = () => {
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const webhookUrl = 'http://localhost:5678/webhook-test/1e77976c-81bd-4cd2-97cf-215e9bfc898a';

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url || !prompt) {
      toast({
        title: "Missing Information",
        description: "Please provide both a URL and extraction prompt",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError('');
    setExtractedData(null);

    try {
      console.log('Sending extraction request:', { url, prompt });
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: [url],
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Extraction response:', data);
      
      setExtractedData(data);
      toast({
        title: "Extraction Complete",
        description: "Data has been successfully extracted from the website",
      });
    } catch (error) {
      console.error('Extraction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to extract data: ${errorMessage}`);
      toast({
        title: "Extraction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!extractedData) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
      setCopied(true);
      toast({
        title: "Copied!",
        description: "JSON data copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const examplePrompts = [
    "Extract all product names and prices",
    "Get article titles and authors",
    "Find contact information and addresses",
    "Extract job titles and company names"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Web Data Extractor
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Extract structured data from any website using AI-powered prompts. Simply enter a URL and describe what you want to extract.
          </p>
        </div>

        {/* Main Form */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Data Extraction
            </CardTitle>
            <CardDescription>
              Enter the website URL and describe what data you want to extract
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleExtract} className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm font-medium">
                  Website URL *
                </Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-12"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Enter the full URL of the website you want to extract data from
                </p>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-sm font-medium">
                  Extraction Prompt *
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe what data you want to extract..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] resize-none"
                  disabled={isLoading}
                />
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    Be specific about what data you want to extract. Examples:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.map((example, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setPrompt(example)}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors"
                        disabled={isLoading}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extract Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
                disabled={isLoading || !url || !prompt}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting Data...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Extract Data
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">Extraction Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {extractedData && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  Extracted Data
                </CardTitle>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy JSON
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>
                Successfully extracted data from the website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>Powered by n8n webhook integration for reliable data extraction</p>
        </div>
      </div>
    </div>
  );
};

export default DataExtractor;
