
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Check, AlertCircle, ExternalLink, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ExtractResponse {
  success: boolean;
  data?: any;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  expiresAt?: string;
  extract_id?: string;
}

const DataExtractor = () => {
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [jobStatus, setJobStatus] = useState<string>('');
  const extractionSectionRef = useRef<HTMLDivElement>(null);

  const webhookUrl = 'http://localhost:5678/webhook-test/1e77976c-81bd-4cd2-97cf-215e9bfc898a';

  const pollJobStatus = async (extractId: string): Promise<ExtractResponse> => {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'status_check',
        extract_id: extractId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const waitForCompletion = async (extractId: string): Promise<any> => {
    console.log('Starting to poll for job completion:', extractId);
    
    while (true) {
      try {
        const statusResponse = await pollJobStatus(extractId);
        console.log('Status check response:', statusResponse);
        
        setJobStatus(statusResponse.status);
        
        if (statusResponse.status === 'completed') {
          console.log('Job completed successfully');
          return statusResponse.data;
        } else if (statusResponse.status === 'failed') {
          throw new Error('Extraction job failed');
        } else if (statusResponse.status === 'cancelled') {
          throw new Error('Extraction job was cancelled');
        }
        
        // Wait 2 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error polling job status:', error);
        throw error;
      }
    }
  };

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
    setJobStatus('');

    // Smooth scroll to extraction section
    extractionSectionRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });

    try {
      console.log('Sending extraction request:', { url, prompt });
      
      // Start the extraction job
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

      const initialResponse: ExtractResponse = await response.json();
      console.log('Initial extraction response:', initialResponse);

      if (!initialResponse.success) {
        throw new Error('Failed to start extraction job');
      }

      // If the job is immediately completed, return the data
      if (initialResponse.status === 'completed') {
        setExtractedData(initialResponse.data);
        toast({
          title: "Extraction Complete",
          description: "Data has been successfully extracted from the website",
        });
        return;
      }

      // If we have an extract_id, poll for completion
      if (initialResponse.extract_id) {
        const finalData = await waitForCompletion(initialResponse.extract_id);
        setExtractedData(finalData);
        toast({
          title: "Extraction Complete",
          description: "Data has been successfully extracted from the website",
        });
      } else {
        // Fallback: treat the initial response as the final result
        setExtractedData(initialResponse.data || initialResponse);
        toast({
          title: "Extraction Complete",
          description: "Data has been successfully extracted from the website",
        });
      }
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
      setJobStatus('');
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

  const getStatusMessage = () => {
    switch (jobStatus) {
      case 'processing':
        return 'Processing your request...';
      case 'completed':
        return 'Extraction completed successfully!';
      case 'failed':
        return 'Extraction failed';
      case 'cancelled':
        return 'Extraction was cancelled';
      default:
        return 'Extracting data...';
    }
  };

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
                    {getStatusMessage()}
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

        {/* Extraction Processing Section */}
        <div ref={extractionSectionRef}>
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
                    <h3 className="text-lg font-medium">{getStatusMessage()}</h3>
                    <p className="text-muted-foreground">
                      {jobStatus === 'processing' 
                        ? 'Your extraction job is being processed. This may take a few moments...'
                        : 'Please wait while we process your request'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

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

        {/* Results Display - Only show when we have completed data */}
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

      </div>

      {/* Footer - Moved to bottom */}
      <div className="text-center text-muted-foreground py-8 border-t mt-12">
        <p className="text-sm">Powered by n8n webhook integration for reliable data extraction</p>
      </div>
    </div>
  );
};

export default DataExtractor;
