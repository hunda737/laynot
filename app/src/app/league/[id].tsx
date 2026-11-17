import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FadeInUp, PopIn } from '@/components/motion';
import { Button, Card, HeroCard, Icon, Screen, SectionHeader, TopBar, Txt } from '@/components/ui';
import { useYouInput } from '@/hooks/useBoard';
import { formatDay, useT } from '@/i18n';
import { encodeLeague, FRIENDS_LEAGUE_ID, leagueMembers } from '@/lib/league';
import { haptic } from '@/services/haptics';
import { appLink, copyText, shareMessage } from '@/services/share';
import { useGame } from '@/store/useGameStore';
import { modeColors, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function LeaguePage() {
  const { colors } = useTheme();
  const { t, lang } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const league = useGame((s) => s.leagues.find((l) => l.id === id));
  const leaveLeague = useGame((s) => s.leaveLeague);
  const you = useYouInput();
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const isFriends = id === FRIENDS_LEAGUE_ID;
  const members = useMemo(() => leagueMembers(id ?? '', league?.extra), [id, league?.extra]);
  if (!isFriends && !league) return <Redirect href="/ranks" />;

  const name = league ? league.name : t('ranks.friends');
  const code = league ? encodeLeague(league) : '';
  const seeBoard = () => router.dismissTo({ pathname: '/ranks', params: { league: id } });

  return (
    <Screen>
      <TopBar title={name} />

      <PopIn>
        <HeroCard color={modeColors.duel} align="center" pattern="rings">
          <View style={styles.heroIcon}>
            <Icon name={isFriends ? 'people' : 'shield'} size={30} color={colors.onAccent} />
          </View>
          <Txt variant="title" tone="onAccent" center>
            {name}
          </Txt>
          <Txt variant="small" tone="onAccent" center style={{ opacity: 0.9 }}>
            {[
              t('league.members', { n: members.length + 1 }),
              league && (league.mine ? t('league.yours') : t('league.joinedOn', { date: formatDay(lang, league.joinedDay) })),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Txt>
        </HeroCard>
      </PopIn>

      {isFriends ? (
        <FadeInUp index={1}>
          <Txt tone="muted">{t('ranks.friendsNote')}</Txt>
        </FadeInUp>
      ) : (
        <FadeInUp index={1}>
          <Card>
            <Txt variant="heading">{t('league.inviteTitle')}</Txt>
            <Txt variant="small" tone="muted">
              {t('league.inviteBody')}
            </Txt>
            <View style={[styles.code, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Txt selectable variant="bodyStrong" style={{ fontFamily: 'monospace' }}>
                {code}
              </Txt>
            </View>
            <View style={{ gap: space.sm }}>
              <Button
                label={t('league.share')}
                icon="share-social"
                onPress={() => shareMessage(t('league.shareText', { name, link: appLink('/league/join', code), code }))}
              />
              <Button
                label={copied ? t('league.copied') : t('league.copy')}
                kind="secondary"
                icon={copied ? 'checkmark' : 'copy-outline'}
                onPress={async () => {
                  if (await copyText(code)) {
                    haptic.tap();
                    setCopied(true);
                  }
                }}
              />
            </View>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp index={2}>
        <Button label={t('league.seeBoard')} kind="secondary" icon="podium" onPress={seeBoard} />
      </FadeInUp>

      <FadeInUp index={3}>
        <SectionHeader title={t('league.membersTitle')} />
      </FadeInUp>
      <Card style={{ gap: space.sm }}>
        <FadeInUp index={4}>
          <MemberRow name={you.name} sub={t('ranks.you')} highlight />
        </FadeInUp>
        {members.map((m, i) => (
          <FadeInUp key={m.id} index={Math.min(5 + i, 10)}>
            <MemberRow name={m.name} sub={m.city} />
          </FadeInUp>
        ))}
      </Card>

      {!isFriends && (
        <View style={[styles.note, { backgroundColor: colors.goldSoft }]}>
          <Icon name="information-circle" color={colors.gold} />
          <Txt variant="small" style={{ flex: 1 }}>
            {t('league.demoNote')}
          </Txt>
        </View>
      )}

      {league && <Button label={t('league.leave')} kind="ghost" icon="exit-outline" onPress={() => setConfirmLeave(true)} />}

      <ConfirmDialog
        visible={confirmLeave}
        title={t('league.leaveTitle', { name })}
        body={t('league.leaveBody')}
        confirmLabel={t('league.leaveConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          if (league) leaveLeague(league.id);
          router.dismissTo('/ranks');
        }}
      />
    </Screen>
  );
}

function MemberRow({ name, sub, highlight }: { name: string; sub: string; highlight?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.member}>
      <Avatar name={name} color={highlight ? colors.primaryStrong : undefined} />
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {name}
        </Txt>
        <Txt variant="small" tone="muted">
          {sub}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  code: { padding: space.md, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed' },
  member: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  note: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', padding: space.md, borderRadius: radius.md },
});
