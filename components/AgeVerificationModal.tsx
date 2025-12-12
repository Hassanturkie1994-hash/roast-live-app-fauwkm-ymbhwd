
import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';

interface AgeVerificationModalProps {
  visible: boolean;
  onVerify: () => void;
  onCancel: () => void;
}

export default function AgeVerificationModal({ visible, onVerify, onCancel }: AgeVerificationModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Age Verification</Text>
          <Text style={styles.text}>You must be 18 or older to continue</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.button} onPress={onVerify}>
              <Text style={styles.buttonText}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
