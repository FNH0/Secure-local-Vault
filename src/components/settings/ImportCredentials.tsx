
'use client';

import { useState, type ChangeEvent } from 'react';
import { useVault } from '@/providers/VaultProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Loader2, FileText, CheckCircle, XCircle, ShieldAlertIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: string[];
}

export function ImportCredentials() {
  const { importCredentialsFromCSV, isLoadingCredentials } = useVault();
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setImportResult(null); // Reset previous results
    } else {
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a CSV file to import.", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    setImportResult(null);
    
    const result = await importCredentialsFromCSV(selectedFile);
    setImportResult(result);

    if (result.successCount > 0 && result.errorCount === 0) {
      toast({ title: "Import Successful", description: `${result.successCount} credentials imported.` });
    } else if (result.successCount > 0 && result.errorCount > 0) {
      toast({ title: "Partial Import", description: `${result.successCount} imported, ${result.errorCount} failed. See details below.`, variant: "default", duration: 7000 });
    } else if (result.errorCount > 0) {
      toast({ title: "Import Failed", description: `Could not import credentials. ${result.errors[0] || 'See details below.'}`, variant: "destructive", duration: 7000 });
    } else {
       toast({ title: "Import Complete", description: "No credentials found or imported from the file." });
    }

    setIsImporting(false);
    setSelectedFile(null); 
    // Clear the file input visually - this requires direct DOM manipulation or a key change
    const fileInput = document.getElementById('csv-import-file') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = "";
    }
  };

  const totalLoading = isLoadingCredentials || isImporting;

  return (
    <Card className="bg-card border-primary/30 shadow-md shadow-primary/10">
      <CardHeader>
         <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
                <CardTitle className="text-xl font-headline text-primary">Import Credentials from CSV</CardTitle>
                <CardDescription>
                Upload a CSV file exported from your browser or another password manager.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="destructive">
            <ShieldAlertIcon className="h-4 w-4" />
            <AlertTitle>Important Security Note!</AlertTitle>
            <AlertDescription>
                The CSV file contains your passwords in **plain text**. After a successful import,
                you **must securely delete** the CSV file from your computer to protect your information.
            </AlertDescription>
        </Alert>

        <div className="space-y-2">
            <label htmlFor="csv-import-file" className="text-sm font-medium text-foreground">
                Select CSV File
            </label>
            <Input
                id="csv-import-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={totalLoading}
                className="bg-input border-primary/50 file:text-primary file:font-medium file:mr-2 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-primary/10 hover:file:bg-primary/20 cursor-pointer"
            />
            {selectedFile && <p className="text-xs text-muted-foreground">Selected: {selectedFile.name}</p>}
        </div>

        <div className="p-3 bg-muted/50 border border-dashed border-border rounded-md text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Expected CSV Format:</p>
            <p>The first row should be a header row.</p>
            <p>Recognized column headers (case-insensitive):</p>
            <ul className="list-disc list-inside pl-2">
                <li><code>name</code> (Required): The title or label for the credential.</li>
                <li><code>password</code> (Required): The password itself.</li>
                <li><code>url</code> or <code>website</code> (Optional): The website URL.</li>
                <li><code>username</code> or <code>login</code> (Optional): The username.</li>
                <li><code>notes</code> or <code>note</code> (Optional): Additional notes.</li>
            </ul>
            <p>Order of columns does not matter if headers are present. Empty values are allowed for optional fields.</p>
        </div>

        {importResult && (
          <div className="space-y-3 pt-4">
            <h4 className="font-semibold text-foreground">Import Results:</h4>
            {importResult.successCount > 0 && (
              <Alert variant="default" className="border-green-500/50 text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4 !text-green-500" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{importResult.successCount} credentials imported successfully.</AlertDescription>
              </Alert>
            )}
            {importResult.errorCount > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Errors Encountered</AlertTitle>
                <AlertDescription>
                  {importResult.errorCount} credentials could not be imported.
                  {importResult.errors.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-xs max-h-32 overflow-y-auto">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
            onClick={handleImport} 
            disabled={totalLoading || !selectedFile}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
        >
          {totalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Import Credentials
        </Button>
      </CardFooter>
    </Card>
  );
}
