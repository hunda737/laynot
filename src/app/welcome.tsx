import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand } from '@/components/Brand';
import { CategoryTile } from '@/components/CategoryTile';
import { FadeInUp, Float, PopIn } from '@/components/motion';
import { Button, Screen, Segmented, Txt } from '@/components/ui';
import { CATEGORIES } from '@/data/questions';
import { useT, type Language } from '@/i18n';
import { useGame } from '@/store/useGameStore';
import { space } from '@/theme/tokens';

/** The category tiles, laid out as three short rows. */
const ROWS = [CATEGORIES.slice(0, 3), CATEGORIES.slice(3, 5), CATEGORIES.slice(5, 8)];
const TILT = ['-6deg', '4deg', '-3deg', '7deg', '-5deg', '3deg', '-7deg', '5deg'];

export default function Welcome() {
  const { t, lang } = useT();
  const markOnboarded = useGame((s) => s.markOnboarded);
  const setLanguage = useGame((s) => s.setLanguage);

  const play = () => {
    markOnboarded();
    router.replace('/daily/play');
  };
  const skip = () => {
    markOnboarded();
    router.replace('/home');
  };

  let n = 0;
  return (
    <Screen scroll={false} edges={['top', 'bottom', 'left', 'right']} contentStyle={styles.root}>
      <View style={styles.top}>
        <Brand size={24} />
        <View style={{ width: 150 }}>
          <Segmented<Language>
            value={lang}
            onChange={setLanguage}
            options={[
              { value: 'en', label: 'EN' },
              { value: 'am', label: 'አማ' },
            ]}
          />
        </View>
      </View>

      <View style={styles.middle}>
        <View style={styles.mosaic}>
          {ROWS.map((row, r) => (
            <View key={r} style={styles.mosaicRow}>
              {row.map((c) => {
                const i = n++;
                return (
                  <PopIn key={c.id} index={i} delay={150}>
                    <Float index={i}>
                      <CategoryTile id={c.id} size="sm" style={{ transform: [{ rotate: TILT[i % TILT.length] }] }} />
                    </Float>
                  </PopIn>
                );
              })}
            </View>
          ))}
        </View>

        <FadeInUp delay={520} style={{ gap: space.md }}>
          <Txt variant="hero" center>
            {t('welcome.title')}
          </Txt>
          <Txt tone="muted" center>
            {t('welcome.body')}
          </Txt>
        </FadeInUp>
      </View>

      <FadeInUp delay={680} style={{ gap: space.lg }}>
        <Button label={t('welcome.cta')} icon="play" onPress={play} />
        <Pressable onPress={skip} hitSlop={10} accessibilityRole="button">
          <Txt variant="small" tone="muted" center style={{ fontWeight: '700' }}>
            {t('welcome.skip')}
          </Txt>
        </Pressable>
      </FadeInUp>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { justifyContent: 'space-between', paddingTop: space.lg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  middle: { gap: space.xxl, alignItems: 'center' },
  mosaic: { gap: space.lg, alignItems: 'center' },
  mosaicRow: { flexDirection: 'row', gap: space.lg },
});
