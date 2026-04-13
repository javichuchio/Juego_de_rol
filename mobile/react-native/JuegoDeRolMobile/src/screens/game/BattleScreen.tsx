import React from 'react';
import {Pressable, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import type {Monster} from '../../state/gameData';

type BattleScreenProps = {
  monster: Monster;
  monsterHealth: number;
  onAttack: () => void;
  onDodge: () => void;
  onFlee: () => void;
};

export default function BattleScreen({
  monster,
  monsterHealth,
  onAttack,
  onDodge,
  onFlee,
}: BattleScreenProps): React.JSX.Element {
  const {width} = useWindowDimensions();
  const isCompact = width < 390;

  return (
    <View>
      <View style={styles.monsterCard}>
        <Text style={styles.monsterTitle}>En combate: {monster.name}</Text>
        <Text style={styles.monsterHealth}>Vida monstruo: {monsterHealth}</Text>
      </View>
      <View style={[styles.row, isCompact && styles.rowStacked]}>
        <Pressable style={[styles.smallButton, isCompact && styles.smallButtonStacked]} onPress={onAttack}>
          <Text style={styles.buttonText}>Atacar</Text>
        </Pressable>
        <Pressable style={[styles.smallButton, isCompact && styles.smallButtonStacked]} onPress={onDodge}>
          <Text style={styles.buttonText}>Esquivar</Text>
        </Pressable>
        <Pressable style={[styles.smallButton, isCompact && styles.smallButtonStacked]} onPress={onFlee}>
          <Text style={styles.buttonText}>Huir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monsterCard: {
    backgroundColor: 'rgba(199, 13, 13, 0.9)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  monsterTitle: {
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 2,
    fontSize: 17,
  },
  monsterHealth: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  row: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    gap: 8,
  },
  rowStacked: {
    flexDirection: 'column',
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#feac32',
    borderColor: '#feac32',
    borderWidth: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  smallButtonStacked: {
    flex: 0,
  },
  buttonText: {
    color: '#0a0a23',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 15,
  },
});
