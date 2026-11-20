import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafetyStore } from '../src/store/safetyStore';

export default function HistoryScreen() {
  const { pastSessions } = useSafetyStore();

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const calculateDuration = (startStr: string, endStr?: string | null) => {
    if (!endStr) return 'Active';
    try {
      const diffMs = new Date(endStr).getTime() - new Date(startStr).getTime();
      const mins = Math.max(1, Math.round(diffMs / 60000));
      if (mins >= 60) {
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return `${hrs}h ${remMins}m`;
      }
      return `${mins} mins`;
    } catch {
      return '--';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hiking Session History</Text>
      <Text style={styles.description}>
        Recorded hiking trails and safety sessions stored in phone SQLite.
      </Text>

      {pastSessions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🏔️</Text>
          <Text style={styles.emptyHeading}>No Completed Sessions</Text>
          <Text style={styles.emptyText}>
            Start and complete a hiking safety session to preserve trip timelines and trail metrics.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {pastSessions.map((session) => {
            const loc = session.start_location as { trail?: string; altitude_m?: number } | undefined;
            return (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.row}>
                  <Text style={styles.trail}>{loc?.trail || 'Mountain Trail'}</Text>
                  <Text style={styles.badge}>COMPLETED</Text>
                </View>

                <Text style={styles.date}>
                  {formatDate(session.start_time)} · {calculateDuration(session.start_time, session.end_time)}
                  {loc?.altitude_m ? ` · ${loc.altitude_m}m altitude` : ''}
                </Text>

                <Text style={styles.meta}>
                  ID: {session.id.slice(0, 8)} · Persisted in SQLite
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#020617',
    flexGrow: 1
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20
  },
  emptyCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: 20
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260
  },
  list: {
    gap: 12
  },
  sessionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  trail: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  badge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4ADE80',
    backgroundColor: '#052E16',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  date: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4
  },
  meta: {
    fontSize: 11,
    color: '#F59E0B',
    fontFamily: 'monospace'
  }
});
