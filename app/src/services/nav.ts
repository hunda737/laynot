import { router } from 'expo-router';

/** Back if there is somewhere to go back to, otherwise Home (e.g. after a deep link or reload). */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/home');
}
