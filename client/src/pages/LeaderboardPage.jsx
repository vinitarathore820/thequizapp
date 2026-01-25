import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FullPageLoader from '../components/FullPageLoader';
import api from '../services/api';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const currentRowRef = useRef(null);

  const list = useMemo(() => {
    if (Array.isArray(leaderboard)) return leaderboard;
    return [];
  }, [leaderboard]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const response = await api.get('/users/leaderboard');
        const payload = response?.data?.data;

        const items = Array.isArray(payload?.leaderboard) ? payload.leaderboard : [];
        const myId = payload?.currentUserId ? String(payload.currentUserId) : null;
        const myRank = Number.isFinite(payload?.currentUserRank) ? payload.currentUserRank : null;

        if (mounted) {
          setLeaderboard(items);
          setCurrentUserId(myId);
          setCurrentUserRank(myRank);
        }
      } catch (err) {
        const msg = err?.response?.data?.error || err?.message || 'Failed to load leaderboard';
        if (mounted) setErrorMessage(msg);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoading && currentRowRef.current) {
      currentRowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  if (isLoading) {
    return <FullPageLoader message="Loading leaderboard..." />;
  }

  const top3 = list.slice(0, 3);

  const getMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-5xl mx-auto transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Leaderboard</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Earn points by completing quizzes. Higher points = higher rank.</p>
          </div>
          <div className="flex items-center gap-3">
            {currentUserRank ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                <span>🎯</span>
                <span>Your Rank: #{currentUserRank}</span>
              </div>
            ) : null}
            <Link
              to="/quiz/new"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors transition-transform hover:scale-105 active:scale-95"
            >
              <span>⚡</span>
              <span>Play</span>
            </Link>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-6">
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{errorMessage}</div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Top 3</div>
                <div className="text-xs text-gray-500 dark:text-gray-300">Podium vibes</div>
              </div>
              <div className="p-5 space-y-3">
                {top3.map((u) => {
                  const isMe = currentUserId && String(u?._id) === String(currentUserId);
                  return (
                    <div
                      key={u?._id || u?.rank}
                      className={`rounded-lg border px-4 py-3 flex items-center justify-between transition-transform hover:scale-[1.01] ${
                        isMe
                          ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{getMedal(u?.rank)}</div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {u?.name}
                            {isMe ? <span className="ml-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">(You)</span> : null}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-300">Rank #{u?.rank}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{u?.points ?? 0}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">All Players</div>
                  <div className="text-xs text-gray-500 dark:text-gray-300">Scrollable list</div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-300">✨ Tip: your row auto-focuses</div>
              </div>

              <div className="max-h-[70vh] overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/30 sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Player</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Points</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {list.map((u) => {
                      const isMe = currentUserId && String(u?._id) === String(currentUserId);
                      return (
                        <tr
                          key={u?._id || u?.rank}
                          ref={isMe ? currentRowRef : null}
                          className={`transition-colors ${
                            isMe
                              ? 'bg-indigo-50 dark:bg-indigo-900/30'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                          }`}
                        >
                          <td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                            <span className="inline-flex items-center gap-2">
                              <span>{u?.rank}</span>
                              {u?.rank <= 3 ? <span className="text-sm">{getMedal(u?.rank)}</span> : null}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-900 dark:text-white">
                            <span className="inline-flex items-center gap-2">
                              <span className="font-medium">{u?.name}</span>
                              {isMe ? (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">You</span>
                              ) : null}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-900 dark:text-white text-right font-semibold">
                            {u?.points ?? 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
