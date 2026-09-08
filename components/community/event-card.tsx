import { Calendar, MapPin, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PillarBadge } from "@/components/shared/pillar-badge";
import { profileDisplayName } from "@/lib/types";
import { formatEventTime } from "@/lib/format-date";
import type { EvorienEvent } from "@/lib/data/events";
import { EventStatusControl } from "@/components/community/event-status-control";

export function EventCard({ event, viewerId }: { event: EvorienEvent; viewerId: string | null }) {
  const isOrganizer = viewerId !== null && viewerId === event.organizer_id;

  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-medium">{event.title}</p>
            <p className="text-sm text-muted-foreground">
              Hosted by {event.organizer ? profileDisplayName(event.organizer) : "a member"}
            </p>
          </div>
          {event.pillar_code && <PillarBadge code={event.pillar_code} dense />}
        </div>
        {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" />
            {formatEventTime(event.starts_at, event.ends_at)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5">
              {event.is_online ? <Video className="size-4" /> : <MapPin className="size-4" />}
              {event.location}
            </span>
          )}
        </div>
        {event.status !== "SCHEDULED" && <Badge variant="outline">{event.status}</Badge>}
        {isOrganizer && event.status === "SCHEDULED" && <EventStatusControl eventId={event.id} />}
      </CardContent>
    </Card>
  );
}
