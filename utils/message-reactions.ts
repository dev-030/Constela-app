export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

export type MessageReactionSummary = {
  emoji: string;
  count: number;
  actor_ids: string[];
};

/**
 * Removes the current user's reaction from every pill.
 * Used when the user un-reacts a message (the server payload carries
 * `reaction: null`, so the optimistic cache update has to strip it locally).
 */
export function removeMyReaction(
  reactions: MessageReactionSummary[] | null | undefined,
  myProfileId?: string | null,
): MessageReactionSummary[] {
  if (!myProfileId) return reactions ?? [];
  const myId = String(myProfileId);
  return (reactions ?? [])
    .map((r) => ({
      ...r,
      count: Math.max(
        0,
        r.count - (r.actor_ids?.some((id) => String(id) === myId) ? 1 : 0),
      ),
      actor_ids: r.actor_ids?.filter((id) => String(id) !== myId) ?? [],
    }))
    .filter((r) => r.count > 0);
}

/**
 * Applies a reaction toggle locally so the UI updates instantly.
 * A user can only hold one reaction per message, so picking a different
 * emoji replaces the previous one instead of adding a second pill.
 */
export function toggleReactionSummary(
  reactions: MessageReactionSummary[] | null | undefined,
  emoji: string,
  myProfileId?: string | null,
): MessageReactionSummary[] {
  const list = reactions ?? [];
  const myId = String(myProfileId);
  const hasMe = !!myProfileId;

  const existing = list.find((reaction) => reaction.emoji === emoji);
  const reactedByMe =
    hasMe &&
    !!existing?.actor_ids?.some((id) => String(id) === myId);

  if (reactedByMe) {
    // Remove my reaction from that emoji.
    return list
      .map((reaction) =>
        reaction.emoji === emoji
          ? {
              ...reaction,
              count: Math.max(0, reaction.count - 1),
              actor_ids: (reaction.actor_ids ?? []).filter(
                (id) => String(id) !== myId,
              ),
            }
          : reaction,
      )
      .filter((reaction) => reaction.count > 0);
  }

  // Drop any other reaction of mine first: one reaction per user per message.
  const withoutMine = hasMe
    ? list
        .map((reaction) =>
          reaction.actor_ids?.some((id) => String(id) === myId)
            ? {
                ...reaction,
                count: Math.max(0, reaction.count - 1),
                actor_ids: (reaction.actor_ids ?? []).filter(
                  (id) => String(id) !== myId,
                ),
              }
            : reaction,
        )
        .filter((reaction) => reaction.count > 0)
    : list;

  const target = withoutMine.find((reaction) => reaction.emoji === emoji);
  if (target) {
    return withoutMine.map((reaction) =>
      reaction.emoji === emoji
        ? {
            ...reaction,
            count: reaction.count + 1,
            actor_ids: [...(reaction.actor_ids ?? []), myId],
          }
        : reaction,
    );
  }

  return [...withoutMine, { emoji, count: 1, actor_ids: [myId] }];
}
