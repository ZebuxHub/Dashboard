import React from 'react';
import { useParams } from 'react-router-dom';

export default function PlayerDetail() {
  const { playerId } = useParams();

  return (
    <div className="glass-card rounded-3xl p-8">
      <h2 className="text-2xl font-bold text-white mb-4">
        👤 Player Details
      </h2>
      <p className="text-gray-300">
        Player ID: {playerId}
      </p>
      <p className="text-gray-300 mt-4">
        Detailed player information will be displayed here once the backend is fully integrated.
      </p>
    </div>
  );
}
