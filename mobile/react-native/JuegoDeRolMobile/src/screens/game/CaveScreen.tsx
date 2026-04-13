import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

type CaveScreenProps = {
  onFightBeast: () => void;
  onFightWalker: () => void;
  onGoTown: () => void;
};

export default function CaveScreen({
  onFightBeast,
  onFightWalker,
  onGoTown,
}: CaveScreenProps): React.JSX.Element {
  return (
    <View style={styles.controls}>
      <Pressable style={styles.button} onPress={onFightBeast}>
        <Text style={styles.buttonText}>Bestia</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={onFightWalker}>
        <Text style={styles.buttonText}>Caminante</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={onGoTown}>
        <Text style={styles.buttonText}>Volver pueblo</Text>
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
