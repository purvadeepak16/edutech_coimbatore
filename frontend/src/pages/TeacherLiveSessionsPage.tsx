import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Loader2, Plus, Video, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  createLiveSession,
  getTeacherSessions,
  LiveSession,
} from "@/services/liveSessionService";
import { cn } from "@/lib/utils";

const SAMPLE_JAAS_URL =
  "https://8x8.vc/vpaas-magic-cookie-27bbe0bbe7d340799edfdd4b4250ddc6/SampleAppDownstairsReplacementsAdmitQuite";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

export default function TeacherLiveSessionsPage({
  previewOnly = false,
}: {
  previewOnly?: boolean;
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [sessionUrl, setSessionUrl] = useState("");
  const [quickUrl, setQuickUrl] = useState("");

  const jaasContainerRef = useRef<HTMLDivElement | null>(null);
  const jaasApiRef = useRef<any>(null);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedId),
    [sessions, selectedId]
  );

  const activeSession = useMemo(() => {
    if (selectedSession) return selectedSession;
    if (quickUrl.trim()) {
      return {
        id: "__quick__",
        sessionName: "Live session",
        sessionUrl: quickUrl.trim(),
        teacherId: user?.uid || "",
        createdAt: new Date().toISOString(),
      } as LiveSession;
    }
    return undefined;
  }, [quickUrl, selectedSession, user?.uid]);

  const jaasInfo = useMemo(() => {
    if (!activeSession) return { isJaas: false, domain: "", roomName: "" };
    try {
      const url = new URL(activeSession.sessionUrl);
      return {
        isJaas: url.hostname === "8x8.vc",
        domain: url.hostname,
        roomName: url.pathname.replace("/", ""),
      };
    } catch {
      return { isJaas: false, domain: "", roomName: "" };
    }
  }, [activeSession]);

  /* Load teacher sessions ONLY if not previewOnly */
  useEffect(() => {
    if (!user?.uid || previewOnly) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getTeacherSessions(user.uid);
        setSessions(data);
        if (data.length) setSelectedId(data[0].id);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load sessions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.uid, previewOnly, toast]);

  /* Jitsi embed */
  useEffect(() => {
    if (!jaasInfo.isJaas || !jaasContainerRef.current) return;

    if (jaasApiRef.current) {
      jaasApiRef.current.dispose();
      jaasApiRef.current = null;
    }

    const scriptId = "jitsi-external-api";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://8x8.vc/vpaas-magic-cookie-27bbe0bbe7d340799edfdd4b4250ddc6/external_api.js";
      script.async = true;
      script.onload = initJitsi;
      document.body.appendChild(script);
    } else {
      initJitsi();
    }

    function initJitsi() {
      if (!window.JitsiMeetExternalAPI) return;
      jaasApiRef.current = new window.JitsiMeetExternalAPI(jaasInfo.domain, {
        roomName: jaasInfo.roomName,
        parentNode: jaasContainerRef.current,
      });
    }

    return () => {
      jaasApiRef.current?.dispose?.();
      jaasApiRef.current = null;
    };
  }, [jaasInfo]);

  const handleCreate = async () => {
    if (!user?.uid) return;
    if (!sessionName || !sessionUrl) return;

    setCreating(true);
    try {
      const newSession = await createLiveSession({
        sessionName,
        sessionUrl,
        teacherId: user.uid,
      });
      setSessions((p) => [newSession, ...p]);
      setSelectedId(newSession.id);
      setDialogOpen(false);
      setSessionName("");
      setSessionUrl("");
    } catch {
      toast({ title: "Error", description: "Failed to create session" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {!previewOnly && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Live Sessions</h1>
            <p className="text-sm text-muted-foreground">
              Start and manage live Jitsi sessions
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create session
          </Button>
        </div>
      )}

      <div
        className={cn(
          "grid gap-4",
          previewOnly ? "grid-cols-1" : "lg:grid-cols-3"
        )}
      >
        {/* LIVE PREVIEW */}
        <Card className={cn(previewOnly ? "h-[600px]" : "lg:col-span-2 h-[560px]")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              {activeSession?.sessionName || "Live Preview"}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            {activeSession ? (
              <div className="w-full h-full rounded-xl overflow-hidden border bg-black">
                {jaasInfo.isJaas ? (
                  <div ref={jaasContainerRef} className="w-full h-full" />
                ) : (
                  <iframe
                    src={activeSession.sessionUrl}
                    className="w-full h-full"
                    allow="camera; microphone; fullscreen"
                  />
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No live session selected
              </div>
            )}
          </CardContent>
        </Card>

        {/* SESSION LIST — HIDDEN IN PREVIEW MODE */}
        {!previewOnly && (
          <Card className="h-[560px]">
            <CardHeader>
              <CardTitle>My sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border hover:bg-primary/5",
                    selectedId === s.id && "border-primary bg-primary/10"
                  )}
                >
                  <p className="font-medium">{s.sessionName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.sessionUrl}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* CREATE SESSION DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create live session</DialogTitle>
            <DialogDescription>
              Add a Jitsi meeting link
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Session name</Label>
              <Input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>
            <div>
              <Label>Jitsi URL</Label>
              <Input
                value={sessionUrl}
                onChange={(e) => setSessionUrl(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
