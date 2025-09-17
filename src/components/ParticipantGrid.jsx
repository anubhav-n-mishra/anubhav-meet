import React from 'react';
import VideoTile from './VideoTile';

const ParticipantGrid = ({
  participants,
  pinnedParticipantId,
  onPinParticipant,
  localParticipant,
}) => {
  const allParticipants = [localParticipant, ...participants];
  const pinnedParticipant = allParticipants.find(p => p.id === pinnedParticipantId);
  const otherParticipants = allParticipants.filter(p => p.id !== pinnedParticipantId);

  // Calculate grid layout based on number of participants
  const getGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    if (count <= 6) return 'grid-cols-3 grid-rows-2';
    if (count <= 9) return 'grid-cols-3 grid-rows-3';
    return 'grid-cols-4 grid-rows-3';
  };

  if (pinnedParticipant) {
    return (
      <div className="flex-1 flex flex-col gap-4 p-4">
        {/* Pinned participant (large view) */}
        <div className="flex-1">
          <VideoTile
            participant={pinnedParticipant}
            isLocal={pinnedParticipant.id === localParticipant.id}
            isPinned={true}
            onPin={() => onPinParticipant('')}
            className="w-full h-full"
          />
        </div>

        {/* Other participants (strip at bottom) */}
        {otherParticipants.length > 0 && (
          <div className="h-32 flex gap-2 overflow-x-auto">
            {otherParticipants.map((participant) => (
              <VideoTile
                key={participant.id}
                participant={participant}
                isLocal={participant.id === localParticipant.id}
                onPin={() => onPinParticipant(participant.id)}
                className="w-48 h-full flex-shrink-0"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Grid layout when no one is pinned
  return (
    <div className="flex-1 p-4">
      <div className={`grid gap-4 h-full ${getGridClass(allParticipants.length)}`}>
        {allParticipants.map((participant) => (
          <VideoTile
            key={participant.id}
            participant={participant}
            isLocal={participant.id === localParticipant.id}
            onPin={() => onPinParticipant(participant.id)}
            className="w-full h-full min-h-0"
          />
        ))}
      </div>
    </div>
  );
};

export default ParticipantGrid;