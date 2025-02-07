import { getChatCompletion, createChatMessage } from './claude';

interface SimplePlayer {
  name: string;
  ovr: number;
  position: string;
}

interface TeamPlayer {
  player: SimplePlayer;
  position: string;
}

export async function getTeamAnalysis(players: TeamPlayer[]) {
  const teamDescription = players
    .map(({ player, position }) => 
      `${position}: ${player.name} (${player.ovr} OVR)`
    )
    .join('\n');

  const prompt = `As a concise football team analyst, analyze this team:

${teamDescription}

Provide a brief analysis covering:
⚽️ Overall team strength (1-2 sentences)
🌟 Key players (1-2 players)
📋 Formation effectiveness (1-2 sentences)
💪 Main strength (1 point)
⚠️ Key area to improve (1 point)
🎯 Top tactical recommendation (1 point)

Keep the analysis focused and to-the-point.`;

  const messages = [createChatMessage('user', prompt)];
  const response = await getChatCompletion(messages, {
    temperature: 0.7,
    maxTokens: 500, // Reduced token limit for more concise responses
  });

  return {
    success: response.success,
    message: response.success ? response.message : null,
    error: response.success ? null : response.error,
  };
} 