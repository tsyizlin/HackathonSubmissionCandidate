import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download } from 'lucide-react';
import { FileList, FileItem } from './file-list';

interface FileTabsProps {
  sentFiles: FileItem[];
  receivedFiles: FileItem[];
  uploadingFiles: {
    [key: string]: {
      progress: number;
      name: string;
      size: number;
      type: string;
      timestamp?: string;
    };
  };
  copiedFileCid: string | null;
  handleCopyFileCid: (fileId: string) => void;
  handleDownloadFile: (fileId: string) => void;
}

export const FileTabs: React.FC<FileTabsProps> = ({
  sentFiles,
  receivedFiles,
  uploadingFiles,
  copiedFileCid,
  handleCopyFileCid,
  handleDownloadFile,
}) => {
  const allSentFiles = [
    ...Object.entries(uploadingFiles).map(([fileId, file]) => ({
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      timestamp: new Date().toLocaleString(),
      fileId: undefined,
      isUploading: true,
      progress: file.progress,
    } as FileItem)),
    ...sentFiles,
  ];

  return (
    <Tabs defaultValue="sent" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4 font-mono">
        <TabsTrigger value="sent" className="flex items-center gap-2">
          <Upload size={16} />
          SENT_FILES
        </TabsTrigger>
        <TabsTrigger value="received" className="flex items-center gap-2">
          <Download size={16} />
          RECEIVED_FILES
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sent">
        <Card>
          <CardContent className="p-6">
            <div className="h-[250px] overflow-y-auto overflow-x-hidden space-y-4">
              <FileList
                files={allSentFiles}
                type="sent"
                copiedFileCid={copiedFileCid}
                handleCopyFileCid={handleCopyFileCid}
                handleDownloadFile={handleDownloadFile}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="received">
        <Card className="shadow-sm border-border relative overflow-hidden">
          <CardHeader className="pb-3 border-b border-border bg-card">
            <CardTitle className="text-lg font-mono">Files Received</CardTitle>
          </CardHeader>
          <CardContent className="p-0 bg-card">
            <div className="h-[250px] overflow-y-auto overflow-x-hidden p-4 relative">
              <FileList
                files={receivedFiles}
                type="received"
                copiedFileCid={copiedFileCid}
                handleCopyFileCid={handleCopyFileCid}
                handleDownloadFile={handleDownloadFile}
              />
            </div>
          </CardContent>
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none opacity-10 bg-scanline"></div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
