import React, { useState, useEffect } from 'react';
import { leaderboardAPI } from '../services/api';
import { authAPI } from '../services/api';
import { showError } from '../utils/notifications';
import './Leaderboard.css';

export default function Leaderboard() {
  const [topPlayers, setTopPlayers] = useState([]);
  const [playerRank, setPlayerRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const [topResult, rankResult] = await Promise.all([
        leaderboardAPI.getTopPlayers(10),
        authAPI.isAuthenticated() && authAPI.getUserId()
          ? leaderboardAPI.getPlayerRank(authAPI.getUserId()).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (topResult && topResult.success) {
        setTopPlayers(topResult.players || []);
      }

      if (rankResult && rankResult.success) {
        setPlayerRank(rankResult.rank);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      showError('Failed to load leaderboard. Playing offline.');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="leaderboard-container">
        <h2>🏆 Leaderboard</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <h2>🏆 Leaderboard</h2>
      <p className="leaderboard-description">Top players by gold and diamonds</p>

      {playerRank && (
        <div className="player-rank-card">
          <h3>Your Rank</h3>
          <div className="rank-display">
            <span className="rank-number">{getRankIcon(playerRank)}</span>
            <span className="rank-label">Rank {playerRank}</span>
          </div>
        </div>
      )}

      <div className="leaderboard-list">
        <div className="leaderboard-header">
          <div className="rank-col">Rank</div>
          <div className="name-col">Player</div>
          <div className="gold-col">💰 Gold</div>
          <div className="diamonds-col">💎 Diamonds</div>
        </div>

        {topPlayers.length === 0 ? (
          <div className="no-players">
            <p>No players yet. Be the first to climb the ranks!</p>
          </div>
        ) : (
          topPlayers.map((player, index) => (
            <div key={player.id} className={`leaderboard-row ${index < 3 ? 'top-three' : ''}`}>
              <div className="rank-col">
                <span className="rank-icon">{getRankIcon(index + 1)}</span>
              </div>
              <div className="name-col">{player.username || 'Anonymous'}</div>
              <div className="gold-col">{player.gold || 0}</div>
              <div className="diamonds-col">{player.diamonds || 0}</div>
            </div>
          ))
        )}
      </div>

      <button className="refresh-button" onClick={loadLeaderboard}>
        🔄 Refresh
      </button>
    </div>
  );
}

