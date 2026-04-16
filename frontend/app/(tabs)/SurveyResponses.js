import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import BottomNav from '../../assets/components/BottomNav';
const API_URL = 'https://portaled-blair-inkiest.ngrok-free.dev';

export default function SurveyResponses() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const surveyId = params?.surveyId;
  const surveyTitle = params?.surveyTitle || 'Survey Responses';

  const [data, setData] = useState({ total:0, todayCount:0, responses:[] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchResponses = async () => {
    if (!surveyId) { setError('No survey selected'); setLoading(false); return; }
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/surveys/${surveyId}/responses`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setData(json);
    } catch (e) {
      setError(e.message || 'Failed to load responses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchResponses(); }, [surveyId]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchResponses(); }, [surveyId]);

  const formatDate = (str) => {
    if (!str) return '';
    return new Date(str).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const initials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  };

  const avatarColors = ['#e3f2fd','#e8f5e9','#fffbeb','#fce4ec','#f3e5f5'];
  const avatarTextColors = ['#1565c0','#2d6a4f','#92400e','#880e4f','#4a148c'];

  const getAnswersArray = (answers) => {
    if (!answers) return [];
    if (answers instanceof Map) return Array.from(answers.entries());
    return Object.entries(answers);
  };

  if (loading) return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.loadCenter}><ActivityIndicator size="large" color="#2d6a4f"/>
        <Text style={s.loadTxt}>Loading responses...</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.header}>
        {/* Updated back button to navigate to HomeScreenR */}
        <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreenR')} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a"/>
        </TouchableOpacity>
        <View style={s.hCenter}>
          <Text style={s.hTitle}>Responses</Text>
          <Text style={s.hSub} numberOfLines={1}>{surveyTitle}</Text>
        </View>
        <TouchableOpacity onPress={fetchResponses} style={s.refreshBtn}>
          <Ionicons name="refresh" size={22} color="#2d6a4f"/>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2d6a4f"/>}>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>{data.total}</Text>
            <Text style={s.statLbl}>Total Responses</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statNum,{color:'#2d6a4f'}]}>{data.todayCount}</Text>
            <Text style={s.statLbl}>Today</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statNum,{color:'#FFD700'}]}>{data.total - data.todayCount}</Text>
            <Text style={s.statLbl}>Earlier</Text>
          </View>
        </View>

        {/* Export hint */}
        {data.total > 0 && (
          <View style={s.exportHint}>
            <Ionicons name="information-circle-outline" size={18} color="#406040"/>
            <Text style={s.exportHintTxt}>
              {data.total} response{data.total!==1?'s':''} collected. Export via the backend API endpoint.
            </Text>
          </View>
        )}

        {error && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#ef4444"/>
            <Text style={s.errorTxt}>{error}</Text>
          </View>
        )}

        {data.responses.length === 0 && !error && (
          <View style={s.empty}>
            <Ionicons name="people-outline" size={64} color="#d1d5db"/>
            <Text style={s.emptyTitle}>No responses yet</Text>
            <Text style={s.emptySub}>Responses will appear here as users submit the survey.</Text>
          </View>
        )}

        {data.responses.length > 0 && (
          <Text style={s.sectionLabel}>All Responses</Text>
        )}

        {data.responses.map((resp, i) => {
          const ci = i % avatarColors.length;
          const answers = getAnswersArray(resp.answers);
          return (
            <View key={resp._id||i} style={s.respCard}>
              <View style={s.respTop}>
                <View style={[s.avatar, {backgroundColor: avatarColors[ci]}]}>
                  <Text style={[s.avatarTxt, {color: avatarTextColors[ci]}]}>
                    {initials(resp.userName)}
                  </Text>
                </View>
                <View style={{flex:1}}>
                  <Text style={s.respName}>{resp.userName || 'Anonymous'}</Text>
                  <Text style={s.respTime}>{formatDate(resp.submittedAt)}</Text>
                </View>
                {i < data.todayCount && (
                  <View style={s.newBadge}><Text style={s.newBadgeTxt}>New</Text></View>
                )}
              </View>
              <View style={s.answersWrap}>
                {answers.map(([key, val], ai) => (
                  <View key={ai} style={s.answerRow}>
                    <Text style={s.answerKey} numberOfLines={1}>{key}</Text>
                    <Text style={s.answerVal} numberOfLines={2}>
                      {val === true ? '✓ Yes' : val === false ? '✗ No' : String(val||'—')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <BottomNav active="ResLib"/>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:'#f2f2f2'},
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:14,
    backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#e0e0e0'},
  backBtn:{width:40,height:40,justifyContent:'center',alignItems:'center'},
  hCenter:{flex:1,alignItems:'center'},
  hTitle:{fontSize:18,fontWeight:'700',color:'#1a1a1a'},
  hSub:{fontSize:12,color:'#666',marginTop:2},
  refreshBtn:{width:40,height:40,justifyContent:'center',alignItems:'center'},
  loadCenter:{flex:1,justifyContent:'center',alignItems:'center',gap:16},
  loadTxt:{fontSize:16,color:'#666'},
  container:{padding:16,paddingBottom:100},
  statsRow:{flexDirection:'row',gap:10,marginBottom:16},
  stat:{flex:1,backgroundColor:'#fff',borderRadius:14,padding:16,alignItems:'center',
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:6,elevation:3},
  statNum:{fontSize:26,fontWeight:'700',color:'#1a1a1a'},
  statLbl:{fontSize:12,color:'#666',marginTop:4,textAlign:'center'},
  exportHint:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#e8f5e9',
    borderRadius:12,padding:12,marginBottom:14,borderWidth:1,borderColor:'#b7e4c7'},
  exportHintTxt:{flex:1,fontSize:13,color:'#2d6a4f',lineHeight:18},
  errorBox:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#fef2f2',
    borderRadius:12,padding:14,marginBottom:16,borderWidth:1,borderColor:'#fecaca'},
  errorTxt:{flex:1,fontSize:14,color:'#ef4444'},
  empty:{alignItems:'center',paddingVertical:60,gap:12},
  emptyTitle:{fontSize:18,fontWeight:'700',color:'#6b7280'},
  emptySub:{fontSize:14,color:'#9ca3af',textAlign:'center',paddingHorizontal:32,lineHeight:20},
  sectionLabel:{fontSize:13,fontWeight:'600',color:'#6b7280',textTransform:'uppercase',
    letterSpacing:0.5,marginBottom:10},
  respCard:{backgroundColor:'#fff',borderRadius:16,padding:16,marginBottom:12,
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:8,elevation:3},
  respTop:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:14},
  avatar:{width:44,height:44,borderRadius:22,justifyContent:'center',alignItems:'center'},
  avatarTxt:{fontSize:14,fontWeight:'700'},
  respName:{fontSize:15,fontWeight:'700',color:'#1a1a1a'},
  respTime:{fontSize:12,color:'#6b7280',marginTop:2},
  newBadge:{backgroundColor:'#EEEDFE',paddingHorizontal:10,paddingVertical:4,borderRadius:10},
  newBadgeTxt:{fontSize:11,fontWeight:'700',color:'#534AB7'},
  answersWrap:{gap:8},
  answerRow:{backgroundColor:'#f9fafb',borderRadius:10,padding:12,
    borderWidth:1,borderColor:'#f3f4f6'},
  answerKey:{fontSize:11,color:'#6b7280',fontWeight:'600',marginBottom:4,textTransform:'uppercase',letterSpacing:0.3},
  answerVal:{fontSize:14,color:'#1a1a1a',lineHeight:20},
});
