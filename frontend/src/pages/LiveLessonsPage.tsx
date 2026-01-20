import { useEffect, useMemo, useState } from "react";
import { Calendar, Loader2, Play, Video, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getStudentSessions, LiveSession } from "@/services/liveSessionService";

export default function LiveLessonsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId]
  );

  useEffect(() => {
    if (!user?.uid) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getStudentSessions(user.uid);
        setSessions(data);
        if (data.length) {
          setActiveSessionId((prev) => prev ?? data[0].id);
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Could not load live sessions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.uid, toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Sessions</h1>
          <p className="text-muted-foreground text-sm">
            Join live classes shared by your teachers.
          </p>
        </div>
        <Badge variant="secondary">Students View</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* LIVE PREVIEW */}
        <Card className="lg:col-span-2 h-[520px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Live class preview
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[440px]">
            {loading && (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading sessions...
              </div>
            )}

            {!loading && !activeSession && (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No live sessions available.
              </div>
            )}

            {!loading && activeSession && (
              <div className="relative h-full rounded-xl overflow-hidden border bg-black">
                <iframe
                  key={activeSession.id}
                  src={activeSession.sessionUrl}
                  title={activeSession.sessionName}
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  className="w-full h-full"
                />

                {/* Bottom overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-background/90 backdrop-blur rounded-lg px-4 py-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {activeSession.sessionName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Hosted by {activeSession.teacherName || "Teacher"}
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <a
                      href={activeSession.sessionUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Join
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SESSION LIST */}
        <Card className="h-[520px]">
          <CardHeader>
            <CardTitle>All live sessions</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 overflow-y-auto max-h-[440px] pr-1">
            {loading && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading...
              </div>
            )}

            {!loading && sessions.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No live sessions from your teachers yet.
              </div>
            )}

            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`w-full text-left p-3 rounded-lg border transition hover:border-primary hover:bg-primary/5 ${
                  activeSession?.id === session.id
                    ? "border-primary bg-primary/10"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>
                      {(session.teacherName || "T")[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {session.sessionName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.teacherName || "Teacher"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      <Calendar className="inline w-3 h-3 mr-1" />
                      {new Date(session.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <Badge variant="outline" className="gap-1">
                    <Users className="w-3 h-3" />
                    Live
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
