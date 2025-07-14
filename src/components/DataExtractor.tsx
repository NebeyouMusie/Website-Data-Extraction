
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Check, AlertCircle, ExternalLink, Database } from 'lucide-react';
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Database className="h-10 w-10 text-foreground" />
            <h1 className="text-5xl font-bold text-foreground">
              Web Data Extractor
            </h1>
          </div>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
            Extract structured data from any website using AI-powered prompts. Simply enter a URL and describe what you want to extract.
          </p>
        </div>

        {/* Main Form */}
        <Card className="shadow-lg border-2">
          <CardHeader className="pb-8">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ExternalLink className="h-6 w-6" />
              Data Extraction
            </CardTitle>
            <CardDescription className="text-base">
              Enter the website URL and describe what data you want to extract
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <form onSubmit={handleExtract} className="space-y-8">
              {/* URL Input */}
              <div className="space-y-3">
                <Label htmlFor="url" className="text-base font-medium">
                  Website URL *
                </Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-12 text-base"
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the full URL of the website you want to extract data from
                </p>
              </div>

              {/* Prompt Input */}
              <div className="space-y-3">
                <Label htmlFor="prompt" className="text-base font-medium">
                  Extraction Prompt *
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe what data you want to extract..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none text-base"
                  disabled={isLoading}
                />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Be specific about what data you want to extract. Examples:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.map((example, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setPrompt(example)}
                        className="text-sm bg-muted text-muted-foreground px-3 py-1.5 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
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
                className="w-full h-14 text-base font-medium"
                disabled={isLoading || !url || !prompt}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Extracting data...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-5 w-5" />
                    Extract Data
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading Animation */}
        {isLoading && (
          <Card className="border-2 bg-muted/50">
            <CardContent className="pt-8">
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-muted-foreground/20 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">Extracting data...</h3>
                  <p className="text-muted-foreground">Please wait while we process your request</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-2 border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-destructive mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-medium text-destructive">Extraction Error</h3>
                  <p className="text-destructive/80 text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {extractedData && !isLoading && (
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Check className="h-6 w-6 text-green-600" />
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
              <CardDescription className="text-base">
                Successfully extracted data from the website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-6 overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap text-foreground">
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-muted-foreground py-8">
          <p className="text-sm">Powered by n8n webhook integration for reliable data extraction</p>
        </div>
      </div>
    </div>
  );
};

export default DataExtractor;
