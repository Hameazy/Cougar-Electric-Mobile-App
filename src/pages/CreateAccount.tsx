import { Link } from 'expo-router';
import { styles } from '../styles/PageStyle';
import { Logo } from '../parts/Logo';
import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextBox } from '../parts/TextBox';
import { validateRegistration, type Errors, type Registration } from '../helpers/AccountHelp';

const emptyForm: Registration = { fullName: '', email: '', phone: '', address: '', city: '', state: '', zip: '', password: '', confirmPassword: '' };

export default function CreateAccount() {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const scroll = useRef<ScrollView>(null);

  const change = (key: keyof Registration) => (text: string) => {
    const next = { ...values, [key]: text };
    setValues(next);
    if (attempted) setErrors(validateRegistration(next));
    setMessage('');
  };

  function submit() {
    Keyboard.dismiss();
    setAttempted(true);
    const validation = validateRegistration(values);
    setErrors(validation);
    setMessage('');
    if (Object.keys(validation).length) {
      setMessage('Please check the highlighted fields below.');
      scroll.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setValues(emptyForm);
    setSuccess(true);
    scroll.current?.scrollTo({ y: 0, animated: true });
  }

  const field = (key: keyof Registration) => ({ value: values[key], onChangeText: change(key), error: errors[key] });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View pointerEvents="none" accessible={false} style={styles.backdrop}>
            <View style={styles.rail} />
            <View style={styles.windows}><View style={styles.window} /><View style={styles.window} /><View style={styles.window} /></View>
            <View style={styles.rail} />
          </View>
          <View style={styles.topline}><Link href="/" replace style={styles.textLink}>← Sign in</Link><Text style={styles.step}>CREATE ACCOUNT</Text></View>
          <Logo />
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>RELIABLE. PROFESSIONAL. LOCAL.</Text>
            <Text style={styles.title}>{success ? 'You’re all set.' : 'Electrical help.\nWhen you need it.'}</Text>
            <Text style={styles.subtitle}>{success ? 'Welcome to Cougar Electric.' : 'Create your customer account to get connected with electrical help when it matters most.'}</Text>
            <View style={styles.pill}><View style={styles.dot} /><Text style={styles.pillText}>Residential  •  Commercial  •  Industrial</Text></View>
          </View>
          {success ? (
            <View style={styles.card}>
              <Text style={styles.successIcon}>✓</Text>
              <Text accessibilityRole="header" style={styles.cardTitle}>Welcome to Cougar Electric</Text>
              <Text accessibilityLiveRegion="polite" style={styles.subtitle}>Continue to sign in to access your account.</Text>
              <Link href="/" replace asChild><Pressable accessibilityRole="link" style={styles.button}><Text style={styles.buttonText}>CONTINUE TO SIGN IN  →</Text></Pressable></Link>
            </View>
          ) : (
            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.cardTitle}>Create your account</Text>
              <Text style={styles.cardSubtitle}>All fields are required.</Text>
              {!!message && <View style={styles.notice}><Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.noticeText}>{message}</Text></View>}
              <Text accessibilityRole="header" style={styles.section}>01   YOUR DETAILS</Text>
              <TextBox label="Full name" placeholder="First and last name" autoComplete="name" textContentType="name" autoCapitalize="words" {...field('fullName')} />
              <TextBox label="Email address" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" {...field('email')} />
              <TextBox label="Phone number" placeholder="(555) 123-4567" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" hint="So we can contact you about your service." {...field('phone')} />
              <Text accessibilityRole="header" style={styles.section}>02   SERVICE ADDRESS</Text>
              <TextBox label="Street address" placeholder="123 Main St, Apt 4" autoComplete="street-address" textContentType="fullStreetAddress" autoCapitalize="words" {...field('address')} />
              <TextBox label="City" placeholder="City" textContentType="addressCity" autoCapitalize="words" {...field('city')} />
              <View style={styles.row}>
                <View style={styles.flex}><TextBox label="State" placeholder="CA" autoCapitalize="characters" autoCorrect={false} maxLength={2} textContentType="addressState" {...field('state')} /></View>
                <View style={styles.flex}><TextBox label="ZIP code" placeholder="95814" keyboardType="numbers-and-punctuation" maxLength={10} autoComplete="postal-code" textContentType="postalCode" {...field('zip')} /></View>
              </View>
              <Text accessibilityRole="header" style={styles.section}>03   SECURE YOUR ACCOUNT</Text>
              <TextBox label="Password" placeholder="Create a password" password autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" hint="Use at least 12 characters." {...field('password')} />
              <TextBox label="Confirm password" placeholder="Enter your password again" password autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" {...field('confirmPassword')} />
              <Pressable accessibilityRole="button" onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
                <Text style={styles.buttonText}>CREATE ACCOUNT   →</Text>
              </Pressable>
              <View style={styles.accountLink}><Text style={styles.cardSubtitle}>Already have an account?</Text><Link href="/" replace style={styles.textLink}>Sign in</Link></View>
            </View>
          )}
          <Text style={styles.footer}>COUGAR ELECTRIC INC.  ·  CUSTOMER REGISTRATION</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

