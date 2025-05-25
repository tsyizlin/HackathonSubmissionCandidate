import React, { useState, useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Server, Radio, Check, AlertCircle, Info } from "lucide-react";
import { useCodex, CodexEndpointType } from "@/hooks/useCodex";
import useWaku from "@/hooks/useWaku";

interface ExtendedNodeInfo {
  id: string;
  version: string;
  revision?: string;
  status: string;
  uptime: string;
  peers?: number;
}

interface SettingsSheetProps {
  codexNodeUrl: string;
  setCodexNodeUrl: (url: string) => void;
  codexEndpointType: CodexEndpointType;
  setCodexEndpointType: (type: CodexEndpointType) => void;
  wakuNodeUrl: string;
  setWakuNodeUrl: (url: string) => void;
  wakuNodeType: 'light' | 'relay';
  setWakuNodeType: (type: 'light' | 'relay') => void;
  addWakuDebugLog: (type: 'info' | 'error' | 'success', message: string) => void;
  onSave: () => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  codexNodeUrl,
  setCodexNodeUrl,
  codexEndpointType,
  setCodexEndpointType,
  wakuNodeUrl,
  setWakuNodeUrl,
  wakuNodeType,
  setWakuNodeType,
  addWakuDebugLog,
  onSave,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [nodeInfo, setNodeInfo] = useState<ExtendedNodeInfo | null>(null);

  const {
    isNodeActive: isCodexNodeActive,
    isLoading: isCodexLoading,
    updateConfig: updateCodexConfig,
    checkNodeStatus: checkCodexStatus,
    error: codexError,
    getNodeInfo,
  } = useCodex(codexNodeUrl);

  const {
    isConnecting: isWakuConnecting,
    isConnected: isWakuConnected,
    error: wakuError,
    peerCount: wakuPeerCount,
    contentTopic: wakuContentTopic,
  } = useWaku({
    roomId: 'dummy', // Room ID is not directly used in settings sheet, provide a dummy
    wakuNodeUrl,
    wakuNodeType,
    onFileReceived: () => {}, // Dummy callback
  });

  const isValidNodeInfo = (info: unknown): info is ExtendedNodeInfo => {
    if (!info || typeof info !== 'object') return false;
    const nodeInfo = info as Partial<ExtendedNodeInfo>;
    return (
      typeof nodeInfo.version === 'string' &&
      typeof nodeInfo.status === 'string' &&
      typeof nodeInfo.uptime === 'string' &&
      (typeof nodeInfo.id === 'string' || nodeInfo.id === undefined) &&
      (typeof nodeInfo.revision === 'string' || nodeInfo.revision === undefined) &&
      (typeof nodeInfo.peers === 'number' || nodeInfo.peers === undefined)
    );
  };

  useEffect(() => {
    if (isCodexNodeActive && !isCodexLoading) {
      const fetchNodeInfo = async () => {
        const info = await getNodeInfo();
        if (info && isValidNodeInfo(info)) {
          setNodeInfo(info);
        } else {
          setNodeInfo(null);
        }
      };
      fetchNodeInfo();
    } else {
      setNodeInfo(null);
    }
  }, [isCodexNodeActive, isCodexLoading, getNodeInfo]);

  const handleSaveConfig = async () => {
    if (codexEndpointType === 'local' && (!codexNodeUrl.trim() || !codexNodeUrl.startsWith('http'))) {
      alert('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setIsSaving(true);

    const urlToUse = codexEndpointType === 'remote'
      ? (process.env.NEXT_PUBLIC_CODEX_REMOTE_API_URL || "")
      : codexNodeUrl;

    updateCodexConfig(urlToUse, codexEndpointType);
    onSave(); // Trigger save action in parent

    setSaveSuccess(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(false);
    }, 2000);
  };

  const handleEndpointTypeChange = (type: CodexEndpointType) => {
    setCodexEndpointType(type);
    const newUrl = type === 'remote'
      ? (process.env.NEXT_PUBLIC_CODEX_REMOTE_API_URL || "")
      : (process.env.NEXT_PUBLIC_CODEX_LOCAL_API_URL || "http://localhost:8080/api/codex");
    setCodexNodeUrl(newUrl);
    updateCodexConfig(newUrl, type);
  };

  const renderNodeInfo = () => {
    if (!nodeInfo || !isValidNodeInfo(nodeInfo)) return null;
    return (
      <div className="mt-3 p-2 bg-card/50 border border-primary/10 rounded-md">
        <div className="flex items-center gap-1 mb-1">
          <Info size={12} className="text-primary/70" />
          <span className="text-xs font-medium text-primary/90 font-mono">NODE_INFO</span>
        </div>
        <div className="space-y-1 pl-4 border-l border-primary/10">
          <p className="text-xs font-mono flex items-center justify-between">
            <span className="text-muted-foreground">ID:</span>
            <span className="text-primary/80 truncate max-w-[180px]" title={nodeInfo.id}>
              {nodeInfo.id}
            </span>
          </p>
          <p className="text-xs font-mono flex items-center justify-between">
            <span className="text-muted-foreground">VERSION:</span>
            <span className="text-primary/80">
              {nodeInfo.version} ({nodeInfo.revision ?? 'N/A'})
            </span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="p-2.5 rounded-full hover:bg-accent/80 hover:scale-105 transition-all duration-200 flex items-center justify-center relative border border-primary/20"
          aria-label="Open settings"
        >
          <Settings size={20} className="text-primary" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="p-5 flex flex-col">
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-scanline"></div>
        <SheetHeader className="px-1 pb-4 mb-6 border-b border-border">
          <SheetTitle className="text-xl font-mono">SYSTEM_CONFIG</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground font-mono">
            Configure Codex and Waku settings
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 px-1 flex-1 overflow-y-auto">
          {/* Codex Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Server size={16} className="text-primary" />
                </div>
                <h3 className="text-base font-medium font-mono">CODEX_SETTINGS</h3>
              </div>
              {isCodexLoading ? (
                <div className="w-2 h-2 rounded-full bg-amber-700/70 animate-pulse" title="Checking node status..."></div>
              ) : isCodexNodeActive ? (
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Node is active"></div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-amber-600/80" title="Node is not active"></div>
              )}
            </div>

            <div className="space-y-4 pl-2 ml-2 border-l border-border">
              <div className="space-y-2">
                <label className="text-sm font-medium font-mono">ENDPOINT_TYPE</label>
                <Tabs
                  value={codexEndpointType}
                  onValueChange={(value) => handleEndpointTypeChange(value as CodexEndpointType)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 font-mono">
                    <TabsTrigger value="remote">REMOTE_NODE</TabsTrigger>
                    <TabsTrigger value="local">LOCAL_NODE</TabsTrigger>
                  </TabsList>
                </Tabs>

                {codexEndpointType === 'remote' && (
                  <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded-md">
                    <p className="text-xs text-primary/90 font-mono flex items-center gap-1">
                      <Info size={12} />
                      Use local Codex node for peak decentralization
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="codex-url" className="text-sm font-medium font-mono">API_ENDPOINT</label>
                {codexEndpointType === 'local' ? (
                  <>
                    <Input
                      id="codex-url"
                      value={codexNodeUrl}
                      onChange={(e) => setCodexNodeUrl(e.target.value)}
                      placeholder="http://localhost:8080/api/codex"
                      className="font-mono text-sm bg-card/70"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-mono">
                        Local Codex node API endpoint URL
                      </p>
                      <div className="flex items-center gap-1">
                        {isCodexNodeActive ? (
                          <span className="text-xs text-green-500 font-mono flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600/90 font-mono flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600/80"></span>
                            {isCodexLoading ? "CHECKING" : "OFFLINE"}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => checkCodexStatus(true)}
                          className="h-6 w-6 p-0 rounded-full"
                          title="Refresh node status"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                            <path d="M21 3v5h-5"></path>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                            <path d="M3 21v-5h5"></path>
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-card/70 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-mono text-muted-foreground">
                        Managed Codex endpoint
                      </p>
                      <div className="flex items-center gap-1">
                        {isCodexNodeActive ? (
                          <span className="text-xs text-green-500 font-mono flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600/90 font-mono flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600/80"></span>
                            {isCodexLoading ? "CHECKING" : "OFFLINE"}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => checkCodexStatus(true)}
                          className="h-6 w-6 p-0 rounded-full"
                          title="Refresh node status"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                            <path d="M21 3v5h-5"></path>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                            <path d="M3 21v-5h5"></path>
                          </svg>
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-2">
                      Restrictions apply. <a href="https://github.com/hackyguru/cyphershare/docs/restrictions.md" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Know more</a>
                    </p>
                  </div>
                )}
                {codexError && (
                  <p className="text-xs text-amber-600/90 font-mono mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Error: {codexError}
                  </p>
                )}
                {!isCodexNodeActive && !isCodexLoading && !codexError && (
                  <p className="text-xs text-amber-600/90 font-mono mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Codex node is not running in the API endpoint
                  </p>
                )}

                {/* Alert for adblocker when node is inactive */}
                {!isCodexNodeActive && !isCodexLoading && (
                  <div className="mt-2 p-2 bg-amber-600/20 border border-amber-600/30 rounded-md">
                    <p className="text-xs text-amber-600/90 font-mono flex items-center gap-1">
                      <AlertCircle size={12} />
                      Turn off adblockers to avoid Codex node detection issues
                    </p>
                  </div>
                )}

                {renderNodeInfo()}
              </div>
            </div>
          </div>

          {/* Waku Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Radio size={16} className="text-primary" />
                </div>
                <h3 className="text-base font-medium font-mono">WAKU_SETTINGS</h3>
              </div>
              {wakuNodeType === 'light' ? (
                isWakuConnecting ? (
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Connecting to Waku network..."></div>
                ) : isWakuConnected ? (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title={`Connected to Waku network (${wakuPeerCount} peers)`}></div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-red-500" title="Not connected to Waku network"></div>
                )
              ) : (
                <div className="w-2 h-2 rounded-full bg-primary/80" title="Using relay node"></div>
              )}
            </div>

            <div className="space-y-4 pl-2 ml-2 border-l border-border">
              <div className="space-y-2">
                <label className="text-sm font-medium font-mono">NODE_TYPE</label>
                <Tabs
                  value={wakuNodeType}
                  onValueChange={(value) => setWakuNodeType(value as 'light' | 'relay')}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 font-mono">
                    <TabsTrigger value="light">LIGHT_NODE</TabsTrigger>
                    <TabsTrigger value="relay">RELAY_NODE</TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-muted-foreground font-mono">
                  Select Waku node type
                </p>

                {/* Alert for relay node */}
                {wakuNodeType === 'relay' && (
                  <div className="mt-2 p-2 bg-amber-600/20 border border-amber-600/30 rounded-md">
                    <p className="text-xs text-amber-600/90 font-mono flex items-center gap-1">
                      <AlertCircle size={12} />
                      Relay node integration is not available yet
                    </p>
                  </div>
                )}
              </div>

              {/* API_ENDPOINT - only show for RELAY_NODE */}
              {wakuNodeType === 'relay' && (
                <div className="space-y-2">
                  <label htmlFor="waku-url" className="text-sm font-medium font-mono">API_ENDPOINT</label>
                  <Input
                    id="waku-url"
                    value={wakuNodeUrl}
                    onChange={(e) => setWakuNodeUrl(e.target.value)}
                    placeholder="http://127.0.0.1:8645"
                    className="font-mono text-sm bg-card/70"
                  />
                  <p className="text-xs text-muted-foreground font-mono">
                    nwaku node API endpoint URL
                  </p>
                </div>
              )}

              {/* Waku Status Information */}
              {wakuNodeType === 'light' && (
                <div className="mt-3 p-2 bg-card/50 border border-primary/10 rounded-md">
                  <div className="flex items-center gap-1 mb-1">
                    <Info size={12} className="text-primary/70" />
                    <span className="text-xs font-medium text-primary/90 font-mono">WAKU_STATUS</span>
                  </div>
                  <div className="space-y-1 pl-4 border-l border-primary/10">
                    <p className="text-xs font-mono flex items-center justify-between">
                      <span className="text-muted-foreground">STATUS:</span>
                      <span className={`${isWakuConnected ? 'text-green-500' : 'text-amber-500'}`}>
                        {isWakuConnecting ? 'CONNECTING' : isWakuConnected ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </p>
                    {isWakuConnected && (
                      <>
                        <p className="text-xs font-mono flex items-center justify-between">
                          <span className="text-muted-foreground">PEERS:</span>
                          <span className="text-primary/80">{wakuPeerCount}</span>
                        </p>
                        <p className="text-xs font-mono flex items-center justify-between">
                          <span className="text-muted-foreground">TOPIC:</span>
                          <span className="text-primary/80 truncate max-w-[180px]" title={wakuContentTopic}>
                            {wakuContentTopic}
                          </span>
                        </p>
                      </>
                    )}
                    {wakuError && (
                      <p className="text-xs font-mono flex items-center text-amber-500">
                        <AlertCircle size={10} className="mr-1" />
                        {wakuError}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <SheetFooter className="mt-8 pt-4 border-t border-border flex gap-2 shrink-0">
          <SheetClose asChild>
            <Button variant="outline" className="flex-1 font-mono">CANCEL</Button>
          </SheetClose>
          <Button
            className="flex-1 font-mono"
            onClick={handleSaveConfig}
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
                SAVING...
              </span>
            ) : saveSuccess ? (
              <span className="flex items-center gap-2">
                <Check size={16} />
                SAVED!
              </span>
            ) : (
              "SAVE_CONFIG"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
