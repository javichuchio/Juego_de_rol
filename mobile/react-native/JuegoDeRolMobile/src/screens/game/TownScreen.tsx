import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

type TownScreenProps = {
  onGoStore: () => void;
  onGoCave: () => void;
  onFightDragon: () => void;
};

export default function TownScreen({
  onGoStore,
  onGoCave,
  onFightDragon,
}: TownScreenProps): React.JSX.Element {
  return (
    <View style={styles.controls}>
      <Pressable style={styles.button} onPress={onGoStore}>
        <Text style={styles.buttonText}>Ir a la tienda</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={onGoCave}>
        <Text style={styles.buttonText}>Ir a la cueva</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={onFightDragon}>
        <Text style={styles.buttonText}>Luchar contra el dragon</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  button: {
    width: '100%',
    backgroundColor: '#feac32',
    borderColor: '#feac32',
    borderWidth: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0a0a23',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 15,
  },
});
