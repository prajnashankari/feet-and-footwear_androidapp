import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('http://192.168.154.77:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert('Login successful!');
        navigation.navigate('Home'); // Or pass user_id via navigation
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Something went wrong. Please try again.');
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.buttonContainer} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5', // Light background color
  },
  title: {
    fontSize: 32, // Larger title
    marginBottom: 40, // More space below title
    fontWeight: 'bold',
    color: '#333', // Darker text color
  },
  input: {
    width: '100%',
    height: 50, // Taller input fields
    borderColor: '#ddd', // Lighter border color
    borderWidth: 1,
    marginBottom: 15, // More space between inputs
    paddingHorizontal: 15,
    borderRadius: 8, // More rounded corners
    backgroundColor: '#fff', // White background for inputs
    fontSize: 16,
  },
  buttonContainer: { // Style for the button
    width: '100%',
    marginTop: 10, // Space above button
    backgroundColor: '#007bff', // Blue button color
    borderRadius: 8,
    paddingVertical: 15, // Vertical padding for button text
    alignItems: 'center',
  },
  buttonText: { // Style for button text
    color: '#fff', // White text
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    marginTop: 20, // More space above link
    color: '#007bff', // Blue link color
    fontSize: 16,
  },
});


export default LoginScreen;