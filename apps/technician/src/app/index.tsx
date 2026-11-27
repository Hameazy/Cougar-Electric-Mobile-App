import { router } from 'expo-router';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { collection, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import { app } from '../../../../packages/backend/firebaseApp';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../../customer/src/parts/Logo';

export default function TechnicianHome() {
  const [summary,setSummary]=useState({today:0,completed:0,active:0,hours:0,earnings:0});
  const [error,setError]=useState('');
  useEffect(()=>{
    let stopJobs=()=>{};
    const stopAuth=onAuthStateChanged(getAuth(app),(user)=>{
      stopJobs();
      setSummary({today:0,completed:0,active:0,hours:0,earnings:0});
      if(!user) return;
      // CE-42 and CE-43 must use this same canonical assignment field.
      stopJobs=onSnapshot(query(collection(getFirestore(app),'serviceRequests'),where('assignedTechnician.id','==',user.uid)),snapshot=>{
        const jobs=snapshot.docs.map(item=>item.data());
        const today=jobs.filter(job=>{
          const date=job.updatedAt?.toDate?.();
          return date instanceof Date && date.toDateString()===new Date().toDateString();
        });
        setSummary({today:today.length,completed:today.filter(j=>['completed','paid'].includes(j.status)).length,active:jobs.filter(j=>!['completed','paid','cancelled','no-match'].includes(j.status)).length,hours:today.reduce((n,j)=>n+(typeof j.laborHours==='number'?j.laborHours:0),0),earnings:today.reduce((n,j)=>n+(typeof j.technicianEarnings==='number'?j.technicianEarnings:0),0)});
        setError('');
      },()=>setError('Your job summary could not be loaded.'));
    });
    return ()=>{stopAuth();stopJobs();};
  },[]);
  const navigate=(destination:string)=>{
    if(destination==='navigation') {
      router.push('/navigation');
      return;
    }
    router.push({pathname:'/[destination]',params:{destination}});
  };
  const links = [
    { title: 'Jobs', icon: '▤', detail: `${summary.active} active, ${summary.completed} completed`, color: '#F5B900', path: 'jobs' },
    { title: 'Service Request Offers', icon: 'ϟ', detail: 'Review incoming service requests', color: '#F5B900', path: 'service-request-offer' },
    { title: 'Navigate to Customer', icon: '◫', detail: 'Directions to your assigned job', color: '#65ABFF', path: 'navigation' },
    { title: 'On-Site Job', icon: '⌂', detail: 'Open your on-site workspace', color: '#F5B900', path: 'on-site' },
    { title: 'Estimates & Work Documentation', icon: '▤', detail: 'Estimates, materials, hours, photos and signature', color: '#F5B900', path: 'work-documentation' },
    { title: 'Messages', icon: '☏', detail: 'Messages from dispatch', color: '#65ABFF', path: 'messages' },
    { title: 'Earnings', icon: '▭', detail: `$${summary.earnings.toFixed(2)} today`, color: '#20CC79', path: 'earnings' },
    { title: 'Settings', icon: '☼', detail: 'Skills, radius, working hours', color: '#F5B900', path: 'settings' },
  ];
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <View style={s.topbar}><Pressable accessibilityLabel="Open menu" onPress={()=>navigate('menu')}><Text style={s.white}>☰</Text></Pressable><Pressable accessibilityLabel="Notifications" onPress={()=>navigate('notifications')}><Text style={s.white}>♢</Text></Pressable></View>
    <Logo />
    <View style={s.hero}><Text style={s.brand}>TECHNICIAN WORKSPACE</Text><Text style={s.heading}>Powering service.{`\n`}Every day.</Text><Text style={s.detail}>Your jobs, team, and earnings in one place.</Text></View>
    <Pressable onPress={()=>navigate('settings')} style={s.availability}><Text style={{color:'#07101F',fontSize:17,fontWeight:'900'}}>MANAGE AVAILABILITY</Text><View style={s.row}><Text style={s.muted}>Manage availability and service radius</Text><Text style={s.emergency}>ϟ EMERGENCY</Text></View></Pressable>
    <View style={s.stats}><View style={s.stat}><Text style={s.label}>TODAY’S JOBS</Text><Text style={s.number}>{summary.today}</Text><Text style={s.green}>✓ {summary.completed} complete</Text></View><View style={s.stat}><Text style={s.label}>HOURS WORKED</Text><Text style={s.number}>{summary.hours.toFixed(1)}</Text><Text style={s.muted}>Today’s logged hours</Text></View></View>
    {!!error&&<Text accessibilityRole="alert" style={s.muted}>{error}</Text>}
    <View style={s.links}>{links.map(link=><Pressable key={link.path} accessibilityRole="button" onPress={()=>navigate(link.path)} style={({pressed})=>[s.link,pressed&&{opacity:.6}]}><View style={[s.icon,{borderColor:link.color+'55'}]}><Text style={{color:link.color,fontSize:26}}>{link.icon}</Text></View><View style={{flex:1}}><Text style={s.white}>{link.title}</Text><Text style={s.detail}>{link.detail}</Text></View><Text style={s.chevron}>›</Text></Pressable>)}</View>
    </ScrollView><View style={s.bottom}>{[{title:'Home',icon:'⌂',path:''},{title:'Jobs',icon:'▤',path:'jobs'},{title:'Map',icon:'◫',path:'map'},{title:'More',icon:'•••',path:'more'}].map(tab=><Pressable key={tab.title} accessibilityRole="button" accessibilityState={{selected:!tab.path}} onPress={()=>navigate(tab.path||'home')} style={s.tab}><Text style={[s.tabIcon,!tab.path&&s.yellow]}>{tab.icon}</Text><Text style={[s.tabText,!tab.path&&s.yellow]}>{tab.title}</Text></Pressable>)}</View></SafeAreaView>;
}
const s=StyleSheet.create({topbar:{flexDirection:'row',justifyContent:'space-between',paddingVertical:10},hero:{paddingVertical:12},safe:{flex:1,backgroundColor:'#07101F'},content:{width:'100%',maxWidth:620,alignSelf:'center',padding:28,gap:18,flexGrow:1},brand:{color:'#F5B900',letterSpacing:2,fontSize:10,fontWeight:'800'},heading:{color:'white',fontSize:43,lineHeight:48,letterSpacing:-1.5,fontWeight:'900'},availability:{backgroundColor:'#F5B900',borderColor:'#2A3548',borderWidth:1,borderRadius:22,padding:20,gap:12},row:{flexDirection:'row',flexWrap:'wrap',gap:12,alignItems:'center',justifyContent:'space-between'},white:{color:'#FFF',fontSize:17,fontWeight:'700'},muted:{color:'#74839B',fontSize:12},emergency:{color:'#F5B900',borderColor:'#886B0B',borderWidth:1,borderRadius:20,padding:7,fontSize:11,fontWeight:'800'},stats:{flexDirection:'row',gap:12},stat:{flex:1,backgroundColor:'#111722',borderColor:'#293244',borderWidth:1,borderRadius:19,padding:20,gap:12},label:{color:'#74839B',fontSize:10,fontWeight:'800',letterSpacing:1},number:{color:'white',fontSize:34,fontWeight:'800'},green:{color:'#53E49A',fontSize:13,fontWeight:'700'},links:{backgroundColor:'#101827',borderColor:'#293244',borderWidth:1,borderRadius:22,overflow:'hidden'},link:{flexDirection:'row',alignItems:'center',gap:16,padding:20,minHeight:94,borderBottomColor:'#293244',borderBottomWidth:StyleSheet.hairlineWidth},icon:{width:48,height:48,backgroundColor:'#142139',borderRadius:15,borderWidth:1,alignItems:'center',justifyContent:'center'},detail:{color:'#94A2B8',fontSize:13,marginTop:7},chevron:{color:'white',fontSize:31},bottom:{flexDirection:'row',borderTopColor:'#263044',borderTopWidth:1,paddingTop:12,paddingBottom:14},tab:{flex:1,alignItems:'center',gap:5,minHeight:48},tabIcon:{color:'#697991',fontSize:25},tabText:{color:'#697991',fontSize:11,fontWeight:'700'},yellow:{color:'#F5B900'}});
