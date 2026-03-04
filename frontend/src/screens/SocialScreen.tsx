```javascript
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  RefreshControl,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MenuModal } from '../components/MenuModal';
import { Card } from '../components/ui/Card';
import { Typography } from '../components/ui/Typography';
import { layout } from '../theme/layout';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export type FriendPayload = {
  id: string;
  friendshipId: number;
  username: string;
  avatarUrl?: string;
  selectedTitle?: string;
  hasSettledToday?: boolean;
  currentStreak?: number;
  level?: number;
  logsCount?: number;
  notifyOnUpdate?: boolean;
  todayLog?: {
    id: number;
    inputType: string;
    title: string | null;
    location: string | null;
    content: string | null;
    photoUrl: string | null;
    musicTitle: string | null;
    musicArtist: string | null;
    musicArtwork: string | null;
  } | null;
};

export type SearchResult = {
  id: string;
  username: string;
  avatarUrl?: string;
  selectedTitle?: string;
  friendshipStatus: 'none' | 'pending' | 'accepted';
  senderId?: string;
};

type SocialScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Social'>;
};

export const SocialScreen: React.FC<SocialScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const currentUserId = user?.id || '';
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'add'>('feed');
  const [viewedFriendIds, setViewedFriendIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem('viewedFriendFeeds').then(val => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          setViewedFriendIds(new Set(parsed));
        } catch (e) { }
      }
    });
  }, []);

  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState<FriendPayload[]>([]);
  const [requests, setRequests] = useState<FriendPayload[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showGroupMenuFor, setShowGroupMenuFor] = useState<string | null>(null);

  const [selectedFriendLog, setSelectedFriendLog] = useState<{ friendName: string, log: NonNullable<FriendPayload['todayLog']> } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
      setActiveTab('feed');
      setSearchQuery('');
      setSearchResults([]);
    }, [])
  );

  useEffect(() => {
    if (activeTab === 'add' && searchQuery.trim().length >= 3) {
      const delayDebounceFn = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else if (searchQuery.trim().length < 3) {
      setSearchResults([]);
    }
  }, [searchQuery, activeTab]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      const res = await api.get(`/ api / friends / feed ? page = ${ pageNum }& limit=15`);
      if (res.data.success) {
        const newFeed = res.data.data.feed;
        if (newFeed.length < 15) setHasMore(false);
        else setHasMore(true);

        if (pageNum === 1) {
          setFeed(newFeed);
          setRequests(res.data.data.requests);
        } else {
          setFeed(prev => [...prev, ...newFeed]);
        }
        setPage(pageNum);
      }
      const groupRes = await api.get('/api/friends/groups');
      if (groupRes.data.success) {
        setGroups(groupRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching friends feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setSearchLoading(true);
      const res = await api.get(`/ api / friends / search ? q = ${ searchQuery.trim() } `);
      if (res.data.success) {
        setSearchResults(res.data.data);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      const res = await api.post('/api/friends/request', { friendId });
      if (res.data.success) {
        setSearchResults(prev => prev.map(u => u.id === friendId ? { ...u, friendshipStatus: 'pending', senderId: currentUserId } : u));
        Alert.alert('Success', 'Friend request sent!');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Could not send request');
    }
  };

  const handleAcceptRequest = async (friendshipId: number, accept: boolean) => {
    try {
      const res = await api.put('/api/friends/accept', { friendshipId, accept });
      if (res.data.success) {
        fetchFeed(); // Refresh everything
        if (activeTab === 'add' || activeTab === 'friends') handleSearch();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Could not process request');
    }
  };

  const handleRemoveFriend = async (friendshipId: number, username: string) => {
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${ username } from your friends list ? `,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await api.delete(`/ api / friends / remove / ${ friendshipId } `);
              if (res.data.success) {
                fetchFeed();
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Could not remove friend');
            }
          }
        }
      ]
    );
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await api.post('/api/friends/groups', { name: newGroupName });
      if (res.data.success) {
        setGroups([...groups, { ...res.data.data, members: [] }]);
        setNewGroupName('');
        setShowCreateGroupModal(false);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Could not create group');
    }
  };

  const handleToggleGroupMember = async (groupId: string, userId: string, isMember: boolean) => {
    try {
      if (isMember) {
        await api.delete(`/ api / friends / groups / ${ groupId } /members/${ userId } `);
      } else {
        await api.post(`/ api / friends / groups / ${ groupId }/members`, { userId });
      }
fetchFeed(); // Refresh the groups payload
    } catch (err: any) {
  Alert.alert('Error', err.response?.data?.error || 'Could not modify group member');
}
  };

const handleToggleNotifications = async (friendshipId: number, current: boolean) => {
  try {
    const res = await api.put(`/api/friends/notifications/${friendshipId}`, { notifyOnUpdate: !current });
    if (res.data.success) {
      fetchFeed();
    }
  } catch (err: any) {
    Alert.alert('Error', err.response?.data?.error || 'Could not update notification settings');
  }
};

const renderFeedTab = () => {
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (feed.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Feather name="users" size={48} color={colors.textTertiary} style={{ marginBottom: 16 }} />
        <Typography size="body" color={colors.textSecondary} style={{ textAlign: 'center' }}>
          You haven't partnered with anyone yet. Add friends to track their streaks!
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: layout.spacing.l, paddingTop: layout.spacing.m, paddingBottom: layout.spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      {feed.map(friend => (
        <TouchableOpacity
          key={friend.id}
          activeOpacity={0.7}
          onPress={() => {
            if (friend.hasSettledToday && friend.todayLog) {
              setSelectedFriendLog({ friendName: friend.username, log: friend.todayLog });
              setViewedFriendIds(prev => {
                const updated = new Set(prev).add(friend.id);
                AsyncStorage.setItem('viewedFriendFeeds', JSON.stringify(Array.from(updated))).catch(() => { });
                return updated;
              });
            } else if (!friend.hasSettledToday) {
              Alert.alert(`${friend.username} hasn't settled today!`, `Check back later to see their latest log.`);
            } else if (friend.hasSettledToday) {
              Alert.alert("Debug Info", `User Settled: Yes\nLog Exists: No\n\nBackend likely didn't append the todayLog sub-object into the JSON feed response.`);
            }
          }}
        >
          <Card style={styles.friendCardContent} variant="default">
            <View style={styles.friendCardLeft}>
              <View style={[
                styles.avatarWrapper,
                friend.hasSettledToday && (viewedFriendIds.has(friend.id) ? { borderColor: colors.border } : styles.avatarSettledWrapper)
              ]}>
                {friend.avatarUrl ? (
                  <FastImage source={{ uri: friend.avatarUrl }} style={styles.avatarSmall} />
                ) : (
                  <View style={styles.avatarPlaceholderSmall}>
                    <Feather name="user" size={16} color={colors.surface} />
                  </View>
                )}
                {friend.hasSettledToday && (
                  <View style={[
                    styles.settledCheckmarkBadge,
                    { borderColor: colors.surface },
                    viewedFriendIds.has(friend.id) && { backgroundColor: colors.border }
                  ]}>
                    <Feather name="star" size={10} color="#FFF" />
                  </View>
                )}
              </View>
              <View style={{ marginLeft: 12 }}>
                <Typography variant="bold" size="body">{friend.username}</Typography>
                <Typography variant="medium" size="small" color={colors.textSecondary}>
                  {friend.selectedTitle ? friend.selectedTitle : 'Lv. ' + (friend.level || 1)}
                </Typography>
              </View>
            </View>

            <View style={styles.friendCardRight}>
              <View style={styles.streakBadge}>
                <Typography size="small" variant="bold" color="#F97316">🔥 {friend.currentStreak || 0}</Typography>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const renderFriendsTab = () => {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: layout.spacing.l, paddingTop: layout.spacing.m, paddingBottom: layout.spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      {requests.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Typography variant="bold" size="body" style={{ marginBottom: 12 }}>Pending Requests</Typography>
          {requests.map(req => (
            <Card key={req.id} style={styles.requestCardContent} variant="default">
              <View style={styles.friendCardLeft}>
                {req.avatarUrl ? (
                  <FastImage source={{ uri: req.avatarUrl }} style={styles.avatarSmall} />
                ) : (
                  <View style={styles.avatarPlaceholderSmall}>
                    <Feather name="user" size={16} color={colors.surface} />
                  </View>
                )}
                <Typography variant="bold" size="body" style={{ marginLeft: 12 }}>{req.username}</Typography>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptRequest(req.friendshipId, true)}>
                  <Typography variant="bold" size="small" color={colors.surface}>Accept</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAcceptRequest(req.friendshipId, false)}>
                  <Feather name="x" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between' }}>
        <Typography variant="bold" size="body">My Friends</Typography>
        <TouchableOpacity onPress={() => setShowCreateGroupModal(true)} style={{ padding: 4 }}>
          <Feather name="plus-circle" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {groups.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <TouchableOpacity
            style={[styles.groupChip, selectedGroupId === null && styles.groupChipActive]}
            onPress={() => setSelectedGroupId(null)}
          >
            <Typography size="small" variant="bold" color={selectedGroupId === null ? colors.surface : colors.textSecondary}>All</Typography>
          </TouchableOpacity>
          {groups.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[styles.groupChip, selectedGroupId === g.id && styles.groupChipActive]}
              onPress={() => setSelectedGroupId(g.id)}
            >
              <Typography size="small" variant="bold" color={selectedGroupId === g.id ? colors.surface : colors.textSecondary}>{g.name}</Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {(() => {
        const displayedFriends = selectedGroupId
          ? feed.filter(f => groups.find(g => g.id === selectedGroupId)?.members.some((m: any) => m.userId === f.id))
          : feed;

        if (displayedFriends.length === 0 && requests.length === 0) {
          return (
            <Typography size="body" color={colors.textSecondary} style={{ marginTop: 8 }}>
              {selectedGroupId ? "No friends in this group." : "You haven't added any friends yet. Check the Add tab!"}
            </Typography>
          );
        }

        return displayedFriends.map(friend => (
          <Card key={friend.id} style={styles.searchCardContent} variant="default">
            <View style={styles.friendCardLeft}>
              {friend.avatarUrl ? (
                <FastImage source={{ uri: friend.avatarUrl }} style={styles.avatarSmall} />
              ) : (
                <View style={styles.avatarPlaceholderSmall}>
                  <Feather name="user" size={16} color={colors.surface} />
                </View>
              )}
              <View style={{ marginLeft: 12 }}>
                <Typography variant="bold" size="body">{friend.username}</Typography>
                <Typography size="small" color={colors.textSecondary}>
                  {friend.selectedTitle || 'Streak: ' + (friend.currentStreak || 0)}
                </Typography>
              </View>
            </View>
            <TouchableOpacity
              style={{ padding: 8 }}
              onPress={() => setShowGroupMenuFor(friend.id)}
            >
              <Feather name="more-horizontal" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>
        ));
      })()}
    </ScrollView>
  );
};

const renderAddTab = () => {
  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.searchBar, { marginHorizontal: layout.spacing.l, marginTop: layout.spacing.m }]}>
        <Feather name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: layout.spacing.l, paddingBottom: layout.spacing.xl }}
        showsVerticalScrollIndicator={false}
      >

        {searchLoading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          searchResults.map(user => (
            <Card key={user.id} style={styles.searchCardContent} variant="default">
              <View style={styles.friendCardLeft}>
                {user.avatarUrl ? (
                  <FastImage source={{ uri: user.avatarUrl }} style={styles.avatarSmall} />
                ) : (
                  <View style={styles.avatarPlaceholderSmall}>
                    <Feather name="user" size={16} color={colors.surface} />
                  </View>
                )}
                <Typography variant="bold" size="body" style={{ marginLeft: 12 }}>{user.username}</Typography>
              </View>

              {user.friendshipStatus === 'accepted' ? (
                <View style={styles.statusChip}>
                  <Typography size="small" color={colors.textSecondary}>Friends</Typography>
                </View>
              ) : user.friendshipStatus === 'pending' ? (
                <View style={styles.statusChip}>
                  <Typography size="small" color={colors.textSecondary}>
                    {user.senderId === currentUserId ? 'Sent' : 'Pending'}
                  </Typography>
                </View>
              ) : (
                <TouchableOpacity style={styles.addBtn} onPress={() => handleSendRequest(user.id)}>
                  <Feather name="user-plus" size={16} color={colors.surface} />
                </TouchableOpacity>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

return (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.header}>
      <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
        <Feather name="menu" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.headerTitle}>
        <Typography variant="bold" size="h2" color={colors.textPrimary}>
          Your Sphere
        </Typography>
        <Typography variant="regular" size="small" color={colors.textSecondary}>
          Social Feed
        </Typography>
      </View>

      <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
        <Feather name="home" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>

    <View style={styles.tabs}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
        onPress={() => setActiveTab('feed')}
      >
        <Typography variant="bold" color={activeTab === 'feed' ? colors.primary : colors.textSecondary}>
          Feed
        </Typography>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
        onPress={() => setActiveTab('friends')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Typography variant="bold" color={activeTab === 'friends' ? colors.primary : colors.textSecondary}>
            Friends
          </Typography>
          {requests.length > 0 && (
            <View style={styles.badge} />
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'add' && styles.activeTab]}
        onPress={() => setActiveTab('add')}
      >
        <Typography variant="bold" color={activeTab === 'add' ? colors.primary : colors.textSecondary}>
          Add
        </Typography>
      </TouchableOpacity>
    </View>

    <View style={styles.tabContent}>
      {activeTab === 'feed' ? renderFeedTab() : activeTab === 'friends' ? renderFriendsTab() : renderAddTab()}
    </View>

    {/* Nested Modal to view a Friend's Log Details */}
    <Modal visible={!!selectedFriendLog} animationType="fade" transparent>
      <View style={styles.logOverlay}>
        <View style={styles.logModal}>
          <View style={styles.logHeader}>
            <View>
              <Typography variant="bold" size="h2" style={{ marginBottom: 4 }}>
                {selectedFriendLog?.log.title || 'Daily Log'}
              </Typography>
              <Typography size="body" color={colors.textSecondary}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Typography>
            </View>
            <TouchableOpacity onPress={() => setSelectedFriendLog(null)} style={styles.logCloseBtn}>
              <Feather name="x" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ marginTop: 16 }} showsVerticalScrollIndicator={false}>
            {selectedFriendLog?.log.photoUrl && (
              <FastImage source={{ uri: selectedFriendLog.log.photoUrl as string }} style={styles.logPhoto} />
            )}

            {selectedFriendLog?.log.content && (
              <View style={styles.logContentBox}>
                <Typography size="body" color={colors.textPrimary} style={{ lineHeight: 24 }}>
                  {selectedFriendLog.log.content}
                </Typography>
              </View>
            )}

            {selectedFriendLog?.log.musicTitle && (
              <View style={styles.musicCard}>
                {selectedFriendLog.log.musicArtwork ? (
                  <FastImage source={{ uri: selectedFriendLog.log.musicArtwork as string }} style={styles.musicArt} />
                ) : (
                  <View style={styles.musicIconBox}>
                    <Feather name="music" size={16} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="bold" size="small">{selectedFriendLog.log.musicTitle}</Typography>
                  <Typography size="small" color={colors.textSecondary}>{selectedFriendLog.log.musicArtist}</Typography>
                </View>
              </View>
            )}

            {selectedFriendLog?.log.location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                <Feather name="map-pin" size={14} color={colors.textSecondary} />
                <Typography size="small" color={colors.textSecondary} style={{ marginLeft: 6 }}>
                  {selectedFriendLog.log.location}
                </Typography>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>

    {/* CREATE GROUP MODAL */}
    <Modal
      visible={showCreateGroupModal}
      transparent
      animationType="fade"
    >
      <TouchableOpacity style={styles.logOverlay} activeOpacity={1} onPress={() => setShowCreateGroupModal(false)}>
        <View style={styles.logModal}>
          <View style={{ marginBottom: 20 }}>
            <Typography variant="bold" size="h3" style={{ marginBottom: 4 }}>Create Group</Typography>
            <Typography size="body" color={colors.textSecondary}>Organize your friends list</Typography>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Group Name (e.g. Besties)"
            placeholderTextColor={colors.textTertiary}
            value={newGroupName}
            onChangeText={setNewGroupName}
            autoFocus
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <TouchableOpacity onPress={() => setShowCreateGroupModal(false)} style={{ padding: 12 }}>
              <Typography variant="bold" size="body" color={colors.textSecondary}>Cancel</Typography>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreateGroup} style={[styles.primaryButtonBtn, { paddingHorizontal: 20 }]}>
              <Typography variant="bold" size="body" color="#FFFFFF">Create</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>

    {/* FRIEND ACTION MENU MODAL */}
    <Modal
      visible={showGroupMenuFor !== null}
      transparent
      animationType="fade"
    >
      <TouchableOpacity style={styles.logOverlay} activeOpacity={1} onPress={() => setShowGroupMenuFor(null)}>
        <View style={[styles.logModal, { padding: 0 }]}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Typography variant="bold" size="body">Friend Options</Typography>
          </View>

          <ScrollView style={{ maxHeight: 300 }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Typography variant="bold" size="small" color={colors.textSecondary} style={{ marginBottom: 12, textTransform: 'uppercase' }}>Add to Group</Typography>
              {groups.length === 0 ? (
                <Typography size="small" color={colors.textTertiary}>No groups created yet.</Typography>
              ) : (
                groups.map(g => {
                  const isMember = g.members.some((m: any) => m.userId === showGroupMenuFor);
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}
                      onPress={() => handleToggleGroupMember(g.id, showGroupMenuFor!, isMember)}
                    >
                      <Typography size="body" color={colors.textPrimary}>{g.name}</Typography>
                      {isMember && <Feather name="check" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {showGroupMenuFor && feed.find(f => f.id === showGroupMenuFor) && (() => {
              const friendObj = feed.find(f => f.id === showGroupMenuFor)!;
              return (
                <TouchableOpacity
                  style={{ padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}
                  onPress={() => handleToggleNotifications(friendObj.friendshipId, !!friendObj.notifyOnUpdate)}
                >
                  <Feather name={friendObj.notifyOnUpdate ? "bell-off" : "bell"} size={18} color={colors.textPrimary} style={{ marginRight: 12 }} />
                  <Typography size="body" color={colors.textPrimary}>
                    {friendObj.notifyOnUpdate ? "Mute Notifications" : "Turn On Notifications"}
                  </Typography>
                </TouchableOpacity>
              );
            })()}

            <TouchableOpacity
              style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}
              onPress={() => {
                const friendObj = feed.find(f => f.id === showGroupMenuFor);
                if (friendObj) {
                  Alert.alert(
                    "Remove Friend",
                    `Are you sure you want to remove ${friendObj.username}?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Remove",
                        style: "destructive",
                        onPress: () => {
                          handleRemoveFriend(friendObj.friendshipId, friendObj.username);
                          setShowGroupMenuFor(null);
                        }
                      }
                    ]
                  );
                } else {
                  setShowGroupMenuFor(null);
                }
              }}
            >
              <Feather name="user-x" size={18} color="#DC2626" style={{ marginRight: 12 }} />
              <Typography size="body" color="#DC2626">Remove Friend</Typography>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>

    <MenuModal
      visible={menuVisible}
      onClose={() => setMenuVisible(false)}
      onLogout={logout ?? (() => { })}
      onNavigateToProfile={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('Profile'), 300); }}
      onNavigateToCalendar={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('Calendar'), 300); }}
      onNavigateToWeeklyReport={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('WeeklyReport'), 300); }}
      onNavigateToNotifications={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('Notifications'), 300); }}
      onNavigateToAccount={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('Account'), 300); }}
      onNavigateToDataPrivacy={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('DataPrivacy'), 300); }}
      onNavigateToAboutHelp={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('AboutHelp'), 300); }}
      onNavigateToSocial={() => setMenuVisible(false)}
    />
  </SafeAreaView>
);
};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.l,
    paddingVertical: layout.spacing.m,
  },
  headerTitle: {
    alignItems: 'center',
  },
  iconButton: {
    padding: layout.spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: layout.spacing.m,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    marginLeft: 6,
    marginTop: -8,
  },
  tabContent: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  friendCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.s,
  },
  friendCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholderSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  avatarWrapper: {
    padding: 3,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSettledWrapper: {
    borderColor: '#4ADE80',
  },
  settledCheckmarkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#4ADE80',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  logOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.l,
  },
  logModal: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxHeight: '85%',
    borderRadius: 32,
    padding: 24,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  logCloseBtn: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  logPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  logContentBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  musicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  musicArt: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  musicIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    color: colors.textPrimary,
  },
  requestCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.s,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rejectBtn: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  searchCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.s,
  },
  addBtn: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  groupChipActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  primaryButtonBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  }
});
