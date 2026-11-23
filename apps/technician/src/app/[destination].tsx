import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function Destination() {
  return <SafeAreaView style={{flex:1,backgroundColor:'#07101F',padding:24}}><View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#F5B900',fontSize:76,fontWeight:'900'}}>404</Text><Text accessibilityRole="header" style={{color:'white',fontSize:28,fontWeight:'800'}}>Page Not Found</Text><Text style={{color:'#96A3B8',marginTop:12,textAlign:'center'}}>The page you are looking for is not available.</Text><Pressable onPress={()=>router.replace('/')} accessibilityRole="button" style={{backgroundColor:'#F5B900',borderRadius:14,padding:18,marginTop:28}}><Text style={{color:'#07101F',fontWeight:'800'}}>BACK TO HOME</Text></Pressable></View></SafeAreaView>;
}
